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

    // Si un guideId est fourni dans la query, l'utiliser
    if (guideId) {
      where.guideId = guideId;
    }
    // Sinon, si l'utilisateur n'est pas admin, ne montrer que ses sessions
    else if (req.user && req.user.role !== 'admin') {
      where.guideId = req.user.userId;
    }
    // Si admin et pas de guideId, montrer toutes les sessions

    const sessions = await prisma.session.findMany({
      where,
      include: {
        products: {
          include: {
            product: {
            }
          }
        },
        guide: {
          select: {
            id: true,
            login: true
          }
        },
        bookings: {
          include: {
            product: true,
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
        products: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        bookings: {
          include: {
            product: true,
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
      productIds, // Array de produits pour la rotation magique
      status,
      guideId: bodyGuideId  // Optionnel : fourni par l'admin
    } = req.body;

    // Récupérer le guideId depuis le user authentifié
    if (!req.user || !req.user.userId) {
      throw new AppError('Utilisateur non authentifié. Veuillez vous reconnecter.', 401);
    }

    // Si l'utilisateur est admin et fournit un guideId, on l'utilise
    // Sinon, on utilise l'ID du user connecté
    let guideId;
    if (req.user.role === 'admin' && bodyGuideId) {
      guideId = bodyGuideId;
    } else {
      guideId = req.user.userId;
    }

    if (!date || !timeSlot || !startTime) {
      throw new AppError('Champs requis manquants (date, timeSlot, startTime)', 400);
    }

    if (!productIds || productIds.length === 0) {
      throw new AppError('Au moins un produit doit être sélectionné', 400);
    }

    // Vérifier que le guide n'a pas déjà une session sur ce créneau
    const existingSession = await prisma.session.findFirst({
      where: {
        guideId,
        date: new Date(date),
        timeSlot
      }
    });

    if (existingSession) {
      throw new AppError('Vous avez déjà une session sur ce créneau', 409);
    }

    // Créer la session avec les produits en transaction
    const session = await prisma.$transaction(async (tx) => {
      // Créer la session
      const newSession = await tx.session.create({
        data: {
          date: new Date(date),
          timeSlot,
          startTime,
          isMagicRotation: isMagicRotation || false,
          guideId,
          status: status || 'open'
        }
      });

      // Lier les produits à la session
      await tx.sessionProduct.createMany({
        data: productIds.map(productId => ({
          sessionId: newSession.id,
          productId
        }))
      });

      // Retourner la session complète
      return tx.session.findUnique({
        where: { id: newSession.id },
        include: {
          products: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          guide: {
            select: {
              id: true,
              login: true
            }
          }
        }
      });
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
    const {
      date,
      timeSlot,
      startTime,
      isMagicRotation,
      productIds,
      status
    } = req.body;

    const updateData = {};

    if (date) updateData.date = new Date(date);
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (startTime) updateData.startTime = startTime;
    if (typeof isMagicRotation === 'boolean') updateData.isMagicRotation = isMagicRotation;
    if (status) updateData.status = status;

    // Mettre à jour en transaction
    const session = await prisma.$transaction(async (tx) => {
      // Mettre à jour la session
      const updatedSession = await tx.session.update({
        where: { id },
        data: updateData
      });

      // Si les produits sont fournis, mettre à jour les liens
      if (productIds && Array.isArray(productIds)) {
        // Supprimer les anciens liens
        await tx.sessionProduct.deleteMany({
          where: { sessionId: id }
        });

        // Créer les nouveaux liens
        if (productIds.length > 0) {
          await tx.sessionProduct.createMany({
            data: productIds.map(productId => ({
              sessionId: id,
              productId
            }))
          });
        }
      }

      // Retourner la session complète
      return tx.session.findUnique({
        where: { id },
        include: {
          products: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          guide: {
            select: {
              id: true,
              login: true
            }
          },
          bookings: {
            include: {
              product: true
            }
          }
        }
      });
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

    // Supprimer la session (cascade supprime les SessionProduct)
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
