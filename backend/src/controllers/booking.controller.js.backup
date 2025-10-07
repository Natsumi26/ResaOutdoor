import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

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
            product: true
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
            product: true,
            guide: {
              select: {
                id: true,
                login: true,
                email: true
              }
            }
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
      sessionId
    } = req.body;

    if (!clientFirstName || !clientLastName || !clientEmail || !clientPhone || !numberOfPeople || !totalPrice || !sessionId) {
      throw new AppError('Champs requis manquants', 400);
    }

    // Vérifier la capacité de la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        product: true,
        bookings: true
      }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    const currentOccupancy = session.bookings.reduce((sum, b) => sum + b.numberOfPeople, 0);

    if (session.product && currentOccupancy + numberOfPeople > session.product.maxCapacity) {
      throw new AppError('Capacité maximale dépassée', 409);
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
          sessionId
        },
        include: {
          session: {
            include: {
              product: true
            }
          }
        }
      });

      // Créer l'entrée historique
      await tx.bookingHistory.create({
        data: {
          action: 'created',
          details: `Réservation créée pour ${numberOfPeople} personne(s)`,
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

    // Convertir les types si nécessaire
    if (updateData.numberOfPeople) {
      updateData.numberOfPeople = parseInt(updateData.numberOfPeople);
    }
    if (updateData.totalPrice) {
      updateData.totalPrice = parseFloat(updateData.totalPrice);
    }
    if (updateData.amountPaid) {
      updateData.amountPaid = parseFloat(updateData.amountPaid);
    }

    const booking = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          session: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });

      // Créer l'entrée historique
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

// Ajouter un paiement à une réservation
export const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, stripeId, notes } = req.body;

    if (!amount || !method) {
      throw new AppError('Montant et méthode de paiement requis', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id }
      });

      if (!booking) {
        throw new AppError('Réservation non trouvée', 404);
      }

      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount),
          method,
          stripeId,
          notes,
          bookingId: id
        }
      });

      const newAmountPaid = booking.amountPaid + parseFloat(amount);

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          status: newAmountPaid >= booking.totalPrice ? 'confirmed' : booking.status
        },
        include: {
          payments: true,
          session: {
            include: {
              product: true
            }
          }
        }
      });

      await tx.bookingHistory.create({
        data: {
          action: 'payment',
          details: `Paiement de ${amount}€ via ${method}`,
          bookingId: id
        }
      });

      return { payment, booking: updatedBooking };
    });

    res.json({
      success: true,
      payment: result.payment,
      booking: result.booking
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
          session: {
            include: {
              product: true
            }
          },
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

    const booking = await prisma.$transaction(async (tx) => {
      // Vérifier la nouvelle session
      const newSession = await tx.session.findUnique({
        where: { id: newSessionId },
        include: {
          product: true,
          bookings: true
        }
      });

      if (!newSession) {
        throw new AppError('Nouvelle session non trouvée', 404);
      }

      // Vérifier la capacité
      const currentBooking = await tx.booking.findUnique({
        where: { id }
      });

      const currentOccupancy = newSession.bookings.reduce((sum, b) => sum + b.numberOfPeople, 0);

      if (newSession.product && currentOccupancy + currentBooking.numberOfPeople > newSession.product.maxCapacity) {
        throw new AppError('Capacité maximale dépassée pour la nouvelle session', 409);
      }

      const movedBooking = await tx.booking.update({
        where: { id },
        data: { sessionId: newSessionId },
        include: {
          session: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });

      await tx.bookingHistory.create({
        data: {
          action: 'modified',
          details: `Réservation déplacée vers une nouvelle session`,
          bookingId: id
        }
      });

      return movedBooking;
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
