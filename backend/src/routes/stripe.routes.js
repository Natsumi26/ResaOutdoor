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
import { sendPaymentConfirmation, sendGiftVoucherEmail, sendBookingConfirmation, sendGuideNewBookingNotification } from '../services/email.service.js';
import stripe from '../config/stripe.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notifyAdmins, createNewBookingNotification, updateCalendar } from '../services/notification.service.js';

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
 * Créer une session de paiement Stripe AVANT la création de la réservation
 * POST /api/stripe/create-booking-checkout
 */
router.post('/create-booking-checkout', async (req, res, next) => {
  try {
    const { sessionId, productId, bookingData, participants } = req.body;

    if (!sessionId || !productId || !bookingData) {
      throw new AppError('sessionId, productId et bookingData requis', 400);
    }

    // Charger la session et le produit
    const [session, product] = await Promise.all([
      prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          guide: true,
          bookings: true
        }
      }),
      prisma.product.findUnique({
        where: { id: productId }
      })
    ]);

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const sessionDate = format(new Date(session.date), 'dd MMMM yyyy', { locale: fr });

    // Créer la session Stripe avec toutes les métadonnées nécessaires
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${product.name} - ${sessionDate}`,
              description: `${session.timeSlot} - ${session.startTime} | ${bookingData.numberOfPeople} personne(s)`,
              images: product.images && product.images.length > 0
                ? [product.images[0].startsWith('http') ? product.images[0] : `${process.env.APP_URL || 'http://localhost:5000'}${product.images[0]}`]
                : []
            },
            unit_amount: Math.round(bookingData.totalPrice * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
      customer_email: bookingData.clientEmail,
      metadata: {
        type: 'new_booking',
        sessionId: sessionId,
        productId: productId,
        bookingData: JSON.stringify(bookingData),
        participants: participants ? JSON.stringify(participants) : null
      }
    };

    // Créer la session de checkout
    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    res.json({
      success: true,
      sessionId: checkoutSession.id,
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

      return res.json({
        success: true,
        paid: true,
        bookingId: session.client_reference_id,
        amount: session.amount_total / 100
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
 * Vérifier le statut d'un paiement de nouvelle réservation après redirection
 * GET /api/stripe/verify-booking-payment/:sessionId
 */
router.get('/verify-booking-payment/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await retrieveCheckoutSession(sessionId);

    if (session.payment_status === 'paid') {
      // Vérifier si c'est une nouvelle réservation
      if (session.metadata && session.metadata.type === 'new_booking') {
        // Chercher la réservation créée par le webhook
        const bookingData = JSON.parse(session.metadata.bookingData);

        // Chercher la réservation par email et session
        const booking = await prisma.booking.findFirst({
          where: {
            clientEmail: bookingData.clientEmail,
            sessionId: session.metadata.sessionId,
            amountPaid: session.amount_total / 100
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (booking) {
          return res.json({
            success: true,
            paid: true,
            bookingId: booking.id,
            amount: session.amount_total / 100
          });
        } else {
          // Le webhook n'a pas encore créé la réservation
          return res.json({
            success: true,
            paid: true,
            pending: true,
            message: 'Paiement confirmé, réservation en cours de création'
          });
        }
      }

      // Pour les anciens paiements
      return res.json({
        success: true,
        paid: true,
        bookingId: session.client_reference_id,
        amount: session.amount_total / 100
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
          const stripeSession = event.data.object;

          // CAS 1: Nouvelle réservation avec paiement Stripe
          if (stripeSession.metadata && stripeSession.metadata.type === 'new_booking') {
            try {
              console.log('🆕 Création de réservation après paiement Stripe');

              const sessionId = stripeSession.metadata.sessionId;
              const productId = stripeSession.metadata.productId;
              const bookingData = JSON.parse(stripeSession.metadata.bookingData);
              const participants = stripeSession.metadata.participants ? JSON.parse(stripeSession.metadata.participants) : null;
              const amountPaid = stripeSession.amount_total / 100;

              // Créer la réservation avec transaction
              const booking = await prisma.$transaction(async (tx) => {
                const newBooking = await tx.booking.create({
                  data: {
                    clientFirstName: bookingData.clientFirstName,
                    clientLastName: bookingData.clientLastName,
                    clientEmail: bookingData.clientEmail,
                    clientPhone: bookingData.clientPhone,
                    clientNationality: bookingData.clientNationality,
                    numberOfPeople: parseInt(bookingData.numberOfPeople),
                    totalPrice: parseFloat(bookingData.totalPrice),
                    amountPaid: amountPaid,
                    status: 'confirmed',
                    sessionId: sessionId,
                    productId: productId,
                    voucherCode: bookingData.voucherCode || null,
                    discountAmount: bookingData.discountAmount || null
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

                // Créer l'entrée historique
                await tx.bookingHistory.create({
                  data: {
                    action: 'created',
                    details: `Réservation créée avec paiement Stripe de ${amountPaid}€`,
                    bookingId: newBooking.id
                  }
                });

                // Créer le paiement
                await tx.payment.create({
                  data: {
                    amount: amountPaid,
                    method: 'stripe',
                    notes: `Payment Intent: ${stripeSession.payment_intent}`,
                    voucherCode: bookingData.voucherCode,
                    discountAmount: bookingData.discountAmount,
                    bookingId: newBooking.id
                  }
                });

                // Enregistrer les participants s'ils existent
                if (participants && participants.length > 0) {
                  for (const participant of participants) {
                    await tx.participant.create({
                      data: {
                        bookingId: newBooking.id,
                        firstName: participant.firstName || '',
                        age: participant.age ? parseInt(participant.age) : null,
                        weight: participant.weight ? parseFloat(participant.weight) : null,
                        height: participant.height ? parseFloat(participant.height) : null,
                        shoeRental: participant.shoeRental || false,
                        shoeSize: participant.shoeSize ? parseInt(participant.shoeSize) : null
                      }
                    });
                  }
                }

                return newBooking;
              });

              // Envoyer l'email de confirmation
              sendBookingConfirmation(booking).catch(err => {
                console.error('Erreur envoi email de confirmation:', err);
              });

              // Envoyer email de notification au guide
              sendGuideNewBookingNotification(booking).catch(err => {
                console.error('Erreur envoi email au guide:', err);
              });

              // Envoyer notification en temps réel aux admins
              const notification = createNewBookingNotification({
                id: booking.id,
                clientName: `${bookingData.clientFirstName} ${bookingData.clientLastName}`,
                productName: booking.product.name,
                sessionDate: booking.session.date,
                totalAmount: bookingData.totalPrice
              });
              notifyAdmins(notification);

              // Mettre à jour le calendrier
              updateCalendar({
                action: 'booking-created',
                bookingId: booking.id,
                sessionId: booking.sessionId
              });

              console.log('✅ Réservation créée avec succès:', booking.id);
            } catch (error) {
              console.error('❌ Erreur création réservation après paiement:', error);
            }

            break;
          }

          // CAS 2: Achat de bon cadeau
          if (stripeSession.metadata && stripeSession.metadata.type === 'gift_voucher') {
            try {
              const paymentIntentId = stripeSession.payment_intent;
              const buyerEmail = stripeSession.metadata?.buyerEmail;
              const amount = parseFloat(stripeSession.metadata?.amount);

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

              console.log('✅ Bon cadeau créé :', code, 'pour', amount, '€');

              // Envoyer l'email
              await sendGiftVoucherEmail(buyerEmail, code, amount, stripeSession.metadata);
              console.log('📧 Email envoyé à', buyerEmail);
            } catch (error) {
              console.error('💥 Erreur dans handleGiftVoucher:', error);
            }

            break;
          }

          // CAS 3: Paiement de réservation existante (ancien flux)
          // Sinon, c'est un paiement de réservation classique
          const bookingId = stripeSession.client_reference_id || stripeSession.metadata.bookingId;
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
            voucherCode: booking.voucherCode,
            discountAmount: booking.discountAmount,
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
