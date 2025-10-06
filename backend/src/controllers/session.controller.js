import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Lister toutes les sessions (avec filtre par date)
export const getAllSessions = async (req, res, next) => {
  try {
    const { startDate, endDate, guideId } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (guideId) {
      where.guideId = guideId;
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        product: true,
        guide: {
          select: {
            id: true,
            login: true
          }
        },
        bookings: {
          include: {
            payments: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir une session par ID
export const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        product: true,
        guide: {
          select: {
            id: true,
            login: true
          }
        },
        bookings: {
          include: {
            payments: true,
            history: true
          }
        }
      }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// Créer une session
export const createSession = async (req, res, next) => {
  try {
    const {
      date,
      timeSlot,
      startTime,
      isMagicRotation,
      magicRotationProducts,
      productId,
      guideId
    } = req.body;

    if (!date || !timeSlot || !startTime || !guideId) {
      throw new AppError('Champs requis manquants', 400);
    }

    if (!isMagicRotation && !productId) {
      throw new AppError('ProductId requis si ce n\'est pas une rotation magique', 400);
    }

    const session = await prisma.session.create({
      data: {
        date: new Date(date),
        timeSlot,
        startTime,
        isMagicRotation: isMagicRotation || false,
        magicRotationProducts: magicRotationProducts || null,
        productId: productId || null,
        guideId,
        status: 'open'
      },
      include: {
        product: true,
        guide: {
          select: {
            id: true,
            login: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une session
export const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const session = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        guide: {
          select: {
            id: true,
            login: true
          }
        },
        bookings: true
      }
    });

    res.json({
      success: true,
      session
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Session non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Supprimer une session
export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des réservations
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (session && session._count.bookings > 0) {
      throw new AppError('Impossible de supprimer une session avec des réservations', 409);
    }

    await prisma.session.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Session supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Session non trouvée', 404));
    } else {
      next(error);
    }
  }
};
