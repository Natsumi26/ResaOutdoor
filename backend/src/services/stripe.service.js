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

    // Configuration de base de la session
    const sessionConfig = {
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
    };

    // Si le guide a un compte Stripe Connect, router le paiement directement vers lui
    if (session.guide && session.guide.stripeAccount) {
      // Utiliser Stripe Connect - paiement direct sans commission plateforme
      sessionConfig.payment_intent_data = {
        transfer_data: {
          destination: session.guide.stripeAccount
        }
      };
    }

    // Créer la session de checkout
    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

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
 * @param {string} body - Corps de la requête
 * @param {string} signature - Signature Stripe
 * @returns {Object} Événement vérifié
 */
export const constructWebhookEvent = (body, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET non configuré');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Erreur vérification webhook:', error);
    throw error;
  }
};

/**
 * Créer un lien d'onboarding Stripe Connect pour un guide
 * @param {string} userId - ID du guide
 * @param {string} email - Email du guide
 * @returns {Promise<Object>} Lien d'onboarding
 */
export const createConnectAccountLink = async (userId, email) => {
  try {
    // Créer un compte Stripe Connect si n'existe pas déjà
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        userId
      }
    });

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/stripe/return`,
      type: 'account_onboarding'
    });

    return {
      accountId: account.id,
      url: accountLink.url
    };
  } catch (error) {
    console.error('Erreur création compte Stripe Connect:', error);
    throw error;
  }
};

/**
 * Créer un nouveau lien d'onboarding pour un compte existant
 * @param {string} accountId - ID du compte Stripe Connect
 * @returns {Promise<Object>} Lien d'onboarding
 */
export const createConnectAccountLinkForExisting = async (accountId) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/stripe/return`,
      type: 'account_onboarding'
    });

    return {
      url: accountLink.url
    };
  } catch (error) {
    console.error('Erreur création lien onboarding:', error);
    throw error;
  }
};

/**
 * Récupérer les informations d'un compte Stripe Connect
 * @param {string} accountId - ID du compte Stripe Connect
 * @returns {Promise<Object>} Informations du compte
 */
export const getConnectAccount = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error('Erreur récupération compte Stripe:', error);
    throw error;
  }
};

/**
 * Créer un lien vers le dashboard Stripe Express pour un guide
 * @param {string} accountId - ID du compte Stripe Connect
 * @returns {Promise<Object>} Lien vers le dashboard
 */
export const createLoginLink = async (accountId) => {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return {
      url: loginLink.url
    };
  } catch (error) {
    console.error('Erreur création login link:', error);
    throw error;
  }
};
