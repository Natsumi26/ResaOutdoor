import stripe from '../config/stripe.js';

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

/**
 * Créer un Payment Intent pour le paiement dans l'iframe (Stripe Payment Element)
 * @param {string} sessionId - ID de la session
 * @param {string} productId - ID du produit
 * @param {Object} bookingData - Données de réservation
 * @param {number} amountDue - Montant dû
 * @param {Array} participants - Liste des participants (optionnel)
 * @param {boolean} payFullAmount - Payer la totalité (true) ou l'acompte (false)
 * @returns {Promise<Object>} Payment Intent avec client_secret
 */
export const createPaymentIntent = async (sessionId, productId, bookingData, amountDue, participants = null, payFullAmount = false) => {
  try {
    // Importer prisma localement
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Charger la session et le produit
    const [dbSession, product] = await Promise.all([
      prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          guide: {
            include: {
              teamLeader: true
            }
          },
          bookings: true
        }
      }),
      prisma.product.findUnique({
        where: { id: productId }
      })
    ]);

    if (!dbSession) {
      throw new Error('Session non trouvée');
    }

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    // Calculer le montant à payer (acompte ou totalité)
    let amountToPay = amountDue;
    let isDeposit = false;

    if (dbSession.depositRequired && !payFullAmount) {
      if (dbSession.depositType === 'percentage') {
        amountToPay = (amountDue * dbSession.depositAmount) / 100;
      } else {
        amountToPay = Math.min(dbSession.depositAmount, amountDue);
      }
      isDeposit = true;
    }

    // Déterminer le compte Stripe à utiliser
    let stripeAccountId = null;
    if (dbSession.guide.role === 'trainee' && dbSession.guide.teamLeader) {
      stripeAccountId = dbSession.guide.teamLeader.stripeAccount;
    } else {
      stripeAccountId = dbSession.guide.stripeAccount;
    }

    // Créer une entrée temporaire pour stocker les données de réservation
    // (Stripe metadata a une limite de 500 caractères par valeur)
    const pendingBooking = await prisma.pendingBooking.create({
      data: {
        sessionId: sessionId,
        productId: productId,
        bookingData: bookingData,
        participants: participants,
        totalAmount: amountDue,
        isDeposit: isDeposit,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // Expire dans 1h
      }
    });

    // Configuration du Payment Intent
    const paymentIntentData = {
      amount: Math.round(amountToPay * 100), // En centimes
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'new_booking',
        pendingBookingId: pendingBooking.id
      }
    };

    // Si on a un compte Stripe Connect, l'ajouter
    let paymentIntent;
    if (stripeAccountId) {
      paymentIntentData.application_fee_amount = 0;
      paymentIntentData.transfer_data = {
        destination: stripeAccountId
      };
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    } else {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    }

    await prisma.$disconnect();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountToPay: amountToPay,
      isDeposit: isDeposit
    };
  } catch (error) {
    console.error('Erreur création Payment Intent:', error);
    throw error;
  }
};

/**
 * Créer un Payment Intent pour l'achat d'un bon cadeau (Stripe Payment Element)
 * @param {number} amount - Montant du bon cadeau en euros
 * @param {string} buyerEmail - Email de l'acheteur
 * @param {string} recipientEmail - Email du destinataire (optionnel)
 * @param {string} recipientName - Nom du destinataire (optionnel)
 * @param {string} message - Message personnalisé (optionnel)
 * @returns {Promise<Object>} Payment Intent avec client_secret
 */
export const createGiftVoucherPaymentIntent = async (amount, buyerEmail, recipientEmail = null, recipientName = null, message = null, guideId = null, teamName = null) => {
  try {
    // Importer prisma localement
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Vérifier que le montant est valide
    if (!amount || amount <= 0) {
      throw new Error('Montant invalide pour le bon cadeau');
    }

    // Déterminer le guide ou le team leader à associer au bon cadeau
    let targetGuide = null;
    let stripeAccountId = null;
    if (teamName) {
      // Chercher le team leader par teamName
      targetGuide = await prisma.user.findFirst({
        where: {
          teamName: teamName,
          role: 'leader'
        }
      });      
        stripeAccountId = targetGuide.stripeAccount;
    } else if (guideId) {
      // Chercher le guide par ID
      targetGuide = await prisma.user.findUnique({
        where: { id: guideId }
      });
        stripeAccountId = targetGuide.stripeAccount;
    }

    // Configuration du Payment Intent
    const paymentIntentData = {
      amount: Math.round(amount * 100), // En centimes
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: buyerEmail,
      metadata: {
        type: 'gift_voucher',
        amount: amount.toString(),
        buyerEmail,
        recipientEmail: recipientEmail || '',
        recipientName: recipientName || '',
        message: message || '',
        guideId: guideId || '',
        teamName: teamName || '',
      }
    };

    // Si on a un compte Stripe Connect, créer le paiement avec destination
    let paymentIntent;

    if (stripeAccountId) {
      paymentIntentData.application_fee_amount = 0; // Pas de frais de plateforme
      paymentIntentData.transfer_data = {
        destination: stripeAccountId
      };
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    } else {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    };
  } catch (error) {
    console.error('Erreur création Payment Intent pour bon cadeau:', error);
    throw error;
  }
};

