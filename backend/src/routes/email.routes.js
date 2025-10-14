import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { sendBookingConfirmation, sendBookingReminder, sendCustomEmail } from '../services/email.service.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

// Renvoyer l'email de confirmation pour une réservation
router.post('/booking-confirmation/:bookingId', async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Charger la réservation complète
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: {
          include: {
            guide: true
          }
        },
        product: {
        }
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    // Envoyer l'email
    const result = await sendBookingConfirmation(booking);

    res.json({
      success: true,
      message: 'Email envoyé avec succès',
      messageId: result.messageId
    });
  } catch (error) {
    next(error);
  }
});

// Envoyer un email de rappel
router.post('/booking-reminder/:bookingId', async (req, res, next) => {
  try {
    const { bookingId } = req.params;

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

    const result = await sendBookingReminder(booking);

    res.json({
      success: true,
      message: 'Email de rappel envoyé',
      messageId: result.messageId
    });
  } catch (error) {
    next(error);
  }
});

// Envoyer un email personnalisé
router.post('/custom', async (req, res, next) => {
  try {
    const { to, subject, content } = req.body;

    if (!to || !subject || !content) {
      throw new AppError('Champs requis manquants', 400);
    }

    const result = await sendCustomEmail(to, subject, content);

    res.json({
      success: true,
      message: 'Email envoyé',
      messageId: result.messageId
    });
  } catch (error) {
    next(error);
  }
});

export default router;
