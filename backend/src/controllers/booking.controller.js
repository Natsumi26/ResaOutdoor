import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendBookingConfirmation } from '../services/email.service.js';

// Lister toutes les réservations
export const getAllBookings = async (req, res, next) => {
  try {
    const { sessionId, status } = req.query;

    const where = {};
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        session: {
          include: {
            guide: {
              select: {
                id: true,
                login: true
              }
            }
          }
        },
        product: {
          include: {
            category: true
          }
        },
        payments: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir une réservation par ID
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            products: {
              include: {
                product: true
              }
            },
            guide: {
              select: {
                id: true,
                login: true,
                email: true
              }
            }
          }
        },
        product: {
          include: {
            category: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Créer une réservation
export const createBooking = async (req, res, next) => {
  try {
    const {
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      clientNationality,
      numberOfPeople,
      totalPrice,
      amountPaid,
      status,
      sessionId,
      productId  // Le client choisit un produit spécifique
    } = req.body;

    if (!clientFirstName || !clientLastName || !clientEmail || !clientPhone ||
        !numberOfPeople || !totalPrice || !sessionId || !productId) {
      throw new AppError('Champs requis manquants', 400);
    }

    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // Vérifier que le produit fait partie de cette session
    const sessionProduct = session.products.find(sp => sp.productId === productId);
    if (!sessionProduct) {
      throw new AppError('Ce produit n\'est pas disponible pour cette session', 400);
    }

    const product = sessionProduct.product;

    // LOGIQUE DE ROTATION MAGIQUE
    if (session.isMagicRotation) {
      // Vérifier si le guide a déjà une réservation sur ce créneau
      const hasBooking = session.bookings.length > 0;

      if (hasBooking) {
        // Il y a déjà une réservation, vérifier si c'est pour le même produit
        const existingProductId = session.bookings[0].productId;

        if (existingProductId !== productId) {
          throw new AppError('Ce créneau est déjà réservé pour un autre canyon. Le guide n\'est plus disponible.', 409);
        }

        // C'est le même produit, vérifier la capacité
        const currentOccupancy = session.bookings
          .filter(b => b.productId === productId)
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        if (currentOccupancy + numberOfPeople > product.maxCapacity) {
          throw new AppError(`Capacité maximale atteinte pour ${product.name} (${product.maxCapacity} places)`, 409);
        }
      }
    } else {
      // Mode normal : vérifier simplement la capacité du produit
      const currentOccupancy = session.bookings
        .filter(b => b.productId === productId)
        .reduce((sum, b) => sum + b.numberOfPeople, 0);

      if (currentOccupancy + numberOfPeople > product.maxCapacity) {
        throw new AppError(`Capacité maximale atteinte pour ${product.name} (${product.maxCapacity} places)`, 409);
      }
    }

    // Créer la réservation avec transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          clientFirstName,
          clientLastName,
          clientEmail,
          clientPhone,
          clientNationality,
          numberOfPeople: parseInt(numberOfPeople),
          totalPrice: parseFloat(totalPrice),
          amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
          status: status || 'pending',
          sessionId,
          productId
        },
        include: {
          session: {
            include: {
              guide: true
            }
          },
          product: {
            include: {
              category: true
            }
          }
        }
      });

      // Créer l'entrée historique
      await tx.bookingHistory.create({
        data: {
          action: 'created',
          details: `Réservation créée pour ${numberOfPeople} personne(s) - ${product.name}`,
          bookingId: newBooking.id
        }
      });

      // Si un paiement initial est effectué
      if (amountPaid && amountPaid > 0) {
        await tx.payment.create({
          data: {
            amount: parseFloat(amountPaid),
            method: 'other',
            bookingId: newBooking.id
          }
        });

        await tx.bookingHistory.create({
          data: {
            action: 'payment',
            details: `Paiement de ${amountPaid}€`,
            bookingId: newBooking.id
          }
        });
      }

      return newBooking;
    });

    // Envoyer l'email de confirmation (asynchrone, ne bloque pas la réponse)
    sendBookingConfirmation(booking).catch(err => {
      console.error('Erreur envoi email de confirmation:', err);
      // L'email échoue mais la réservation est créée
    });

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une réservation
export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Supprimer les champs non modifiables
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.session;
    delete updateData.product;
    delete updateData.payments;
    delete updateData.history;

    // Convertir les types si nécessaire
    if (updateData.numberOfPeople) {
      updateData.numberOfPeople = parseInt(updateData.numberOfPeople);
    }
    if (updateData.totalPrice) {
      updateData.totalPrice = parseFloat(updateData.totalPrice);
    }
    if (updateData.amountPaid !== undefined) {
      updateData.amountPaid = parseFloat(updateData.amountPaid);
    }

    const booking = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          session: {
            include: {
              guide: true
            }
          },
          product: {
            include: {
              category: true
            }
          },
          payments: true,
          history: true
        }
      });

      // Ajouter à l'historique
      await tx.bookingHistory.create({
        data: {
          action: 'modified',
          details: 'Réservation modifiée',
          bookingId: id
        }
      });

      return updatedBooking;
    });

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Réservation non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Ajouter un paiement
export const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, notes } = req.body;

    if (!amount || !method) {
      throw new AppError('Montant et méthode requis', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount),
          method,
          notes,
          bookingId: id
        }
      });

      // Mettre à jour le montant payé
      const newAmountPaid = booking.amountPaid + parseFloat(amount);
      await tx.booking.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          status: newAmountPaid >= booking.totalPrice ? 'confirmed' : 'pending'
        }
      });

      // Ajouter à l'historique
      await tx.bookingHistory.create({
        data: {
          action: 'payment',
          details: `Paiement de ${amount}€ via ${method}`,
          bookingId: id
        }
      });

      return payment;
    });

    res.status(201).json({
      success: true,
      payment: result
    });
  } catch (error) {
    next(error);
  }
};

// Annuler une réservation
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.$transaction(async (tx) => {
      const cancelledBooking = await tx.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          session: true,
          product: true,
          payments: true
        }
      });

      await tx.bookingHistory.create({
        data: {
          action: 'cancelled',
          details: 'Réservation annulée',
          bookingId: id
        }
      });

      return cancelledBooking;
    });

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Réservation non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Déplacer une réservation vers une autre session
export const moveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newSessionId } = req.body;

    if (!newSessionId) {
      throw new AppError('ID de la nouvelle session requis', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    // Vérifier la nouvelle session
    const newSession = await prisma.session.findUnique({
      where: { id: newSessionId },
      include: {
        products: {
          include: {
            product: true
          }
        },
        bookings: true
      }
    });

    if (!newSession) {
      throw new AppError('Nouvelle session non trouvée', 404);
    }

    // Vérifier que le produit est disponible dans la nouvelle session
    const productAvailable = newSession.products.some(sp => sp.productId === booking.productId);
    if (!productAvailable) {
      throw new AppError('Ce produit n\'est pas disponible dans la nouvelle session', 400);
    }

    // Vérifier la capacité
    const currentOccupancy = newSession.bookings
      .filter(b => b.productId === booking.productId)
      .reduce((sum, b) => sum + b.numberOfPeople, 0);

    if (currentOccupancy + booking.numberOfPeople > booking.product.maxCapacity) {
      throw new AppError('Capacité maximale atteinte dans la nouvelle session', 409);
    }

    const movedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: { sessionId: newSessionId },
        include: {
          session: true,
          product: true
        }
      });

      await tx.bookingHistory.create({
        data: {
          action: 'modified',
          details: `Réservation déplacée vers une nouvelle session`,
          bookingId: id
        }
      });

      return updated;
    });

    res.json({
      success: true,
      booking: movedBooking
    });
  } catch (error) {
    next(error);
  }
};
