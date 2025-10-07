import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  constructWebhookEvent
} from '../services/stripe.service.js';
import { sendPaymentConfirmation } from '../services/email.service.js';

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
      // Le paiement est confirmé
      res.json({
        success: true,
        paid: true,
        bookingId: session.client_reference_id,
        amount: session.amount_total / 100 // Convertir de centimes en euros
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
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Vérifier la signature du webhook
    const event = constructWebhookEvent(req.body, signature);

    console.log('Webhook Stripe reçu:', event.type);

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Récupérer la réservation
        const bookingId = session.client_reference_id || session.metadata.bookingId;

        if (!bookingId) {
          console.error('Aucun bookingId dans la session Stripe');
          break;
        }

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId }
        });

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

    // Répondre à Stripe que le webhook a été reçu
    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook Stripe:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
