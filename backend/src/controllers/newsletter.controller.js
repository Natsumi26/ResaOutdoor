import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../services/email.service.js';

const prisma = new PrismaClient();

/**
 * Ajouter un email à la newsletter
 * POST /api/newsletter/subscribe
 */
export const subscribe = async (req, res, next) => {
  try {
    const { email, firstName, lastName, source, acceptedTerms } = req.body;

    if (!email) {
      throw new AppError('Email requis', 400);
    }

    if (!acceptedTerms) {
      throw new AppError('Vous devez accepter les conditions de confidentialité', 400);
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      // Si existe mais était désabonné, réactiver
      if (!existing.isActive) {
        const updated = await prisma.newsletter.update({
          where: { email: email.toLowerCase().trim() },
          data: {
            isActive: true,
            unsubscribedAt: null,
            subscribedAt: new Date()
          }
        });
        return res.json({ success: true, message: 'Réabonnement réussi', newsletter: updated });
      }

      // Sinon, déjà abonné
      return res.json({ success: true, message: 'Déjà abonné à la newsletter', newsletter: existing });
    }

    // Créer nouvel abonné
    const newsletter = await prisma.newsletter.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName: firstName || null,
        lastName: lastName || null,
        source: source || 'manual',
        acceptedTerms: true,
        isActive: true
      }
    });

    res.json({ success: true, message: 'Inscription réussie', newsletter });
  } catch (error) {
    next(error);
  }
};

/**
 * Se désabonner de la newsletter
 * POST /api/newsletter/unsubscribe
 */
export const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email requis', 400);
    }

    const newsletter = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!newsletter) {
      throw new AppError('Email non trouvé', 404);
    }

    const updated = await prisma.newsletter.update({
      where: { email: email.toLowerCase().trim() },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Désabonnement réussi', newsletter: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer tous les abonnés (pour le guide)
 * GET /api/newsletter
 */
export const getAll = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const newsletters = await prisma.newsletter.findMany({
      where,
      orderBy: { subscribedAt: 'desc' }
    });

    const activeCount = await prisma.newsletter.count({
      where: { isActive: true }
    });

    const totalCount = await prisma.newsletter.count();

    res.json({
      success: true,
      newsletters,
      stats: {
        active: activeCount,
        total: totalCount,
        inactive: totalCount - activeCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un abonné
 * DELETE /api/newsletter/:id
 */
export const deleteSubscriber = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.newsletter.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Abonné supprimé' });
  } catch (error) {
    next(error);
  }
};

/**
 * Envoyer un email à tous les abonnés actifs
 * POST /api/newsletter/send
 */
export const sendNewsletterEmail = async (req, res, next) => {
  try {
    const { subject, htmlContent, textContent } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!subject || !htmlContent) {
      throw new AppError('Sujet et contenu HTML requis', 400);
    }

    // Récupérer tous les abonnés actifs
    const subscribers = await prisma.newsletter.findMany({
      where: { isActive: true }
    });

    if (subscribers.length === 0) {
      throw new AppError('Aucun abonné actif', 400);
    }

    // Récupérer les infos du guide pour l'expéditeur
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Envoyer l'email à chaque abonné
    for (const subscriber of subscribers) {
      try {
        // Personnaliser le contenu avec le lien de désabonnement
        const unsubscribeLink = `${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const personalizedHtml = `
          ${htmlContent}
          <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 0.85rem; color: #666; text-align: center;">
            Vous recevez cet email car vous êtes abonné à notre newsletter.
            <br>
            <a href="${unsubscribeLink}" style="color: #999;">Se désabonner</a>
          </p>
        `;

        await sendEmail({
          to: subscriber.email,
          subject: subject,
          html: personalizedHtml,
          text: textContent || subject
        });

        sentCount++;
      } catch (error) {
        console.error(`Erreur envoi newsletter à ${subscriber.email}:`, error);
        failedCount++;
        errors.push({ email: subscriber.email, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Newsletter envoyée à ${sentCount} abonnés`,
      stats: {
        sent: sentCount,
        failed: failedCount,
        total: subscribers.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test d'envoi d'email (envoyer à soi-même)
 * POST /api/newsletter/test-send
 */
export const sendTestEmail = async (req, res, next) => {
  try {
    const { subject, htmlContent, textContent, testEmail } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!subject || !htmlContent) {
      throw new AppError('Sujet et contenu HTML requis', 400);
    }

    // Si pas d'email de test fourni, utiliser l'email du guide
    let recipientEmail = testEmail;
    if (!recipientEmail) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      recipientEmail = user.email;
    }

    if (!recipientEmail) {
      throw new AppError('Aucun email de destination', 400);
    }

    const unsubscribeLink = `${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=test@example.com`;
    const personalizedHtml = `
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <strong>⚠️ EMAIL DE TEST</strong>
        <p style="margin: 0.5rem 0 0 0;">Ceci est un aperçu de votre newsletter.</p>
      </div>
      ${htmlContent}
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 0.85rem; color: #666; text-align: center;">
        Vous recevez cet email car vous êtes abonné à notre newsletter.
        <br>
        <a href="${unsubscribeLink}" style="color: #999;">Se désabonner</a>
      </p>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html: personalizedHtml,
      text: textContent || subject
    });

    res.json({
      success: true,
      message: `Email de test envoyé à ${recipientEmail}`
    });
  } catch (error) {
    next(error);
  }
};
