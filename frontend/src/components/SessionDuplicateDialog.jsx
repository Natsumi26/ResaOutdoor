import { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './SessionDuplicateDialog.module.css';

const SessionDuplicateDialog = ({ session, onConfirm, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);

  // Générer les jours du mois
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Jours de la semaine pour l'en-tête
  const weekDays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

  // Ajouter des jours vides au début pour aligner le calendrier
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1).fill(null);

  const toggleDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const sessionDateString = format(new Date(session.date), 'yyyy-MM-dd');

    // Ne pas permettre de sélectionner la date de la session originale
    if (dateString === sessionDateString) return;

    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(d => d !== dateString);
      } else {
        return [...prev, dateString];
      }
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addDays(endOfMonth(prev), 1));
  };

  const handleConfirm = () => {
    onConfirm(selectedDates);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2>📋 Dupliquer la session</h2>

        {session && (
          <div className={styles.sessionInfo}>
            <p><strong>Session :</strong> {format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr })}</p>
            <p><strong>Créneau :</strong> {session.timeSlot} - {session.startTime}</p>
            <p><strong>Canyons :</strong> {session.products.map(sp => sp.product.name).join(', ')}</p>
          </div>
        )}

        <p className={styles.instruction}>Sélectionnez les jours sur lesquels dupliquer cette session :</p>

        {/* Navigation du mois */}
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={goToPreviousMonth}>◀</button>
          <h3>{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h3>
          <button className={styles.navBtn} onClick={goToNextMonth}>▶</button>
        </div>

        {/* Calendrier */}
        <div className={styles.calendar}>
          {/* En-tête des jours */}
          {weekDays.map(day => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}

          {/* Jours vides au début */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className={styles.emptyDay}></div>
          ))}

          {/* Jours du mois */}
          {daysInMonth.map(day => {
            const dateString = format(day, 'yyyy-MM-dd');
            const sessionDateString = format(new Date(session.date), 'yyyy-MM-dd');
            const isSelected = selectedDates.includes(dateString);
            const isSessionDate = dateString === sessionDateString;
            const isCurrentDay = isToday(day);

            return (
              <div
                key={dateString}
                className={`${styles.day} ${isSelected ? styles.selected : ''} ${isSessionDate ? styles.sessionDate : ''} ${isCurrentDay ? styles.today : ''}`}
                onClick={() => toggleDate(day)}
                title={isSessionDate ? 'Date de la session originale' : ''}
              >
                {format(day, 'd')}
                {isSelected && <span className={styles.checkmark}>✓</span>}
              </div>
            );
          })}
        </div>

        <div className={styles.selectedInfo}>
          {selectedDates.length} jour(s) sélectionné(s)
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Annuler
          </button>
          <button
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={selectedDates.length === 0}
          >
            Dupliquer sur {selectedDates.length} jour(s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDuplicateDialog;
