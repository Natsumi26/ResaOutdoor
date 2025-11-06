import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  constructWebhookEvent,
  createConnectAccountLink,
  createConnectAccountLinkForExisting,
  getConnectAccount,
  createLoginLink,
  createPaymentIntent,
  createGiftVoucherPaymentIntent
} from '../services/stripe.service.js';
import { sendPaymentConfirmation, sendGiftVoucherEmail, sendBookingConfirmation, sendGuideNewBookingNotification } from '../services/email.service.js';
import { notifyAdmins, createNewBookingNotification, updateCalendar } from '../services/notification.service.js';

const router = express.Router();

/**
 * Créer un Payment Intent pour paiement inline (Stripe Payment Element)
 * POST /api/stripe/create-payment-intent
 */
router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const { sessionId, productId, bookingData, amountDue, participants, payFullAmount } = req.body;

    if (!sessionId || !productId || !bookingData || !amountDue) {
      throw new AppError('sessionId, productId, bookingData et amountDue requis', 400);
    }

    // Créer le Payment Intent
    const paymentIntent = await createPaymentIntent(
      sessionId,
      productId,
      bookingData,
      parseFloat(amountDue),
      participants,
      payFullAmount
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      amountToPay: paymentIntent.amountToPay,
      isDeposit: paymentIntent.isDeposit
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Créer un Payment Intent pour l'achat d'un bon cadeau (Stripe Payment Element)
 * POST /api/stripe/create-gift-voucher-payment-intent
 */
router.post('/create-gift-voucher-payment-intent', async (req, res, next) => {
  try {
    const { amount, buyerEmail, recipientEmail, recipientName, message, guideId, teamName } = req.body;

    if (!amount || !buyerEmail) {
      throw new AppError('amount et buyerEmail requis', 400);
    }

    // Créer le Payment Intent
    const paymentIntent = await createGiftVoucherPaymentIntent(
      parseFloat(amount),
      buyerEmail,
      recipientEmail,
      recipientName,
      message,
      guideId,
      teamName
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Récupérer une réservation via un Payment Intent ID
 * GET /api/stripe/payment-intent/:paymentIntentId/booking
 */
router.get('/payment-intent/:paymentIntentId/booking', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    // Chercher le paiement qui contient ce Payment Intent ID dans les notes
    const payment = await prisma.payment.findFirst({
      where: {
        notes: {
          contains: paymentIntentId
        }
      },
      include: {
        booking: {
          include: {
            session: true,
            product: true
          }
        }
      }
    });

    if (!payment || !payment.booking) {
      return res.json({
        success: false,
        found: false,
        message: 'Réservation en cours de création...'
      });
    }

    res.json({
      success: true,
      found: true,
      booking: payment.booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Récupérer un bon cadeau via un Payment Intent ID
 * GET /api/stripe/payment-intent/:paymentIntentId/gift-voucher
 */
router.get('/payment-intent/:paymentIntentId/gift-voucher', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    // Chercher le bon cadeau qui contient ce Payment Intent ID dans les notes
    const giftVoucher = await prisma.giftVoucher.findFirst({
      where: {
        notes: {
          contains: paymentIntentId
        }
      }
    });

    if (!giftVoucher) {
      return res.json({
        success: false,
        found: false,
        message: 'Bon cadeau en cours de création...'
      });
    }

    res.json({
      success: true,
      found: true,
      voucher: giftVoucher
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
                totalAmount: bookingData.amountPaid
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
              const recipientEmail = stripeSession.metadata?.recipientEmail;
              const recipientName = stripeSession.metadata?.recipientName;
              const message = stripeSession.metadata?.message;

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

              // Récupérer le premier super_admin pour associer le bon cadeau
              // (les bons cadeaux achetés publiquement sont associés au super_admin)
              const superAdmin = await prisma.user.findFirst({
                where: { role: 'super_admin' },
                orderBy: { createdAt: 'asc' }
              });

              if (!superAdmin) {
                console.error('❌ Aucun super_admin trouvé pour associer le bon cadeau');
                return;
              }

              // Créer le bon cadeau dans la base de données
              const voucher = await prisma.giftVoucher.create({
                data: {
                  code,
                  amount,
                  discountType: 'fixed',
                  type: 'voucher',
                  notes: paymentIntentId, // Stocker le payment_intent pour éviter les doublons
                  userId: superAdmin.id, // Associer au super_admin
                  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Expire dans 1 an
                }
              });

              console.log('✅ Bon cadeau créé en BDD:', code, 'pour', amount, '€');

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
            status: newTotalPaid >= (booking.totalPrice - booking.discountAmount) ? 'confirmed' : booking.status
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

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;

        // Vérifier si c'est une nouvelle réservation (Payment Element)
        if (paymentIntent.metadata && paymentIntent.metadata.type === 'new_booking') {
          try {
            console.log('🆕 Création de réservation après paiement Payment Intent');

            const sessionId = paymentIntent.metadata.sessionId;
            const productId = paymentIntent.metadata.productId;
            const bookingData = JSON.parse(paymentIntent.metadata.bookingData);
            const participants = paymentIntent.metadata.participants ? JSON.parse(paymentIntent.metadata.participants) : null;
            const amountPaid = paymentIntent.amount / 100;

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
                  details: `Réservation créée avec paiement Stripe (Payment Element) de ${amountPaid}€`,
                  bookingId: newBooking.id
                }
              });

              // Créer le paiement
              await tx.payment.create({
                data: {
                  amount: amountPaid,
                  method: 'stripe',
                  notes: `Payment Intent: ${paymentIntent.id}`,
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
              totalAmount: amountPaid
            });
            notifyAdmins(notification);

            // Mettre à jour le calendrier
            updateCalendar({
              action: 'booking-created',
              bookingId: booking.id,
              sessionId: booking.sessionId
            });

            console.log('✅ Réservation créée avec succès via Payment Intent:', booking.id);
          } catch (error) {
            console.error('❌ Erreur création réservation après Payment Intent:', error);
          }
        }
        // Vérifier si c'est un bon cadeau (Payment Element)
        else if (paymentIntent.metadata && paymentIntent.metadata.type === 'gift_voucher') {
          try {
            console.log('🎁 Création de bon cadeau après paiement Payment Intent');

            const amount = parseFloat(paymentIntent.metadata.amount);
            const buyerEmail = paymentIntent.metadata.buyerEmail;
            const recipientEmail = paymentIntent.metadata.recipientEmail || null;
            const recipientName = paymentIntent.metadata.recipientName || null;
            const message = paymentIntent.metadata.message || null;
            const guideId = paymentIntent.metadata.guideId || null;
            const teamName = paymentIntent.metadata.teamName || null;
            console.log(paymentIntent.metadata)
            // Déterminer le guide ou team leader à associer au bon cadeau
            let targetUserId = null;

            if (teamName) {
              // Chercher le team leader par teamName
              const teamLeader = await prisma.user.findFirst({
                where: {
                  teamName: teamName,
                  role: { in: ['leader', 'super_admin'] }
                }
              });
              if (teamLeader) {
                targetUserId = teamLeader.id;
                console.log(`🎁 Bon cadeau associé au team leader: ${teamLeader.email}`);
              }
            } else if (guideId) {
              // Chercher le guide par ID
              const guide = await prisma.user.findUnique({
                where: { id: guideId }
              });
              if (guide) {
                targetUserId = guide.id;
                console.log(`🎁 Bon cadeau associé au guide: ${guide.email}`);
              }
            }

            // Si aucun guide/team leader trouvé, associer au super_admin par défaut
            if (!targetUserId) {
              const superAdmin = await prisma.user.findFirst({
                where: { role: 'super_admin' },
                orderBy: { createdAt: 'asc' }
              });
              if (superAdmin) {
                targetUserId = superAdmin.id;
                console.log('🎁 Bon cadeau associé au super_admin par défaut');
              } else {
                console.error('❌ Aucun utilisateur trouvé pour associer le bon cadeau');
                return;
              }
            }

            // Générer un code unique
            const code = `GV${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Créer le bon cadeau
            const giftVoucher = await prisma.giftVoucher.create({
              data: {
                code,
                type: 'gift',
                amount,
                discountType: 'fixed',
                userId: targetUserId,
                buyerEmail,
                recipientEmail,
                recipientName,
                message,
                notes: `Payment Intent: ${paymentIntent.id}`,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 an
              }
            });

            // Envoyer l'email avec le code
            sendGiftVoucherEmail(giftVoucher).catch(err => {
              console.error('Erreur envoi email bon cadeau:', err);
            });

            console.log('✅ Bon cadeau créé avec succès via Payment Intent:', giftVoucher.code);
          } catch (error) {
            console.error('❌ Erreur création bon cadeau après Payment Intent:', error);
          }
        }

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

export default router;
