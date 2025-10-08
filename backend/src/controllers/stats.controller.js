import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtenir les statistiques globales
export const getGlobalStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Dates par défaut : début et fin du mois actuel
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    // Filtrer par guide si non admin
    const whereClause = {
      date: {
        gte: start,
        lte: end
      }
    };

    if (req.user && req.user.role !== 'admin') {
      whereClause.guideId = req.user.userId;
    }

    // Récupérer toutes les sessions avec leurs réservations
    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        bookings: {
          include: {
            payments: true,
            product: true
          }
        },
        products: {
          include: {
            product: true
          }
        }
      }
    });

    // Calculer les statistiques
    const stats = {
      totalSessions: sessions.length,
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      totalPeople: 0,
      averageFillRate: 0,
      revenueByDay: {},
      bookingsByProduct: {},
      bookingsByStatus: {
        pending: 0,
        confirmed: 0,
        cancelled: 0
      }
    };

    let totalCapacity = 0;
    let totalOccupied = 0;

    sessions.forEach(session => {
      session.bookings.forEach(booking => {
        stats.totalBookings++;
        stats.bookingsByStatus[booking.status]++;

        if (booking.status === 'confirmed') stats.confirmedBookings++;
        if (booking.status === 'pending') stats.pendingBookings++;
        if (booking.status === 'cancelled') stats.cancelledBookings++;

        if (booking.status !== 'cancelled') {
          stats.totalRevenue += booking.totalPrice;
          stats.totalPaid += booking.amountPaid;
          stats.totalPeople += booking.numberOfPeople;

          // Revenus par jour
          const dateKey = session.date.toISOString().split('T')[0];
          if (!stats.revenueByDay[dateKey]) {
            stats.revenueByDay[dateKey] = 0;
          }
          stats.revenueByDay[dateKey] += booking.totalPrice;

          // Réservations par produit
          const productName = booking.product?.name || 'Autre';
          if (!stats.bookingsByProduct[productName]) {
            stats.bookingsByProduct[productName] = 0;
          }
          stats.bookingsByProduct[productName]++;
        }
      });

      // Calculer le taux de remplissage
      const sessionProduct = session.products[0]?.product;
      if (sessionProduct) {
        totalCapacity += sessionProduct.maxCapacity;
        const sessionOccupancy = session.bookings
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + b.numberOfPeople, 0);
        totalOccupied += sessionOccupancy;
      }
    });

    stats.totalUnpaid = stats.totalRevenue - stats.totalPaid;
    stats.averageFillRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    res.json({
      success: true,
      stats,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les statistiques quotidiennes
export const getDailyStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause = {
      date: {
        gte: today,
        lt: tomorrow
      }
    };

    if (req.user && req.user.role !== 'admin') {
      whereClause.guideId = req.user.userId;
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        bookings: {
          include: {
            payments: true
          }
        }
      }
    });

    const stats = {
      totalSessions: sessions.length,
      totalBookings: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalPeople: 0
    };

    sessions.forEach(session => {
      session.bookings.forEach(booking => {
        if (booking.status !== 'cancelled') {
          stats.totalBookings++;
          stats.totalRevenue += booking.totalPrice;
          stats.totalPaid += booking.amountPaid;
          stats.totalPeople += booking.numberOfPeople;
        }
      });
    });

    res.json({
      success: true,
      stats,
      date: today.toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les dernières réservations
export const getRecentBookings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const whereClause = {};

    if (req.user && req.user.role !== 'admin') {
      whereClause.session = {
        guideId: req.user.userId
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
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
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
};
