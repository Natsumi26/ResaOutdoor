import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './SessionDeleteDialog.module.css';

const SessionDeleteDialog = ({ sessions, onConfirm, onCancel }) => {
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [sessionWithBookings, setSessionWithBookings] = useState(null);
  const [bookingAction, setBookingAction] = useState(null); // 'delete' ou 'move'
  const [alternativeSessions, setAlternativeSessions] = useState([]);
  const [selectedTargetSession, setSelectedTargetSession] = useState(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  const toggleSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    const hasBookings = session.bookings && session.bookings.length > 0;

    // Si la session a des réservations, ouvrir le modal de choix
    if (hasBookings) {
      setSessionWithBookings(session);
      setBookingAction(null);
      setSelectedTargetSession(null);
      setAlternativeSessions([]);
      return;
    }

    // Sinon, toggle normalement
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  // Récupérer les sessions alternatives
  const fetchAlternativeSessions = async (sessionId) => {
    setLoadingAlternatives(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sessions/${sessionId}/alternatives`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setAlternativeSessions(data.alternativeSessions || []);
      } else {
        console.error('Erreur lors de la récupération des sessions alternatives');
        setAlternativeSessions([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setAlternativeSessions([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Lorsqu'on choisit "move", charger les alternatives
  useEffect(() => {
    if (bookingAction === 'move' && sessionWithBookings) {
      fetchAlternativeSessions(sessionWithBookings.id);
    }
  }, [bookingAction, sessionWithBookings]);

  const handleConfirmBookingAction = () => {
    if (!sessionWithBookings) return;

    if (bookingAction === 'delete') {
      // Supprimer la session avec toutes ses réservations
      onConfirm([{
        ...sessionWithBookings,
        action: 'delete'
      }]);
    } else if (bookingAction === 'move' && selectedTargetSession) {
      // Déplacer les réservations vers la session cible
      onConfirm([{
        ...sessionWithBookings,
        action: 'move',
        targetSessionId: selectedTargetSession
      }]);
    }

    // Réinitialiser
    setSessionWithBookings(null);
    setBookingAction(null);
    setSelectedTargetSession(null);
    setAlternativeSessions([]);
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

  // Modal pour choisir l'action sur les réservations
  if (sessionWithBookings) {
    return (
      <div className={styles.overlay} onClick={() => setSessionWithBookings(null)}>
        <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
          <h2>⚠️ Session avec réservations</h2>

          <div className={styles.bookingInfo}>
            <p className={styles.instruction}>
              Cette session contient <strong>{sessionWithBookings.bookings.length} réservation(s)</strong>.
            </p>
            <p className={styles.instruction}>
              Que souhaitez-vous faire avec les réservations ?
            </p>
          </div>

          <div className={styles.bookingsDetails}>
            {sessionWithBookings.bookings.map(booking => (
              <div key={booking.id} className={styles.bookingCard}>
                <div className={styles.bookingName}>
                  👤 {booking.clientFirstName} {booking.clientLastName}
                </div>
                <div className={styles.bookingDetail}>
                  📧 {booking.clientEmail}
                </div>
                <div className={styles.products}>
                  <span
                    className={styles.productTag}
                    style={{ borderColor: booking.product.color }}
                  >
                    {booking.product.name}
                  </span>
                </div>
                <div className={styles.bookingDetail}>
                  👥 {booking.numberOfPeople} personne(s)
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actionChoice}>
            <button
              className={`${styles.actionBtn} ${bookingAction === 'move' ? styles.active : ''}`}
              onClick={() => setBookingAction('move')}
            >
              📦 Déplacer vers une autre session
            </button>
            <button
              className={`${styles.actionBtn} ${styles.dangerBtn} ${bookingAction === 'delete' ? styles.active : ''}`}
              onClick={() => setBookingAction('delete')}
            >
              🗑️ Supprimer les réservations
            </button>
          </div>

          {bookingAction === 'move' && (
            <div className={styles.targetSessionSelection}>
              <h3>Sélectionnez une session de destination</h3>

              {loadingAlternatives && (
                <p className={styles.loading}>⏳ Chargement des sessions disponibles...</p>
              )}

              {!loadingAlternatives && alternativeSessions.length === 0 && (
                <p className={styles.noAlternatives}>
                  ℹ️ Aucune session compatible trouvée. Créez d'abord une nouvelle session ou supprimez les réservations.
                </p>
              )}

              {!loadingAlternatives && alternativeSessions.length > 0 && (
                <div className={styles.alternativesList}>
                  {alternativeSessions.map(session => (
                    <div
                      key={session.id}
                      className={`${styles.alternativeSession} ${selectedTargetSession === session.id ? styles.selectedTarget : ''}`}
                      onClick={() => setSelectedTargetSession(session.id)}
                    >
                      <div className={styles.altSessionHeader}>
                        <span className={styles.altDate}>
                          📅 {format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                        </span>
                        <span className={styles.altTime}>
                          ⏰ {session.timeSlot} - {session.startTime}
                        </span>
                      </div>

                      {session.bookings && session.bookings.length > 0 ? (
                        <div className={styles.altProducts}>
                          <span
                            className={styles.altProductTag}
                            style={{ borderColor: session.bookings[0].product.color }}
                          >
                            {session.bookings[0].product.name}
                          </span>
                      </div>
                      ) : (
                        <div className={styles.altProducts}>
                        {session.products.map(sp => (
                          <span
                            key={sp.product.id}
                            className={styles.altProductTag}
                            style={{ borderColor: sp.product.color }}
                          >
                            {sp.product.name}
                          </span>
                        ))}
                      </div>
                      )}
                      
                      {session.compatibilityInfo && !session.compatibilityInfo.allProductsCompatible && (
                        <div className={styles.compatibilityWarning}>
                          ⚠️ Certains produits ne sont pas disponibles dans cette session
                        </div>
                      )}
                      <div className={styles.altBookingsCount}>
                        {session.bookings.length} réservation(s) actuelles
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bookingAction === 'delete' && (
            <div className={styles.deleteWarning}>
              <p>⚠️ <strong>Attention :</strong> Cette action est irréversible. Toutes les réservations seront définitivement supprimées.</p>
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.btnCancel} onClick={() => setSessionWithBookings(null)}>
              Annuler
            </button>
            <button
              className={styles.btnConfirm}
              onClick={handleConfirmBookingAction}
              disabled={!bookingAction || (bookingAction === 'move' && !selectedTargetSession)}
            >
              {bookingAction === 'delete' ? 'Supprimer tout' : 'Déplacer et supprimer la session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal principal de sélection de sessions
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2>🗑️ Supprimer des sessions</h2>

        <p className={styles.instruction}>
          Sélectionnez les sessions à supprimer. Pour les sessions avec réservations, vous pourrez choisir de déplacer ou supprimer les réservations.
        </p>

        <div className={styles.bulkActions}>
          <button className={styles.bulkBtn} onClick={selectAll}>
            ✓ Tout sélectionner (sans réservations)
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
                    className={`${styles.sessionItem} ${isSelected ? styles.selected : ''} ${hasBookings ? styles.hasBookings : ''}`}
                    onClick={() => toggleSession(session.id)}
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

                      {hasBookings ? (
                        <div className={styles.products}>
                          <span
                            key={session.bookings[0].id}
                            className={styles.productTag}
                            style={{ borderColor: session.bookings[0].product.color }}
                          >
                            {session.bookings[0].product.name}
                          </span>
                      </div>
                      ):(
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
                      )}
                      

                      {hasBookings && (
                        <div className={styles.bookingsInfo}>
                          ⚠️ {session.bookings.length} réservation(s) - Cliquez pour gérer
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
