/**
 * Service de gestion des notifications en temps réel via Socket.io
 * Ce service centralise l'envoi de notifications aux admins et clients
 */

let ioInstance = null;

/**
 * Initialise l'instance Socket.io
 * @param {Server} io - Instance Socket.io
 */
export const initNotificationService = (io) => {
  ioInstance = io;
  console.log('✅ Service de notifications initialisé');
};

/**
 * Envoie une notification à tous les admins connectés
 * @param {Object} notification - Données de la notification
 */
export const notifyAdmins = (notification) => {
  if (!ioInstance) {
    console.error('❌ Socket.io non initialisé');
    return;
  }

  const notificationData = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };

  ioInstance.to('admins').emit('notification', notificationData);
  console.log('📢 Notification envoyée aux admins:', notificationData.type);
};

/**
 * Envoie une notification à un client spécifique
 * @param {string|number} userId - ID du client
 * @param {Object} notification - Données de la notification
 */
export const notifyClient = (userId, notification) => {
  if (!ioInstance) {
    console.error('❌ Socket.io non initialisé');
    return;
  }

  const notificationData = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };

  ioInstance.to(`client-${userId}`).emit('notification', notificationData);
  console.log(`📢 Notification envoyée au client ${userId}:`, notificationData.type);
};

/**
 * Met à jour le calendrier en temps réel pour tous les admins
 * @param {Object} data - Données de mise à jour du calendrier
 */
export const updateCalendar = (data) => {
  if (!ioInstance) return;
  ioInstance.to('admins').emit('calendar-update', data);
};

/**
 * Types de notifications prédéfinis
 */
export const NotificationTypes = {
  // Notifications pour les admins
  NEW_BOOKING: 'new-booking',
  BOOKING_UPDATED: 'booking-updated',
  BOOKING_CANCELLED: 'booking-cancelled',
  PAYMENT_RECEIVED: 'payment-received',
  NEW_MESSAGE: 'new-message',

  // Notifications pour les clients
  BOOKING_CONFIRMED: 'booking-confirmed',
  BOOKING_STATUS_CHANGED: 'booking-status-changed',
  SESSION_REMINDER: 'session-reminder',
  ADMIN_MESSAGE: 'admin-message'
};

/**
 * Crée une notification de nouvelle réservation
 * @param {Object} booking - Données de la réservation
 */
export const createNewBookingNotification = (booking) => {
  return {
    type: NotificationTypes.NEW_BOOKING,
    title: 'Nouvelle réservation',
    message: `${booking.clientName} a réservé ${booking.productName}`,
    data: {
      bookingId: booking.id,
      clientName: booking.clientName,
      productName: booking.productName,
      sessionDate: booking.sessionDate,
      totalAmount: booking.totalAmount
    },
    priority: 'high'
  };
};

/**
 * Crée une notification de confirmation de réservation (pour le client)
 * @param {Object} booking - Données de la réservation
 */
export const createBookingConfirmedNotification = (booking) => {
  return {
    type: NotificationTypes.BOOKING_CONFIRMED,
    title: 'Réservation confirmée',
    message: `Votre réservation pour ${booking.productName} est confirmée`,
    data: {
      bookingId: booking.id,
      productName: booking.productName,
      sessionDate: booking.sessionDate
    },
    priority: 'normal'
  };
};

/**
 * Crée une notification d'annulation de réservation
 * @param {Object} booking - Données de la réservation
 */
export const createBookingCancelledNotification = (booking) => {
  return {
    type: NotificationTypes.BOOKING_CANCELLED,
    title: 'Réservation annulée',
    message: `La réservation de ${booking.clientName} a été annulée`,
    data: {
      bookingId: booking.id,
      clientName: booking.clientName,
      productName: booking.productName,
      reason: booking.cancellationReason
    },
    priority: 'medium'
  };
};

/**
 * Crée une notification de paiement reçu
 * @param {Object} payment - Données du paiement
 */
export const createPaymentReceivedNotification = (payment) => {
  return {
    type: NotificationTypes.PAYMENT_RECEIVED,
    title: 'Paiement reçu',
    message: `Paiement de ${payment.amount}€ reçu pour la réservation #${payment.bookingId}`,
    data: {
      bookingId: payment.bookingId,
      amount: payment.amount,
      paymentMethod: payment.method
    },
    priority: 'normal'
  };
};
