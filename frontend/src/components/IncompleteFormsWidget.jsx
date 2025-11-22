import { useState, useEffect } from 'react';
import { bookingsAPI, emailAPI } from '../services/api';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './IncompleteFormsWidget.module.css';

const IncompleteFormsWidget = () => {
  const [incompleteBookings, setIncompleteBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState([]);
  const [sentIds, setSentIds] = useState([]);

  useEffect(() => {
    loadIncompleteBookings();
  }, []);

  const loadIncompleteBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAll();
      const bookings = response.data.bookings;

      // Filtrer les réservations des 3 prochains jours avec formulaire incomplet
      const now = startOfDay(new Date());
      const threeDaysLater = addDays(now, 3);

      const filtered = bookings.filter(booking => {
        const sessionDate = new Date(booking.session.date);
        return (
          booking.status !== 'cancelled' &&
          !booking.participantsFormCompleted &&
          isAfter(sessionDate, now) &&
          isBefore(sessionDate, threeDaysLater)
        );
      });

      // Trier par date
      filtered.sort((a, b) => new Date(a.session.date) - new Date(b.session.date));

      setIncompleteBookings(filtered);
    } catch (error) {
      console.error('Erreur chargement formulaires incomplets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (bookingId) => {
    setSendingIds(prev => [...prev, bookingId]);

    try {
      await emailAPI.sendFormReminder(bookingId);
      alert('Email de rappel envoyé avec succès !');
      setSentIds(prev => [...prev, bookingId]);
      loadIncompleteBookings();
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('Erreur lors de l\'envoi de l\'email: ' + (error.response?.data?.message || error.message));
    } finally {
      setSendingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (incompleteBookings.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de formulaires incomplets
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tailles à récupérer</h3>
        <p className={styles.subtitle}>
          {incompleteBookings.length} client{incompleteBookings.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className={styles.bookingsList}>
        {incompleteBookings.map(booking => {
          const isSending = sendingIds.includes(booking.id);
          const isSent = sentIds.includes(booking.id);
          return (
            <div key={booking.id} className={styles.bookingItem}>
              <div className={styles.bookingInfo}>
                <div className={styles.bookingMain}>
                  <div className={styles.clientNameRow}>
                    <span className={styles.clientName}>
                      {booking.clientLastName}
                    </span>
                    <span className={styles.clientBadge}>
                      {booking.numberOfPeople}
                    </span>
                  </div>
                  <span className={styles.bookingDetails}>
                    {booking.product?.name} - {format(new Date(booking.session.date), 'EEEE', { locale: fr })} {booking.session.timeSlot}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleSendReminder(booking.id)}
                disabled={isSending}
                className={`${styles.sendButton} ${isSent ? styles.sent : ''}`}
                title={isSent ? "Rappel envoyé" : "Envoyer un rappel"}
              >
                {isSending ? '...' : isSent ? '✓' : '📧'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncompleteFormsWidget;
