import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Rechercher les produits disponibles selon les filtres (pour les clients)
export const searchAvailableProducts = async (req, res, next) => {
  try {
    const { participants, startDate, endDate, date } = req.query;

    // Construire le filtre de dates pour les sessions
    const sessionWhere = {
      status: { in: ['open', 'full'] } // Sessions ouvertes ou complètes (mais peut-être pas pour tous les produits)
    };

    // Filtre par date spécifique
    if (date) {
      const specificDate = new Date(date);
      specificDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);

      sessionWhere.date = {
        gte: specificDate,
        lt: nextDay
      };
    }
    // Filtre par période
    else if (startDate && endDate) {
      sessionWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Récupérer toutes les sessions correspondantes
    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      include: {
        products: {
          include: {
            product: true
          }
        },
        bookings: {
          include: {
            product: true
          }
        }
      }
    });

    // Construire un dictionnaire de disponibilités par produit
    const productAvailability = {};

    sessions.forEach(session => {
      session.products.forEach(sp => {
        const product = sp.product;
        const productId = product.id;

        // Calculer le nombre de places réservées pour ce produit dans cette session
        const bookedForProduct = session.bookings
          .filter(b => b.productId === productId && b.status !== 'cancelled')
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        // Places disponibles pour ce produit
        const availableCapacity = product.maxCapacity - bookedForProduct;

        // Si le nombre de participants demandé n'est pas spécifié OU s'il y a assez de places
        if (!participants || availableCapacity >= parseInt(participants)) {
          if (!productAvailability[productId]) {
            productAvailability[productId] = {
              product: product,
              availableSessions: []
            };
          }

          productAvailability[productId].availableSessions.push({
            sessionId: session.id,
            date: session.date,
            timeSlot: session.timeSlot,
            startTime: session.startTime,
            availableCapacity: availableCapacity
          });
        }
      });
    });

    // Convertir en tableau et ne garder que les produits avec au moins une session disponible
    const availableProducts = Object.values(productAvailability)
      .filter(item => item.availableSessions.length > 0)
      .map(item => ({
        ...item.product,
        availableSessions: item.availableSessions
      }));

    res.json({
      success: true,
      products: availableProducts,
      count: availableProducts.length
    });
  } catch (error) {
    next(error);
  }
};

// Lister toutes les sessions (avec filtre par date)
export const getAllSessions = async (req, res, next) => {
  try {
    const { startDate, endDate, guideId, date, productId } = req.query;

    const where = {};

    // Filtre par date spécifique
    if (date) {
      const specificDate = new Date(date);
      specificDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: specificDate,
        lt: nextDay
      };
    }
    // Filtre par période
    else if (startDate && endDate) {
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

    // Filtrer par productId si fourni
    let filteredSessions = sessions;
    if (productId) {
      filteredSessions = sessions.filter(session =>
        session.products.some(sp => sp.productId === productId)
      );
    }

    res.json({
      success: true,
      sessions: filteredSessions
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
      guideId: bodyGuideId,  // Optionnel : fourni par l'admin
      shoeRentalAvailable,   // Nouveau : location de chaussures disponible
      shoeRentalPrice        // Nouveau : prix de location
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

    // Validation : si location disponible, le prix doit être fourni
    if (shoeRentalAvailable && (!shoeRentalPrice || shoeRentalPrice <= 0)) {
      throw new AppError('Le prix de location de chaussures doit être spécifié et supérieur à 0', 400);
    }

    // Note: Suppression de la vérification d'unicité pour permettre plusieurs sessions
    // sur le même créneau pour le même guide

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
          status: status || 'open',
          shoeRentalAvailable: shoeRentalAvailable || false,
          shoeRentalPrice: shoeRentalAvailable ? shoeRentalPrice : null
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
      status,
      shoeRentalAvailable,
      shoeRentalPrice
    } = req.body;

    const updateData = {};

    if (date) updateData.date = new Date(date);
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (startTime) updateData.startTime = startTime;
    if (typeof isMagicRotation === 'boolean') updateData.isMagicRotation = isMagicRotation;
    if (status) updateData.status = status;
    if (typeof shoeRentalAvailable === 'boolean') {
      updateData.shoeRentalAvailable = shoeRentalAvailable;
      // Si la location est activée, vérifier que le prix est fourni
      if (shoeRentalAvailable) {
        if (!shoeRentalPrice || shoeRentalPrice <= 0) {
          throw new AppError('Le prix de location de chaussures doit être spécifié et supérieur à 0', 400);
        }
        updateData.shoeRentalPrice = shoeRentalPrice;
      } else {
        // Si désactivée, mettre le prix à null
        updateData.shoeRentalPrice = null;
      }
    } else if (shoeRentalPrice !== undefined) {
      // Si seulement le prix est mis à jour
      updateData.shoeRentalPrice = shoeRentalPrice;
    }

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
