import { useState, useEffect } from 'react';
import styles from './DateRangePicker.module.css';
import { useTranslation } from 'react-i18next';

const DateRangePicker = ({ onDateChange, initialStartDate, initialEndDate }) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState(null); // 'single' ou 'range'
  const [startDate, setStartDate] = useState(initialStartDate ? new Date(initialStartDate) : null);
  const [endDate, setEndDate] = useState(initialEndDate ? new Date(initialEndDate) : null);
  const [hoverDate, setHoverDate] = useState(null);

  const months = t('months', { returnObjects: true });
  const daysOfWeek = t('days', { returnObjects: true });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ne pas permettre de sélectionner des dates passées
    if (clickedDate < today) return;

    if (!selectionMode) {
      // Premier clic - on démarre une sélection
      setStartDate(clickedDate);
      setEndDate(null);
      setSelectionMode('pending');
    } else if (selectionMode === 'pending') {
      // Deuxième clic
      if (clickedDate < startDate) {
        // Si la date cliquée est avant la première, on inverse
        setEndDate(startDate);
        setStartDate(clickedDate);
      } else if (clickedDate.getTime() === startDate.getTime()) {
        // Si on clique sur la même date, c'est une date unique
        setEndDate(null);
        setSelectionMode('single');
      } else {
        // Sinon c'est une période
        setEndDate(clickedDate);
        setSelectionMode('range');
      }
    } else {
      // On recommence une nouvelle sélection
      setStartDate(clickedDate);
      setEndDate(null);
      setSelectionMode('pending');
    }
  };

  const isDateInRange = (day) => {
    if (!startDate) return false;

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (selectionMode === 'pending' && hoverDate) {
      const rangeStart = startDate < hoverDate ? startDate : hoverDate;
      const rangeEnd = startDate < hoverDate ? hoverDate : startDate;
      return date >= rangeStart && date <= rangeEnd;
    }

    if (selectionMode === 'range' && endDate) {
      return date >= startDate && date <= endDate;
    }

    return false;
  };

  const isDateSelected = (day) => {
    if (!startDate) return false;

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (selectionMode === 'single') {
      return date.getTime() === startDate.getTime();
    }

    if (startDate && date.getTime() === startDate.getTime()) return true;
    if (endDate && date.getTime() === endDate.getTime()) return true;

    return false;
  };

  const isDatePast = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateHover = (day) => {
    if (selectionMode === 'pending') {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setHoverDate(date);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR');
  };

  const formatDateISO = (date) => {
    if (!date) return '';
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0); // milieu de journée pour éviter les décalages UTC
    return localDate.toISOString().split('T')[0];
  };


  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectionMode(null);
    setHoverDate(null);
    onDateChange(null, null);
  };

  const handleValidate = () => {
    if (selectionMode === 'single' && startDate) {
      onDateChange(formatDateISO(startDate), null);
    } else if (selectionMode === 'range' && startDate && endDate) {
      onDateChange(formatDateISO(startDate), formatDateISO(endDate));
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={styles.dateRangePicker}>
      <div className={styles.calendarHeader}>
        <button onClick={handlePrevMonth} className={styles.navButton}>
          ←
        </button>
        <h3>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button onClick={handleNextMonth} className={styles.navButton}>
          →
        </button>
      </div>

      <div className={styles.calendar}>
        <div className={styles.daysOfWeek}>
          {daysOfWeek.map(day => (
            <div key={day} className={styles.dayOfWeek}>{day}</div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.emptyDay}></div>
          ))}

          {days.map(day => (
            <div
              key={day}
              className={`${styles.day} ${
                isDatePast(day) ? styles.pastDay : ''
              } ${
                isDateSelected(day) ? styles.selectedDay : ''
              } ${
                isDateInRange(day) ? styles.inRange : ''
              }`}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => handleDateHover(day)}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.selectionInfo}>
        {startDate && (
          <div className={styles.selectedDates}>
            {selectionMode === 'single' ? (
              <p><strong>{t('SelectedDate')}</strong> {formatDate(startDate)}</p>
            ) : selectionMode === 'range' && endDate ? (
              <p><strong>{t('SelectedPeriode')}</strong> {formatDate(startDate)} - {formatDate(endDate)}</p>
            ) : selectionMode === 'pending' ? (
              <p><strong>{t('Debut')}</strong> {formatDate(startDate)} <em>({t('DoubleClick')})</em></p>
            ) : null}
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={handleReset} className={styles.btnReset}>
            {t('Réinitialiser')}
          </button>
          {((selectionMode === 'single' && startDate) || (selectionMode === 'range' && startDate && endDate)) && (
            <button onClick={handleValidate} className={styles.btnValidate}>
              {t('Valider')}
            </button>
          )}
        </div>
      </div>

      <div className={styles.hint}>
        <p>{t('ClickDate')}</p>
      </div>
    </div>
  );
};

export default DateRangePicker;
