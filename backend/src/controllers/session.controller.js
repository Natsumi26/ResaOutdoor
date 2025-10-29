import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtenir les prochaines dates disponibles
export const getNextAvailableDates = async (req, res, next) => {
  try {
    const { participants } = req.query;
    const participantCount = participants ? parseInt(participants) : 1;

    // Récupérer toutes les sessions futures ouvertes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: today
        },
        status: { in: ['open', 'full'] }
      },
      include: {
        products: {
          include: {
            product: true
          }
        },
        bookings: {
          where: {
            status: { not: 'cancelled' }
          },
          include: {
            product: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 50 // Limiter pour optimiser la performance
    });

    // Analyser les sessions pour trouver celles avec disponibilité
    const availableDates = [];
    const seenDates = new Set();

    for (const session of sessions) {
      // Si on a déjà 2 dates, on arrête
      if (availableDates.length >= 2) break;

      const dateKey = session.date.toLocaleDateString('fr-CA'); // format YYYY-MM-DD

      // Si on a déjà cette date, on passe
      if (seenDates.has(dateKey)) continue;
        
      // 🔒 Rotation magique : produit verrouillé ?
      const lockedProductId = session.bookings.length > 0
        ? session.bookings[0].productId
        : null;

      const relevantProducts = lockedProductId
        ? session.products.filter(sp => sp.product.id === lockedProductId)
        : session.products;

      // Vérifier s'il y a au moins un produit disponible pour le nombre de participants
      let hasAvailability = false;
      let availableProduct = null;

      for (const sp of relevantProducts) {
        const product = sp.product;

        // Calculer les places réservées pour ce produit dans cette session
        const bookedForProduct = session.bookings
          .filter(b => b.productId === product.id)
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        const availableCapacity = product.maxCapacity - bookedForProduct;

        if (availableCapacity >= participantCount) {
          hasAvailability = true;
          availableProduct = {
            id: product.id,
            name: product.name,
            region: product.region
          };
          break;
        }
      }

      if (hasAvailability) {
        seenDates.add(dateKey);
        availableDates.push({
          date: dateKey,
          product: availableProduct
        });
      }
    }

    res.json({
      success: true,
      dates: availableDates
    });
  } catch (error) {
    next(error);
  }
};

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

    const now = new Date();

    sessions.forEach(session => {
      // Déterminer le produit verrouillé par la première réservation (rotation magique)
      const lockedProductId = session.bookings.length > 0
        ? session.bookings[0].productId
        : null;

      session.products.forEach(sp => {
        const product = sp.product;
        const productId = product.id;

            // Si un produit est verrouillé, ignorer les autres
          if (lockedProductId && productId !== lockedProductId) {
            return;
          }

        // Calculer le nombre de places réservées pour ce produit dans cette session
        const bookedForProduct = session.bookings
          .filter(b => b.productId === productId && b.status !== 'cancelled')
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        // Places disponibles pour ce produit
        const availableCapacity = product.maxCapacity - bookedForProduct;

        // Vérifier la fermeture automatique
        let isAutoClosed = false;
        if (product.autoCloseHoursBefore) {
          // Créer une date complète avec l'heure de début
          const sessionDateTime = new Date(session.date);
          const [hours, minutes] = session.startTime.split(':');
          sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Calculer l'heure limite de réservation
          const closeDateTime = new Date(sessionDateTime);
          closeDateTime.setHours(closeDateTime.getHours() - product.autoCloseHoursBefore);

          // Si on est après l'heure limite, fermer automatiquement
          if (now >= closeDateTime) {
            isAutoClosed = true;
          }
        }

        // Afficher la session si:
        // - Il y a assez de places pour le nombre de participants demandé (ou pas de filtre participants)
        // - Même si fermée automatiquement (pour afficher le message)
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
            availableCapacity: availableCapacity,
            isAutoClosed: isAutoClosed  // Nouveau flag
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
    console.log('🔍 req.user =', req.user);

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

    // Filtre par guide
    if (guideId && guideId !== '') {
      where.guideId = guideId;
    } else if (req.user) {
      if (req.user.role === 'super_admin' || req.user.role === 'leader') {
        const teamGuides = await prisma.user.findMany({
          where: {
            teamName: req.user.teamName,
            role: { in: ['leader', 'employee', 'trainee'] }
          },
          select: { id: true }
        });
        where.guideId = { in: teamGuides.map(g => g.id) };
      } else if (req.user.role === 'employee' || req.user.role === 'trainee') {
        where.guideId = req.user.userId;
      }
    }
    // Si pas connecté → ne pas filtrer par guideId
console.log('🔍 Filtre guideId appliqué:', where.guideId || 'aucun (public)');


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
    console.log(sessions)
    // Filtrer par productId si fourni
    let filteredSessions = sessions;
    if (productId) {
      filteredSessions = sessions.filter(session =>
        session.products.some(sp => sp.productId === productId)
      );
    }

    // Ajouter le flag isAutoClosed pour chaque produit dans chaque session
    const now = new Date();
    const sessionsWithAutoClose = filteredSessions.map(session => {
      return {
        ...session,
        products: session.products.map(sp => {
          const product = sp.product;
          let isAutoClosed = false;

          if (product.autoCloseHoursBefore) {
            // Créer une date complète avec l'heure de début
            const sessionDateTime = new Date(session.date);
            const [hours, minutes] = session.startTime.split(':');
            sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Calculer l'heure limite de réservation
            const closeDateTime = new Date(sessionDateTime);
            closeDateTime.setHours(closeDateTime.getHours() - product.autoCloseHoursBefore);

            // Si on est après l'heure limite, fermer automatiquement
            if (now >= closeDateTime) {
              isAutoClosed = true;
            }
          }

          return {
            ...sp,
            product: {
              ...product,
              isAutoClosed
            }
          };
        })
      };
    });

    res.json({
      success: true,
      sessions: sessionsWithAutoClose
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

    // 🚫 Bloquer les stagiaires : ils ne peuvent pas créer de sessions
    if (req.user.role === 'trainee') {
      throw new AppError('Les stagiaires ne peuvent pas créer de sessions. Contactez votre leader.', 403);
    }

    // Si l'utilisateur est super_admin/leader et fournit un guideId, on l'utilise
    // Sinon, on utilise l'ID du user connecté
    let guideId;
    if ((req.user.role === 'super_admin' || req.user.role === 'leader') && bodyGuideId) {
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
