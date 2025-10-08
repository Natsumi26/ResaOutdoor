import { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './WeeklyCalendar.module.css';
import SessionSlot from './SessionSlot';

const WeeklyCalendar = ({ sessions, onMoveBooking, onSessionClick, onBookingClick, onCreateBooking }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filters, setFilters] = useState({
    reservations: true,
    paiements: false,
    stocks: false
  });

  // Générer les 7 jours de la semaine
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lundi
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Organiser les sessions par jour et créneaux
  const organizeSessionsByDay = () => {
    const organized = {};

    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      organized[dateKey] = {
        matin: [],
        'après-midi': []
      };
    });

    sessions.forEach(session => {
      const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
      if (organized[dateKey]) {
        const timeSlot = session.timeSlot.toLowerCase();
        if (organized[dateKey][timeSlot]) {
          organized[dateKey][timeSlot].push(session);
        }
      }
    });

    return organized;
  };

  const sessionsByDay = organizeSessionsByDay();

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;

    if (source.droppableId === destination.droppableId) return;

    // Extraire l'ID de la réservation et de la nouvelle session
    const bookingId = draggableId;
    const newSessionId = destination.droppableId.split('-')[2];

    onMoveBooking(bookingId, newSessionId);
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  return (
    <div className={styles.container}>
      {/* Header avec navigation et jours */}
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button className={styles.todayBtn} onClick={goToToday}>
            Aujourd'hui
          </button>
          <button className={styles.navBtn} onClick={goToPreviousWeek}>
            ◀
          </button>

          {/* Jours de la semaine */}
          <div className={styles.weekDays}>
            {weekDays.map(day => (
              <div key={day.toString()} className={styles.dayHeaderCompact}>
                <span className={styles.dayNameCompact}>
                  {format(day, 'EEEEEE', { locale: fr })}
                </span>
                <span className={styles.dayDateCompact}>
                  {format(day, 'dd/MM')}
                </span>
              </div>
            ))}
          </div>

          <button className={styles.navBtn} onClick={goToNextWeek}>
            ▶
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className={styles.filtersBar}>
        <div className={styles.filtersLabel}>▸ Filtres</div>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filters.reservations ? styles.active : ''}`}
            onClick={() => setFilters({...filters, reservations: !filters.reservations})}
          >
            <span className={styles.dotGreen}></span> Réservations
          </button>
          <button
            className={`${styles.filterBtn} ${filters.paiements ? styles.active : ''}`}
            onClick={() => setFilters({...filters, paiements: !filters.paiements})}
          >
            <span className={styles.dotPurple}></span> Paiements
          </button>
          <button
            className={`${styles.filterBtn} ${filters.stocks ? styles.active : ''}`}
            onClick={() => setFilters({...filters, stocks: !filters.stocks})}
          >
            <span className={styles.dotGray}></span> Capacité
          </button>
        </div>
      </div>

      {/* Calendrier en liste verticale */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.calendarList}>
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const morningSessions = sessionsByDay[dateKey]?.matin || [];
            const afternoonSessions = sessionsByDay[dateKey]?.['après-midi'] || [];

            return (
              <div key={dateKey} className={styles.dayRow}>
                {/* En-tête du jour */}
                <div className={styles.dayRowHeader}>
                  <span className={styles.dayRowName}>
                    {format(day, 'EEEE', { locale: fr })}
                  </span>
                  <span className={styles.dayRowDate}>
                    {format(day, 'dd/MM')}
                  </span>
                </div>

                {/* Deux colonnes: Matin et Après-midi */}
                <div className={styles.dayRowContent}>
                  {/* Colonne Matin */}
                  <div className={styles.timeSlotColumn}>
                    <div className={styles.timeSlotColumnHeader}>Matin</div>
                    <div className={styles.sessionsContainer}>
                      {morningSessions.length > 0 ? (
                        morningSessions.map(session => (
                          <SessionSlot
                            key={session.id}
                            session={session}
                            onClick={() => onSessionClick(session)}
                            onBookingClick={onBookingClick}
                            onCreateBooking={onCreateBooking}
                            filters={filters}
                          />
                        ))
                      ) : (
                        <div className={styles.emptySlot}>Aucune session</div>
                      )}
                    </div>
                  </div>

                  {/* Colonne Après-midi */}
                  <div className={styles.timeSlotColumn}>
                    <div className={styles.timeSlotColumnHeader}>Après-midi</div>
                    <div className={styles.sessionsContainer}>
                      {afternoonSessions.length > 0 ? (
                        afternoonSessions.map(session => (
                          <SessionSlot
                            key={session.id}
                            session={session}
                            onClick={() => onSessionClick(session)}
                            onBookingClick={onBookingClick}
                            onCreateBooking={onCreateBooking}
                            filters={filters}
                          />
                        ))
                      ) : (
                        <div className={styles.emptySlot}>Aucune session</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default WeeklyCalendar;
