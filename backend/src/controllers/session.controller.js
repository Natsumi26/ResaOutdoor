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

        // Créer une date complète avec l'heure de début de la session
        const sessionDateTime = new Date(session.date);
        const [hours, minutes] = session.startTime.split(':');
        sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Vérifier si l'heure de début de la session est déjà passée
        const isSessionStarted = now >= sessionDateTime;

        // Si la session a déjà commencé, ne pas l'afficher aux clients
        if (isSessionStarted) {
          return; // Skip cette session
        }

        // Vérifier la fermeture automatique
        let isAutoClosed = false;
        if (product.autoCloseHoursBefore) {
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
        availableSessions: item.availableSessions.sort((a, b) => {
          // Trier par date d'abord
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;

          // Si même date, trier par heure de début
          return a.startTime.localeCompare(b.startTime);
        })
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
      if ((req.user.role === 'super_admin' && req.user.teamName !== null )||( req.user.role === 'leader' && req.user.teamName !== null)) {
        const teamGuides = await prisma.user.findMany({
          where: {
            teamName: req.user.teamName,
          },
          select: { id: true }
        });
        where.guideId = { in: teamGuides.map(g => g.id) };
      } else if (req.user.role === 'employee' || req.user.role === 'trainee' || req.user.teamName === null) {
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
            login: true,
            email: true,
            confidentialityPolicy: true,
            paymentMode: true,
            depositType: true,
            depositAmount: true
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
            email: true,
            confidentialityPolicy: true,
            paymentMode: true,
            depositType: true,
            depositAmount: true
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
      guideId,
      timeSlot,
      startTime,
      isMagicRotation,
      productIds,
      status,
      shoeRentalAvailable,
      shoeRentalPrice
    } = req.body;

    // Vérifier si la session existe
    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    const updateData = {};

    if (date) updateData.date = new Date(date);
    if (guideId) updateData.guideId = guideId;
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
    const updatedSession = await prisma.$transaction(async (tx) => {
      // Mettre à jour la session
      await tx.session.update({
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
      session: updatedSession
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Session non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Obtenir les sessions alternatives pour déplacer des réservations
export const getAlternativeSessions = async (req, res, next) => {
  try {
    const { id } = req.params; // ID de la session à supprimer

    // Récupérer la session actuelle avec ses produits
    const currentSession = await prisma.session.findUnique({
      where: { id },
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

    if (!currentSession) {
      throw new AppError('Session non trouvée', 404);
    }

    // Chercher d'autres sessions du même guide (peu importe les produits)
    const alternativeSessions = await prisma.session.findMany({
      where: {
        id: { not: id }, // Exclure la session actuelle
        guideId: currentSession.guideId, // Même guide
        date: { gte: new Date() }, // Sessions futures uniquement
        status: { in: ['open', 'full'] } // Sessions ouvertes ou complètes
      },
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
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: 20 // Limiter à 20 résultats
    });

    // Enrichir les sessions alternatives avec les infos de compatibilité
    const enrichedSessions = alternativeSessions
      .map(session => {
        // 🔒 Rotation magique : si la session alternative a déjà des réservations,
        // on verrouille sur le produit de la première réservation
        const lockedProductId = session.bookings.length > 0
          ? session.bookings[0].productId
          : null;

        // Calculer le nombre total de personnes à déplacer depuis la session actuelle
        const totalPeopleToMove = currentSession.bookings.reduce((sum, b) => sum + b.numberOfPeople, 0);

        // Vérifier la disponibilité de TOUS les produits de la session (pas seulement ceux en commun)
        const availableProducts = [];

        if (lockedProductId) {
          // Si un produit est verrouillé, vérifier seulement celui-là
          const productInSession = session.products.find(sp => sp.productId === lockedProductId);
          if (productInSession) {
            const capacity = productInSession.product.maxCapacity || 0;
            const bookedPeopleForProduct = session.bookings
              .filter(b => b.productId === lockedProductId && b.status !== 'cancelled')
              .reduce((sum, b) => sum + b.numberOfPeople, 0);

            const availableCapacity = capacity - bookedPeopleForProduct;

            if (availableCapacity >= totalPeopleToMove) {
              availableProducts.push({
                productId: lockedProductId,
                productName: productInSession.product.name,
                availableCapacity
              });
            }
          }
        } else {
          // Sinon, vérifier tous les produits de la session
          for (const sp of session.products) {
            const capacity = sp.product.maxCapacity || 0;
            const bookedPeopleForProduct = session.bookings
              .filter(b => b.productId === sp.productId && b.status !== 'cancelled')
              .reduce((sum, b) => sum + b.numberOfPeople, 0);

            const availableCapacity = capacity - bookedPeopleForProduct;

            if (availableCapacity >= totalPeopleToMove) {
              availableProducts.push({
                productId: sp.productId,
                productName: sp.product.name,
                availableCapacity
              });
            }
          }
        }

      const hasAvailableProduct = availableProducts.length > 0;

      return hasAvailableProduct
      ? {
          ...session,
          compatibilityInfo: {
            lockedProductId, // Produit verrouillé si rotation magique
            availableProducts, // Liste des produits disponibles avec capacité suffisante
            totalPeopleToMove
          }
        }
      : null;
    })
    .filter(Boolean); // Supprimer les sessions null (non compatibles)

    res.json({
      success: true,
      currentSession: {
        id: currentSession.id,
        date: currentSession.date,
        timeSlot: currentSession.timeSlot,
        startTime: currentSession.startTime,
        bookingsCount: currentSession.bookings.length,
        products: currentSession.products.map(sp => sp.product)
      },
      alternativeSessions: enrichedSessions
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une session
export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, targetSessionId } = req.body; // "delete" ou "move", et targetSessionId si move

    // Vérifier s'il y a des réservations
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            product: true,
            payments: true,
            participants: true,
            history: true,
            notes: true
          }
        }
      }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // S'il y a des réservations
    if (session.bookings.length > 0) {
      // Si aucune action spécifiée, retourner une erreur avec le nombre de réservations
      if (!action) {
        return res.status(409).json({
          success: false,
          error: 'Cette session contient des réservations',
          bookingsCount: session.bookings.length,
          bookings: session.bookings.map(b => ({
            id: b.id,
            clientName: `${b.clientFirstName} ${b.clientLastName}`,
            clientEmail: b.clientEmail,
            numberOfPeople: b.numberOfPeople,
            productName: b.product.name
          })),
          message: 'Veuillez spécifier si vous souhaitez déplacer ou supprimer les réservations'
        });
      }

      // Action: SUPPRIMER les réservations
      if (action === 'delete') {
        await prisma.$transaction(async (tx) => {
          // Supprimer toutes les réservations associées (cascade supprime participants, payments, history, notes)
          await tx.booking.deleteMany({
            where: { sessionId: id }
          });

          // Supprimer la session
          await tx.session.delete({
            where: { id }
          });
        });

        return res.json({
          success: true,
          message: `Session et ${session.bookings.length} réservation(s) supprimée(s) avec succès`
        });
      }

      // Action: DÉPLACER les réservations
      if (action === 'move') {
        if (!targetSessionId) {
          throw new AppError('ID de la session cible requis pour déplacer les réservations', 400);
        }

        // Vérifier que la session cible existe
        const targetSession = await prisma.session.findUnique({
          where: { id: targetSessionId },
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

        if (!targetSession) {
          throw new AppError('Session cible non trouvée', 404);
        }

        // 🔒 Rotation magique : déterminer le produit verrouillé dans la session cible
        const targetLockedProductId = targetSession.bookings.length > 0
          ? targetSession.bookings[0].productId
          : null;

        // Calculer le nombre total de personnes à déplacer
        const totalPeopleToMove = session.bookings.reduce((sum, b) => sum + b.numberOfPeople, 0);

        // Déterminer le produit à utiliser dans la session cible
        let targetProductId;

        if (targetLockedProductId) {
          // Si un produit est verrouillé, on doit l'utiliser
          targetProductId = targetLockedProductId;

          // Vérifier la capacité disponible
          const product = targetSession.products.find(sp => sp.productId === targetLockedProductId)?.product;
          if (!product) {
            throw new AppError('Le produit verrouillé n\'existe pas dans la session cible', 400);
          }

          const bookedPeople = targetSession.bookings
            .filter(b => b.productId === targetLockedProductId && b.status !== 'cancelled')
            .reduce((sum, b) => sum + b.numberOfPeople, 0);

          const availableCapacity = product.maxCapacity - bookedPeople;

          if (availableCapacity < totalPeopleToMove) {
            throw new AppError(`Capacité insuffisante : ${availableCapacity} places disponibles pour ${totalPeopleToMove} personnes`, 400);
          }
        } else {
          // Sinon, chercher n'importe quel produit avec capacité suffisante
          for (const sp of targetSession.products) {
            const bookedPeople = targetSession.bookings
              .filter(b => b.productId === sp.productId && b.status !== 'cancelled')
              .reduce((sum, b) => sum + b.numberOfPeople, 0);

            const availableCapacity = sp.product.maxCapacity - bookedPeople;

            if (availableCapacity >= totalPeopleToMove) {
              targetProductId = sp.productId;
              break;
            }
          }
        }

        if (!targetProductId) {
          throw new AppError('Aucun produit disponible avec une capacité suffisante dans la session cible', 400);
        }

        // Déplacer les réservations en transaction
        await prisma.$transaction(async (tx) => {
          // Mettre à jour chaque réservation individuellement
          for (const booking of session.bookings) {
            const oldProductId = booking.productId;
            const productChanged = oldProductId !== targetProductId;

            await tx.booking.update({
              where: { id: booking.id },
              data: {
                sessionId: targetSessionId,
                productId: targetProductId
              }
            });

            // Ajouter une entrée dans l'historique
            const historyDetails = productChanged
              ? `Réservation déplacée de la session du ${new Date(session.date).toLocaleDateString()} à ${session.startTime} (${booking.product.name}) vers la session du ${new Date(targetSession.date).toLocaleDateString()} à ${targetSession.startTime} (${targetSession.products.find(sp => sp.productId === targetProductId)?.product?.name || 'produit modifié'})`
              : `Réservation déplacée de la session du ${new Date(session.date).toLocaleDateString()} à ${session.startTime} vers la session du ${new Date(targetSession.date).toLocaleDateString()} à ${targetSession.startTime}`;

            await tx.bookingHistory.create({
              data: {
                bookingId: booking.id,
                action: 'modified',
                details: historyDetails
              }
            });
          }

          // Supprimer la session
          await tx.session.delete({
            where: { id }
          });
        });

        return res.json({
          success: true,
          message: `Session supprimée et ${session.bookings.length} réservation(s) déplacée(s) avec succès`,
          movedBookingsCount: session.bookings.length,
          targetProductId
        });
      }

      throw new AppError('Action invalide. Utilisez "delete" ou "move"', 400);
    }

    // Pas de réservations : suppression simple
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
