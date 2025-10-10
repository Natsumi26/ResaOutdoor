import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './SessionDeleteDialog.module.css';

const SessionDeleteDialog = ({ sessions, onConfirm, onCancel }) => {
  const [selectedSessions, setSelectedSessions] = useState([]);

  const toggleSession = (sessionId) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const handleConfirm = () => {
    const sessionsToDelete = sessions.filter(s => selectedSessions.includes(s.id));
    onConfirm(sessionsToDelete);
  };

  const selectAll = () => {
    // Sélectionner toutes les sessions sans réservations
    const availableSessions = sessions.filter(s => !s.bookings || s.bookings.length === 0);
    setSelectedSessions(availableSessions.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSessions([]);
  };

  // Organiser les sessions par date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {});

  // Trier les dates
  const sortedDates = Object.keys(sessionsByDate).sort();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2>🗑️ Supprimer des sessions</h2>

        <p className={styles.instruction}>
          Sélectionnez les sessions à supprimer. Les sessions contenant des réservations ne peuvent pas être supprimées.
        </p>

        <div className={styles.bulkActions}>
          <button className={styles.bulkBtn} onClick={selectAll}>
            ✓ Tout sélectionner
          </button>
          <button className={styles.bulkBtn} onClick={deselectAll}>
            ✗ Tout désélectionner
          </button>
        </div>

        <div className={styles.sessionsList}>
          {sortedDates.map(dateKey => (
            <div key={dateKey} className={styles.dateGroup}>
              <h3 className={styles.dateHeader}>
                {format(new Date(dateKey), 'EEEE dd MMMM yyyy', { locale: fr })}
              </h3>

              {sessionsByDate[dateKey].map(session => {
                const hasBookings = session.bookings && session.bookings.length > 0;
                const isSelected = selectedSessions.includes(session.id);

                return (
                  <div
                    key={session.id}
                    className={`${styles.sessionItem} ${isSelected ? styles.selected : ''} ${hasBookings ? styles.disabled : ''}`}
                    onClick={() => !hasBookings && toggleSession(session.id)}
                  >
                    <div className={styles.sessionCheckbox}>
                      {!hasBookings && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSession(session.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {hasBookings && <span className={styles.lockIcon}>🔒</span>}
                    </div>

                    <div className={styles.sessionDetails}>
                      <div className={styles.sessionHeader}>
                        <span className={styles.timeSlot}>
                          {session.timeSlot === 'matin' ? '🌅' : '☀️'} {session.timeSlot} - {session.startTime}
                        </span>
                        {session.isMagicRotation && (
                          <span className={styles.magicBadge}>🎲 Rotation</span>
                        )}
                      </div>

                      <div className={styles.products}>
                        {session.products.map(sp => (
                          <span
                            key={sp.product.id}
                            className={styles.productTag}
                            style={{ borderColor: sp.product.color }}
                          >
                            {sp.product.name}
                          </span>
                        ))}
                      </div>

                      {hasBookings && (
                        <div className={styles.bookingsWarning}>
                          ⚠️ {session.bookings.length} réservation(s) - Suppression impossible
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {sessions.length === 0 && (
            <p className={styles.emptyState}>Aucune session disponible.</p>
          )}
        </div>

        <div className={styles.selectedInfo}>
          {selectedSessions.length} session(s) sélectionnée(s)
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Annuler
          </button>
          <button
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={selectedSessions.length === 0}
          >
            Supprimer {selectedSessions.length} session(s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDeleteDialog;
