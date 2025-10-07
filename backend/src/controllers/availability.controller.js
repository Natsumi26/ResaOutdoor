import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtenir la disponibilité d'un produit pour une date donnée
export const getProductAvailability = async (req, res, next) => {
  try {
    const { productId, date } = req.query;

    if (!productId || !date) {
      throw new AppError('productId et date requis', 400);
    }

    const searchDate = new Date(date);

    // Trouver toutes les sessions contenant ce produit pour cette date
    const sessions = await prisma.session.findMany({
      where: {
        date: searchDate,
        products: {
          some: {
            productId
          }
        }
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
        },
        guide: {
          select: {
            id: true,
            login: true
          }
        }
      }
    });

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Calculer la disponibilité pour chaque session
    const availability = sessions.map(session => {
      // Vérifier si cette session est en rotation magique
      if (session.isMagicRotation) {
        const hasBooking = session.bookings.length > 0;

        if (hasBooking) {
          // Il y a déjà une réservation
          const firstBookingProductId = session.bookings[0].productId;

          if (firstBookingProductId !== productId) {
            // Le guide est occupé avec un autre canyon
            return {
              sessionId: session.id,
              timeSlot: session.timeSlot,
              startTime: session.startTime,
              guide: session.guide,
              available: false,
              reason: 'Guide occupé avec un autre canyon',
              placesLeft: 0,
              maxCapacity: product.maxCapacity
            };
          } else {
            // C'est le même produit, calculer les places restantes
            const occupancy = session.bookings
              .filter(b => b.productId === productId)
              .reduce((sum, b) => sum + b.numberOfPeople, 0);

            const placesLeft = product.maxCapacity - occupancy;

            return {
              sessionId: session.id,
              timeSlot: session.timeSlot,
              startTime: session.startTime,
              guide: session.guide,
              available: placesLeft > 0,
              reason: placesLeft > 0 ? null : 'Complet',
              placesLeft,
              maxCapacity: product.maxCapacity,
              isMagicRotation: true
            };
          }
        } else {
          // Pas encore de réservation, tout est disponible
          return {
            sessionId: session.id,
            timeSlot: session.timeSlot,
            startTime: session.startTime,
            guide: session.guide,
            available: true,
            reason: null,
            placesLeft: product.maxCapacity,
            maxCapacity: product.maxCapacity,
            isMagicRotation: true
          };
        }
      } else {
        // Mode normal
        const occupancy = session.bookings
          .filter(b => b.productId === productId)
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        const placesLeft = product.maxCapacity - occupancy;

        return {
          sessionId: session.id,
          timeSlot: session.timeSlot,
          startTime: session.startTime,
          guide: session.guide,
          available: placesLeft > 0,
          reason: placesLeft > 0 ? null : 'Complet',
          placesLeft,
          maxCapacity: product.maxCapacity,
          isMagicRotation: false
        };
      }
    });

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        maxCapacity: product.maxCapacity
      },
      date: searchDate,
      availability
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir tous les produits disponibles pour une session donnée
export const getSessionAvailableProducts = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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
        bookings: {
          include: {
            product: true
          }
        }
      }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // Calculer la disponibilité pour chaque produit
    const productsAvailability = session.products.map(sp => {
      const product = sp.product;

      if (session.isMagicRotation) {
        const hasBooking = session.bookings.length > 0;

        if (hasBooking) {
          const firstBookingProductId = session.bookings[0].productId;

          if (firstBookingProductId !== product.id) {
            // Produit bloqué
            return {
              ...product,
              available: false,
              reason: 'Guide occupé avec un autre canyon',
              placesLeft: 0
            };
          } else {
            // Calculer les places restantes
            const occupancy = session.bookings
              .filter(b => b.productId === product.id)
              .reduce((sum, b) => sum + b.numberOfPeople, 0);

            const placesLeft = product.maxCapacity - occupancy;

            return {
              ...product,
              available: placesLeft > 0,
              reason: placesLeft > 0 ? null : 'Complet',
              placesLeft
            };
          }
        } else {
          // Tous disponibles
          return {
            ...product,
            available: true,
            reason: null,
            placesLeft: product.maxCapacity
          };
        }
      } else {
        // Mode normal
        const occupancy = session.bookings
          .filter(b => b.productId === product.id)
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        const placesLeft = product.maxCapacity - occupancy;

        return {
          ...product,
          available: placesLeft > 0,
          reason: placesLeft > 0 ? null : 'Complet',
          placesLeft
        };
      }
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        date: session.date,
        timeSlot: session.timeSlot,
        startTime: session.startTime,
        isMagicRotation: session.isMagicRotation
      },
      products: productsAvailability
    });
  } catch (error) {
    next(error);
  }
};
