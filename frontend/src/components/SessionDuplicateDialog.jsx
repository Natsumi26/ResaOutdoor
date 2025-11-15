import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, eachWeekendOfInterval, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './SessionDuplicateDialog.module.css';

const SessionDuplicateDialog = ({ session, onConfirm, onCancel }) => {
  // Calculer la date J+1 de la session originale
  const nextDay = session ? addDays(new Date(session.date), 1) : new Date();
  const defaultStartDate = format(nextDay, 'yyyy-MM-dd');

  const [duplicateMode, setDuplicateMode] = useState('custom'); // 'daily', 'weekend', 'custom'
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [calculatedDates, setCalculatedDates] = useState([]);

  // Mettre à jour la date de début quand la session change
  useEffect(() => {
    if (session) {
      const nextDay = addDays(new Date(session.date), 1);
      setStartDate(format(nextDay, 'yyyy-MM-dd'));
    }
  }, [session]);

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

  // Calculer les dates selon le mode sélectionné
  const calculateDates = () => {
    if (duplicateMode === 'custom') {
      return selectedDates;
    }

    if (!startDate || !endDate) {
      alert('Veuillez sélectionner une date de début et une date de fin');
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('La date de début doit être antérieure à la date de fin');
      return null;
    }

    let dates = [];

    if (duplicateMode === 'daily') {
      // Tous les jours entre start et end
      dates = eachDayOfInterval({ start, end }).map(date => format(date, 'yyyy-MM-dd'));
    } else if (duplicateMode === 'weekend') {
      // Seulement les week-ends (samedi et dimanche)
      const allDays = eachDayOfInterval({ start, end });
      dates = allDays
        .filter(date => {
          const day = date.getDay();
          return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
        })
        .map(date => format(date, 'yyyy-MM-dd'));
    }

    // Exclure la date de la session originale
    const sessionDateString = format(new Date(session.date), 'yyyy-MM-dd');
    dates = dates.filter(d => d !== sessionDateString);

    return dates;
  };

  const handleValidate = () => {
    const dates = calculateDates();

    if (!dates || dates.length === 0) {
      alert('Aucune date sélectionnée');
      return;
    }

    setCalculatedDates(dates);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    onConfirm(calculatedDates);
  };

  const handleBackToEdit = () => {
    setShowConfirmation(false);
  };

  // Modal de confirmation
  if (showConfirmation) {
    return (
      <div className={styles.overlay} onClick={onCancel}>
        <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.confirmationIcon}>📋</div>
          <h2>Confirmation de duplication</h2>

          <div className={styles.confirmationMessage}>
            <p className={styles.sessionCount}>
              <strong>{calculatedDates.length}</strong> session(s) vont être créée(s)
            </p>
            <p className={styles.confirmationDetail}>
              Les sessions seront créées avec les mêmes paramètres que la session originale.
            </p>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnCancel} onClick={handleBackToEdit}>
              Modifier
            </button>
            <button className={styles.btnConfirm} onClick={handleConfirm}>
              Confirmer la création
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal principal
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

        <p className={styles.instruction}>Choisissez le mode de duplication :</p>

        {/* Options de duplication */}
        <div className={styles.modeSelection}>
          <label className={`${styles.modeOption} ${duplicateMode === 'daily' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="duplicateMode"
              value="daily"
              checked={duplicateMode === 'daily'}
              onChange={(e) => setDuplicateMode(e.target.value)}
            />
            <div className={styles.modeContent}>
              <strong>Tous les jours</strong>
              <span>Créer une session chaque jour entre deux dates</span>
            </div>
          </label>

          <label className={`${styles.modeOption} ${duplicateMode === 'weekend' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="duplicateMode"
              value="weekend"
              checked={duplicateMode === 'weekend'}
              onChange={(e) => setDuplicateMode(e.target.value)}
            />
            <div className={styles.modeContent}>
              <strong>Les week-ends</strong>
              <span>Créer une session uniquement les samedis et dimanches</span>
            </div>
          </label>

          <label className={`${styles.modeOption} ${duplicateMode === 'custom' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="duplicateMode"
              value="custom"
              checked={duplicateMode === 'custom'}
              onChange={(e) => setDuplicateMode(e.target.value)}
            />
            <div className={styles.modeContent}>
              <strong>Dates personnalisées</strong>
              <span>Sélectionner manuellement les dates dans un calendrier</span>
            </div>
          </label>
        </div>

        {/* Contenu selon le mode */}
        {(duplicateMode === 'daily' || duplicateMode === 'weekend') && (
          <div className={styles.dateRange}>
            <div className={styles.dateInput}>
              <label>Date de début :</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.dateInput}>
              <label>Date de fin :</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {duplicateMode === 'custom' && (
          <>
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
          </>
        )}

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Annuler
          </button>
          <button
            className={styles.btnConfirm}
            onClick={handleValidate}
            disabled={
              (duplicateMode === 'custom' && selectedDates.length === 0) ||
              ((duplicateMode === 'daily' || duplicateMode === 'weekend') && (!startDate || !endDate))
            }
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDuplicateDialog;
