import { useState, useEffect } from 'react';
import styles from './DateRangePicker.module.css';
import { useTranslation } from 'react-i18next';

const DateRangePicker = ({ onDateChange, initialStartDate, initialEndDate, hideRangeMode = false, dateAvailability = {} }) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState('single'); // 'single' ou 'range' - par défaut 'single'
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

  const handleModeChange = (mode) => {
    // Réinitialiser la sélection quand on change de mode
    setSelectionMode(mode);
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
    onDateChange(null, null);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ne pas permettre de sélectionner des dates passées
    if (clickedDate < today) return;

    if (selectionMode === 'single') {
      // Mode date unique - un seul clic suffit
      if (startDate && clickedDate.getTime() === startDate.getTime()) {
        // Si on reclique sur la même date, réinitialiser
        setStartDate(null);
        onDateChange(null, null);
      } else {
        setStartDate(clickedDate);
        setEndDate(null);
        onDateChange(formatDateISO(clickedDate), null);
      }
    } else if (selectionMode === 'range') {
      // Mode période
      if (!startDate || (startDate && endDate)) {
        // Premier clic ou recommencer une nouvelle période
        setStartDate(clickedDate);
        setEndDate(null);
      } else {
        // Deuxième clic - finaliser la période
        if (clickedDate < startDate) {
          // Si la date cliquée est avant la première, on inverse
          setEndDate(startDate);
          setStartDate(clickedDate);
          onDateChange(formatDateISO(clickedDate), formatDateISO(startDate));
        } else {
          setEndDate(clickedDate);
          onDateChange(formatDateISO(startDate), formatDateISO(clickedDate));
        }
      }
    }
  };

  const isDateInRange = (day) => {
    if (!startDate) return false;

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (selectionMode === 'range' && !endDate && hoverDate) {
      // Mode période en cours de sélection avec survol
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

  const getDateAvailabilityStyle = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = formatDateISO(date);
    const status = dateAvailability[dateKey];

    if (!status) return {};

    if (status === 'available') {
      return { backgroundColor: 'rgba(40, 167, 69, 0.2)', border: '2px solid #28a745' };
    } else if (status === 'otherProduct') {
      return { backgroundColor: 'rgba(255, 193, 7, 0.2)', border: '2px solid #ffc107' };
    } else if (status === 'full' || status === 'closed') {
      return { backgroundColor: 'rgba(220, 53, 69, 0.2)', border: '2px solid #dc3545' };
    }

    return {};
  };

  return (
    <div className={styles.dateRangePicker}>
      {/* Sélection du mode */}
      {!hideRangeMode && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => handleModeChange('single')}
            style={{
              padding: '0.5rem 1rem',
              border: selectionMode === 'single' ? '2px solid #3498db' : '2px solid #dee2e6',
              background: selectionMode === 'single' ? '#3498db' : 'white',
              color: selectionMode === 'single' ? 'white' : '#495057',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: selectionMode === 'single' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            📅 Date unique
          </button>
          <button
            onClick={() => handleModeChange('range')}
            style={{
              padding: '0.5rem 1rem',
              border: selectionMode === 'range' ? '2px solid #3498db' : '2px solid #dee2e6',
              background: selectionMode === 'range' ? '#3498db' : 'white',
              color: selectionMode === 'range' ? 'white' : '#495057',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: selectionMode === 'range' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            📆 Période
          </button>
        </div>
      )}

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
              style={getDateAvailabilityStyle(day)}
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
      </div>
    </div>
  );
};

export default DateRangePicker;
