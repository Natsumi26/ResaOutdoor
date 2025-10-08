import { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styles from './SessionSlot.module.css';
import BookingBadge from './BookingBadge';

const SessionSlot = ({ session, onClick, onBookingClick, onCreateBooking, filters = { reservations: true, paiements: false, stocks: false } }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { bookings = [], product, startTime } = session;

  // Calculer le taux de remplissage
  const totalPeople = bookings.reduce((sum, booking) =>
    booking.status !== 'cancelled' ? sum + booking.numberOfPeople : sum, 0
  );
  const maxCapacity = product?.maxCapacity || 12;
  const fillPercentage = (totalPeople / maxCapacity) * 100;
  const remainingCapacity = maxCapacity - totalPeople;

  // Calculer les statistiques de paiements
  const bookingsWithPaymentIssues = bookings.filter(b => {
    if (b.status === 'cancelled') return false;
    return b.amountPaid < b.totalPrice;
  });

  // Déterminer la couleur de la barre latérale selon le produit
  const getProductColor = () => {
    if (!product) return '#94a3b8';

    // Couleurs basées sur le type de produit
    const colorMap = {
      'Raft intégral': '#f97316',
      'Raft découverte': '#ef4444',
      'Zoïcu': '#3b82f6',
      'Zoïcu sportif': '#0ea5e9',
      'Baptême': '#8b5cf6'
    };

    return colorMap[product.name] || '#94a3b8';
  };
console.log('Session', session.id, 'Bookings:', session.bookings.map(b => b.id));

  return (
    <div
      className={`${styles.sessionSlot}`}
      onClick={(e) => {
        // Ne pas déclencher onClick si on clique sur un enfant draggable
        if (e.target === e.currentTarget || !e.target.closest('[data-rbd-draggable-id]')) {
          onClick();
        }
      }}
      style={{ borderLeftColor: getProductColor() }}
    >
      {/* En-tête de la session */}
      <div className={styles.sessionHeader}>
        <div className={styles.sessionTime}>{startTime}</div>
        <div className={styles.sessionName}>
          {product?.name || 'Session'}
        </div>
        {/* Bouton + avec dropdown */}
      {onCreateBooking && (
        <div className={styles.actionButtonContainer}>
          <button
            className={styles.btnPrimary}
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            +
          </button>
          {showDropdown && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(session);
                  setShowDropdown(false);
                }}
              >
                ✏️ Modifier la session
              </button>
              <button
                className={styles.dropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateBooking(session);
                  setShowDropdown(false);
                }}
              >
                📝 Ajouter une réservation
              </button>
            </div>
          )}
        </div>
      )}
        <div className={styles.sessionCapacity}>
          {totalPeople} / {maxCapacity}
        </div>
      </div>

      {/* Barre de progression */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${fillPercentage}%`,
            backgroundColor: fillPercentage >= 100 ? '#ef4444' : fillPercentage >= 80 ? '#f59e0b' : '#10b981'
          }}
        />
      </div>

      {/* Zone droppable pour les réservations - TOUJOURS rendue pour le drag & drop */}
      <Droppable droppableId={`session-${session.id}`} type="booking">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${styles.bookingsContainer} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
          >
            {bookings.map((booking, index) => (
              <BookingBadge
                key={booking.id}
                booking={booking}
                index={index}
                onClick={onBookingClick}
                isVisible={filters.reservations}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

          {/* Indicateur de paiements - visible si filtre Paiements activé */}
          {filters.paiements && bookingsWithPaymentIssues.length > 0 && (
            <div className={styles.paymentWarning}>
              ⚠️ {bookingsWithPaymentIssues.length} réservation{bookingsWithPaymentIssues.length > 1 ? 's' : ''} non payée{bookingsWithPaymentIssues.length > 1 ? 's' : ''}
            </div>
          )}

          {/* Indicateur de capacité restante - visible si filtre Capacité activé */}
          {filters.stocks && (
            <div className={styles.capacityInfo}>
              {remainingCapacity > 0 ? (
                <span className={styles.capacityAvailable}>
                  📊 {remainingCapacity} place{remainingCapacity > 1 ? 's' : ''} disponible{remainingCapacity > 1 ? 's' : ''}
                </span>
              ) : (
                <span className={styles.capacityFull}>
                  🔴 Complet
                </span>
              )}
            </div>
          )}

      
    </div>
  );
};

export default SessionSlot;
