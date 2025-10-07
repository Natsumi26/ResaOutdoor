import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import WeeklyCalendar from '../components/WeeklyCalendar';
import BookingModal from '../components/BookingModal';
import SessionForm from '../components/SessionForm';
import { sessionsAPI, bookingsAPI, productsAPI } from '../services/api';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionFormDate, setSessionFormDate] = useState(null);

  // Charger les sessions de la semaine
  const loadSessions = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const response = await sessionsAPI.getAll({
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd')
      });

      setSessions(response.data.sessions || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      setError('Impossible de charger les sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadProducts();
  }, [currentWeek]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    }
  };

  // Gérer le déplacement d'une réservation
  const handleMoveBooking = async (bookingId, newSessionId) => {
    try {
      await bookingsAPI.move(bookingId, { newSessionId });
      // Recharger les sessions après le déplacement
      loadSessions();
    } catch (err) {
      console.error('Erreur déplacement réservation:', err);
      alert('Impossible de déplacer la réservation: ' + (err.response?.data?.message || err.message));
    }
  };

  // Gérer le clic sur une session
  const handleSessionClick = (session) => {
    setEditingSession(session);
    setShowSessionForm(true);
  };

  // Gérer le clic sur une réservation
  const handleBookingClick = (bookingId) => {
    setSelectedBookingId(bookingId);
  };

  // Fermer la modale et recharger les données
  const handleCloseModal = () => {
    setSelectedBookingId(null);
  };

  const handleBookingUpdate = () => {
    loadSessions(); // Recharger pour voir les changements
  };

  const handleNewSession = (date = null) => {
    setEditingSession(null);
    setSessionFormDate(date);
    setShowSessionForm(true);
  };

  const handleSessionSubmit = async (data) => {
    try {
      if (editingSession) {
        await sessionsAPI.update(editingSession.id, data);
      } else {
        await sessionsAPI.create(data);
      }
      await loadSessions();
      setShowSessionForm(false);
      setEditingSession(null);
      setSessionFormDate(null);
    } catch (err) {
      console.error('Erreur sauvegarde session:', err);
      alert('Erreur lors de la sauvegarde: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSessionCancel = () => {
    setShowSessionForm(false);
    setEditingSession(null);
    setSessionFormDate(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📅 Calendrier Hebdomadaire</h1>
        </div>
        <div className={styles.calendarContainer}>
          <p className={styles.placeholder}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📅 Calendrier Hebdomadaire</h1>
        </div>
        <div className={styles.calendarContainer}>
          <p className={styles.placeholder} style={{ color: '#ef4444' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📅 Calendrier Hebdomadaire</h1>
        {!showSessionForm && (
          <button className={styles.btnPrimary} onClick={() => handleNewSession()}>
            + Nouvelle Session
          </button>
        )}
      </div>

      {showSessionForm ? (
        <div className={styles.formWrapper}>
          <SessionForm
            session={editingSession}
            products={products}
            initialDate={sessionFormDate}
            onSubmit={handleSessionSubmit}
            onCancel={handleSessionCancel}
          />
        </div>
      ) : (
        <WeeklyCalendar
          sessions={sessions}
          onMoveBooking={handleMoveBooking}
          onSessionClick={handleSessionClick}
          onBookingClick={handleBookingClick}
        />
      )}

      {/* Modale de détails de réservation */}
      {selectedBookingId && (
        <BookingModal
          bookingId={selectedBookingId}
          onClose={handleCloseModal}
          onUpdate={handleBookingUpdate}
        />
      )}
    </div>
  );
};

export default Calendar;
