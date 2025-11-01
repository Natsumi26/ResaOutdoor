import { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './WeeklyCalendar.module.css';
import SessionSlot from './SessionSlot';
import { settingsAPI } from '../services/api';

const WeeklyCalendar = ({ sessions, onMoveBooking, onSessionClick, onBookingClick, onCreateBooking, onCreateSession, onDeleteSession, onWeekChange, selectedDate, currentUser }) => {
  const [primaryColor, setPrimaryColor] = useState('#3498db');

  // Charger la couleur primary depuis les settings
  useEffect(() => {
    const loadThemeColor = async () => {
      try {
        const response = await settingsAPI.get();
        const settings = response.data.settings;
        if (settings?.primaryColor) {
          setPrimaryColor(settings.primaryColor);
        }
      } catch (error) {
        console.error('Erreur chargement couleur thème:', error);
      }
    };
    loadThemeColor();
  }, []);

  // Convertir hex en rgba avec opacité
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Générer les 7 jours de la semaine
  const weekStart = selectedDate
  ? new Date(selectedDate)
  : new Date(); // aujourd'hui si aucune date sélectionnée
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

  const goToPreviousWeek = () => {
    onWeekChange(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    onWeekChange(addDays(weekStart, 7));
  };


  const goToToday = () => {
    onWeekChange(new Date());
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) return;

    // Extraire l'ID de session en enlevant le préfixe "session-"
    const newSessionId = destination.droppableId.replace('session-', '');

    // Déplacer la réservation
    onMoveBooking(draggableId, newSessionId);
  };


  return (
    <div className={styles.container}>
      {/* Barre de navigation en haut */}
      <div className={styles.topBar}>
        <div className={styles.leftControls}>
          <button className={styles.todayBtn} onClick={goToToday}>
            Aujourd'hui
          </button>
          <button className={styles.navBtn} onClick={goToPreviousWeek}>
            ◀
          </button>
          <button className={styles.navBtn} onClick={goToNextWeek}>
            ▶
          </button>
        </div>

        {/* Filtres sur une ligne */}
        <div className={styles.filtersContainer}>
          <label htmlFor="dateInput" className={styles.filtersLabel}>
            Aller à la date →
          </label>
          <input
            id="dateInput"
            type="date"
            className={styles.filterBtn}
            value={selectedDate}
            onChange={(e) => {
              onWeekChange(new Date(e.target.value));
            }}
          />
        </div>
      </div>

      {/* En-tête avec les jours de la semaine */}
      <div className={styles.weekHeader}>
        {weekDays.map((day) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div
              key={day.toString()}
              className={`${styles.dayColumn} ${isToday ? styles.todayColumn : ''}`}
              style={isToday ? { backgroundColor: hexToRgba(primaryColor, 0.7) } : {}}
            >
              <div className={styles.dayName}>
                {format(day, 'EEEE', { locale: fr })}
              </div>
              <div className={styles.dayDate}>
                {format(day, 'dd/MM')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendrier des sessions */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.calendarContent}>
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const morningSessions = sessionsByDay[dateKey]?.matin || [];
            const afternoonSessions = sessionsByDay[dateKey]?.['après-midi'] || [];
            const hasAnySessions = morningSessions.length > 0 || afternoonSessions.length > 0;

            return (
              <div key={dateKey} className={styles.daySection}>
                <div className={styles.daySectionHeader}>
                  <span className={styles.daySectionTitle}>
                    {format(day, 'EEEE dd/MM', { locale: fr })}
                  </span>
                  {currentUser.role !== 'trainee' && onCreateSession && (
                    <button
                      className={styles.btnAddSession}
                      onClick={() => onCreateSession(day)}
                      title="Nouvelle session"
                    >
                      + Nouveau...
                    </button>
                  )}
                </div>

                {!hasAnySessions && (
                  <div className={styles.emptyDay}>
                    Rien de prévu ! 🌄
                  </div>
                )}

                {/* Deux colonnes : Matin et Après-midi côte à côte */}
                {hasAnySessions && (
                  <div className={styles.timeSlotsGrid}>
                    {/* Colonne Matin */}
                    <div className={styles.timeSlotBlock}>
                      <div className={styles.timeSlotLabel}>Matin</div>
                      <div className={styles.sessionsBlock}>
                        {morningSessions.length > 0 ? (
                          morningSessions.map(session => (
                            <SessionSlot
                              key={session.id}
                              session={session}
                              onClick={() => onSessionClick(session)}
                              onBookingClick={onBookingClick}
                              onCreateBooking={onCreateBooking}
                              onDeleteSession={onDeleteSession}
                            />
                          ))
                        ) : (
                          <div className={styles.emptySlot}>-</div>
                        )}
                      </div>
                    </div>

                    {/* Colonne Après-midi */}
                    <div className={styles.timeSlotBlock}>
                      <div className={styles.timeSlotLabel}>Après-midi</div>
                      <div className={styles.sessionsBlock}>
                        {afternoonSessions.length > 0 ? (
                          afternoonSessions.map(session => (
                            <SessionSlot
                              key={session.id}
                              session={session}
                              onClick={() => onSessionClick(session)}
                              onBookingClick={onBookingClick}
                              onCreateBooking={onCreateBooking}
                              onDeleteSession={onDeleteSession}
                            />
                          ))
                        ) : (
                          <div className={styles.emptySlot}>-</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default WeeklyCalendar;
