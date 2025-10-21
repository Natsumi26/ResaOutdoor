import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  constructWebhookEvent,
  createConnectAccountLink,
  createConnectAccountLinkForExisting,
  getConnectAccount,
  createLoginLink,
  createGiftVoucherCheckoutSession
} from '../services/stripe.service.js';
import { sendPaymentConfirmation, sendGiftVoucherEmail } from '../services/email.service.js';

const router = express.Router();

/**
 * Créer une session de paiement Stripe pour une réservation
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', authMiddleware, async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      throw new AppError('bookingId et amount requis', 400);
    }

    // Charger la réservation complète
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: {
          include: {
            guide: true
          }
        },
        product: true
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    // Créer la session Stripe
    const checkoutSession = await createCheckoutSession(booking, parseFloat(amount));

    res.json({
      success: true,
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Vérifier le statut d'un paiement après redirection
 * GET /api/stripe/verify-payment/:sessionId
 */
router.get('/verify-payment/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await retrieveCheckoutSession(sessionId);

    if (session.payment_status === 'paid') {
  const bookingId = session.client_reference_id;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError('Réservation introuvable', 404);

  const amountPaid = session.amount_total / 100;
  const newTotalPaid = booking.amountPaid + amountPaid;

  await prisma.payment.create({
    data: {
      amount: amountPaid,
      method: 'stripe',
      notes: `Payment Intent: ${session.payment_intent}`,
      bookingId
    }
  });

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      amountPaid: newTotalPaid,
      status: newTotalPaid >= booking.totalPrice ? 'confirmed' : booking.status
    },
    include: {
    product: true,
    session: {
      include: {
        guide: true // si tu veux aussi le guide dans l’email
      }
    }
  }
  });

  await prisma.bookingHistory.create({
    data: {
      action: 'payment',
      details: `Paiement Stripe de ${amountPaid}€`,
      bookingId
    }
  });

  sendPaymentConfirmation(updatedBooking, amountPaid).catch(err => {
    console.log(updatedBooking)
    console.error('Erreur envoi email:', err);
  });

  return res.json({
    success: true,
    paid: true,
    bookingId,
    amount: amountPaid
  });
} else {
      res.json({
        success: true,
        paid: false,
        status: session.payment_status
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Webhook Stripe pour confirmer les paiements
 * POST /api/stripe/webhook
 * IMPORTANT: Le raw body est géré dans server.js AVANT express.json()
 */
router.post('/', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    // Vérifier la signature du webhook
    event = constructWebhookEvent(req.body, signature);
  } catch (error) {
    console.error('Erreur de signature Stripe:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // ✅ Réponse immédiate à Stripe
  res.status(200).send('ok');

  // 🔁 Traiter l'événement en arrière-plan
  setImmediate(async () => {
    try {
      console.log('Webhook Stripe reçu:', event.type);

      // Gérer les différents types d'événements
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;

          // Vérifier si c'est un achat de bon cadeau
          if (session.metadata && session.metadata.type === 'gift_voucher') {
            try {
              const paymentIntentId = session.payment_intent;
              const buyerEmail = session.metadata?.buyerEmail;
              const amount = parseFloat(session.metadata?.amount);

              if (!buyerEmail || !amount || !paymentIntentId) {
                console.warn('Données manquantes pour le bon cadeau');
                return;
              }

              // Vérifier si un bon existe déjà pour ce paiement
              const existingVoucher = await prisma.giftVoucher.findFirst({
                where: { notes: paymentIntentId }
              });

              if (existingVoucher) {
                console.log('🎁 Bon cadeau déjà généré pour ce paiement');
                return;
              }
              // Générer un code unique
              const generateCode = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
              };

              let code;
              let isUnique = false;

              while (!isUnique) {
                code = generateCode();
                const existing = await prisma.giftVoucher.findUnique({ where: { code } });
                if (!existing) isUnique = true;
              }
              // Créer le bon cadeau
              const voucher = await prisma.giftVoucher.create({
                data: {
                  code,
                  amount,
                  discountType: 'fixed',
                  type: 'voucher',
                  maxUsages: 1,
                  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
                  notes: paymentIntentId
                }
              });

              console.log('✅ Bon cadeau créé :', code, 'pour', amount, '€');

              // Envoyer l’email
              await sendGiftVoucherEmail(buyerEmail, code, amount, session.metadata);
              console.log('📧 Email envoyé à', buyerEmail);
            } catch (error) {
              console.error('💥 Erreur dans handleGiftVoucher:', error);
            }

            break;
          }

        // Sinon, c'est un paiement de réservation classique
        const bookingId = session.client_reference_id || session.metadata.bookingId;
        if (!bookingId) {
          console.error('Aucun bookingId dans la session Stripe');
          break;
        }

        const booking = await prisma.booking.findUnique({where: { id: bookingId }});
        if (!booking) {
          console.error('Réservation non trouvée:', bookingId);
          break;
        }

        // Montant payé (en euros)
        const amountPaid = session.amount_total / 100;

        // Créer l'entrée de paiement
        await prisma.payment.create({
          data: {
            amount: amountPaid,
            method: 'stripe',
            notes: `Payment Intent: ${session.payment_intent}`,
            bookingId: booking.id
          }
        });

        // Mettre à jour le montant total payé
        const newTotalPaid = booking.amountPaid + amountPaid;

        const updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            amountPaid: newTotalPaid,
            status: newTotalPaid >= booking.totalPrice ? 'confirmed' : booking.status
          },
          include: {
            session: {
              include: {
                guide: true
              }
            },
            product: true
          }
        });

        // Ajouter à l'historique
        await prisma.bookingHistory.create({
          data: {
            action: 'payment',
            details: `Paiement Stripe de ${amountPaid}€`,
            bookingId: booking.id
          }
        });

        console.log('Paiement confirmé pour la réservation:', bookingId);

        // Envoyer l'email de confirmation de paiement
        sendPaymentConfirmation(updatedBooking, amountPaid).catch(err => {
          console.error('Erreur envoi email de confirmation de paiement:', err);
          // L'email échoue mais le paiement est enregistré
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Échec de paiement:', paymentIntent.id);
        // TODO: Notifier le client de l'échec
        break;
      }

      default:
        console.log('Événement non géré:', event.type);
    }
  } catch (error) {
    console.error('Erreur traitement webhook Stripe:', error);
  }
});
});


/**
 * Connecter un compte Stripe pour un guide
 * POST /api/stripe/connect/onboard
 */
router.post('/connect/onboard', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
console.log(user)
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Si l'utilisateur a déjà un compte Stripe Connect
    if (user.stripeAccount) {
      // Créer un nouveau lien d'onboarding
      const link = await createConnectAccountLinkForExisting(user.stripeAccount);
      return res.json({
        success: true,
        url: link.url,
        accountId: user.stripeAccount
      });
    }

    // Créer un nouveau compte Stripe Connect
    const result = await createConnectAccountLink(userId, user.email);

    // Sauvegarder l'ID du compte Stripe
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccount: result.accountId }
    });

    res.json({
      success: true,
      url: result.url,
      accountId: result.accountId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Obtenir les informations du compte Stripe Connect
 * GET /api/stripe/connect/account
 */
router.get('/connect/account', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.stripeAccount) {
      return res.json({
        success: true,
        connected: false
      });
    }

    // Récupérer les infos du compte Stripe
    const account = await getConnectAccount(user.stripeAccount);

    res.json({
      success: true,
      connected: true,
      account: {
        id: account.id,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        country: account.country
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Créer un lien vers le dashboard Stripe Express
 * POST /api/stripe/connect/dashboard
 */
router.post('/connect/dashboard', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.stripeAccount) {
      throw new AppError('Compte Stripe non configuré', 404);
    }

    // Créer le lien de connexion au dashboard
    const link = await createLoginLink(user.stripeAccount);

    res.json({
      success: true,
      url: link.url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Déconnecter le compte Stripe
 * POST /api/stripe/connect/disconnect
 */
router.post('/connect/disconnect', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Supprimer le lien avec le compte Stripe
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccount: null }
    });

    res.json({
      success: true,
      message: 'Compte Stripe déconnecté'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Créer une session de paiement Stripe pour l'achat d'un bon cadeau
 * POST /api/stripe/create-gift-voucher-checkout
 */
router.post('/create-gift-voucher-checkout', async (req, res, next) => {
  try {
    const { amount, buyerEmail, recipientEmail, recipientName, message } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Montant invalide', 400);
    }

    if (!buyerEmail) {
      throw new AppError('Email de l\'acheteur requis', 400);
    }

    // Créer la session Stripe pour le bon cadeau
    const checkoutSession = await createGiftVoucherCheckoutSession(
      parseFloat(amount),
      buyerEmail,
      recipientEmail,
      recipientName,
      message
    );

    res.json({
      success: true,
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Vérifier le paiement d'un bon cadeau après redirection
 * GET /api/stripe/verify-gift-voucher-payment/:sessionId
 */
router.get('/verify-gift-voucher-payment/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await retrieveCheckoutSession(sessionId);

    if (session.payment_status === 'paid') {
      // Chercher le bon cadeau par le payment_intent
      const voucher = await prisma.giftVoucher.findFirst({
        where: {
          notes: session.payment_intent
        }
      });

      if (voucher) {
        return res.json({
          success: true,
          paid: true,
          voucher
        });
      }

      // Le bon cadeau n'a pas encore été créé par le webhook
      // Cela peut arriver si le webhook est en retard
      return res.json({
        success: true,
        paid: true,
        pending: true,
        message: 'Paiement confirmé, le bon cadeau est en cours de création'
      });
    } else {
      res.json({
        success: true,
        paid: false,
        status: session.payment_status
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
