import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { sessionsAPI, bookingsAPI } from '../services/api';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

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
  }, [currentWeek]);

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
    console.log('Session cliquée:', session);
    // TODO: Ouvrir une modale de détails de session
  };

  const handleNewSession = () => {
    console.log('Créer nouvelle session');
    // TODO: Ouvrir une modale de création de session
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
        <button className={styles.btnPrimary} onClick={handleNewSession}>
          + Nouvelle Session
        </button>
      </div>

      <WeeklyCalendar
        sessions={sessions}
        onMoveBooking={handleMoveBooking}
        onSessionClick={handleSessionClick}
      />
    </div>
  );
};

export default Calendar;
