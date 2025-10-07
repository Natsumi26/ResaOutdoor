import stripe from '../config/stripe.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Créer une session de paiement Stripe
 * @param {Object} booking - La réservation
 * @param {number} amount - Montant à payer en euros
 * @returns {Promise<Object>} Session Stripe
 */
export const createCheckoutSession = async (booking, amount) => {
  try {
    const { session, product } = booking;
    const sessionDate = format(new Date(session.date), 'dd MMMM yyyy', { locale: fr });

    // Créer la session de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${product.name} - ${sessionDate}`,
              description: `${session.timeSlot} - ${session.startTime} | ${booking.numberOfPeople} personne(s)`,
              images: product.images && product.images.length > 0
                ? [product.images[0].startsWith('http') ? product.images[0] : `${process.env.APP_URL || 'http://localhost:5000'}${product.images[0]}`]
                : []
            },
            unit_amount: Math.round(amount * 100) // Convertir en centimes
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
      client_reference_id: booking.id, // Pour identifier la réservation dans le webhook
      customer_email: booking.clientEmail,
      metadata: {
        bookingId: booking.id,
        productName: product.name,
        numberOfPeople: booking.numberOfPeople.toString(),
        sessionDate: sessionDate
      }
    });

    return {
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    };
  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    throw error;
  }
};

/**
 * Créer un lien de paiement (Payment Link) réutilisable
 * @param {Object} product - Le produit
 * @returns {Promise<Object>} Payment Link
 */
export const createPaymentLink = async (product) => {
  try {
    // Créer d'abord un produit Stripe
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.shortDescription || product.longDescription,
      images: product.images && product.images.length > 0
        ? product.images.map(img => img.startsWith('http') ? img : `${process.env.APP_URL || 'http://localhost:5000'}${img}`)
        : []
    });

    // Créer un prix pour ce produit
    const price = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(product.priceIndividual * 100),
      currency: 'eur'
    });

    // Créer le payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1
        }
      ]
    });

    return {
      url: paymentLink.url,
      stripeProductId: stripeProduct.id,
      stripePriceId: price.id
    };
  } catch (error) {
    console.error('Erreur création payment link:', error);
    throw error;
  }
};

/**
 * Vérifier le statut d'une session de paiement
 * @param {string} sessionId - ID de la session Stripe
 * @returns {Promise<Object>} Détails de la session
 */
export const retrieveCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Erreur récupération session Stripe:', error);
    throw error;
  }
};

/**
 * Créer un remboursement
 * @param {string} paymentIntentId - ID du payment intent
 * @param {number} amount - Montant à rembourser (optionnel, remboursement total par défaut)
 * @returns {Promise<Object>} Remboursement
 */
export const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundData = {
      payment_intent: paymentIntentId
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Erreur création remboursement:', error);
    throw error;
  }
};

/**
 * Vérifier la signature d'un webhook Stripe
 * @param {string} payload - Corps de la requête
 * @param {string} signature - Signature Stripe
 * @returns {Object} Événement vérifié
 */
export const constructWebhookEvent = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET non configuré');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Erreur vérification webhook:', error);
    throw error;
  }
};
