import { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styles from './SessionSlot.module.css';
import BookingBadge from './BookingBadge';

const SessionSlot = ({ session, onClick, onBookingClick, onCreateBooking, onDeleteSession, filters = { reservations: true, paiements: false, stocks: false } }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { bookings = [], startTime } = session;

  // Calculer le taux de remplissage
  const getMaxCapacity = () => {
    if (session.products?.length === 1) {
      return session.products[0]?.product?.maxCapacity || 10;
    }
    if (bookings?.length > 0) {
      return bookings[0]?.product?.maxCapacity || 10;
    }
    return 10;
  };

  const maxCapacity = getMaxCapacity();
  const totalPeople = bookings.reduce((sum, booking) =>
    booking.status !== 'cancelled' ? sum + (booking.numberOfPeople || 0) : sum, 0
  );

  // Nom de la session / du produit
  const getSessionName = () => {
    if (session.products?.length === 1) {
      return session.products[0]?.product?.name;
    }
    if (bookings?.length > 0) {
      return bookings[0]?.product?.name || 'Session';
    }
    return 'Session';
  };

  // Déterminer la couleur du produit
  const getProductColor = () => {
    if (session.products?.length === 1 && session.products[0]?.product?.color) {
      return session.products[0].product.color;
    }
    if (bookings?.length > 0 && bookings[0]?.product?.color) {
      return bookings[0].product.color;
    }
    return '#94a3b8';
  };

  return (
    <div className={styles.sessionSlot}>
      {/* En-tête avec heure et nom */}
      <div className={styles.sessionInfo}>
        <div className={styles.sessionTime}>{startTime}</div>
        <div className={styles.sessionName}>{getSessionName()}</div>
        <div className={styles.sessionGuide}>
          {session.guide?.login || 'Guide'}
        </div>

        {/* Bouton + avec dropdown */}
        {onCreateBooking && (
          <div className={styles.actionButtonContainer}>
            <button
              className={styles.btnAction}
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
                {onDeleteSession && (
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette session ?\n\nSession : ${startTime}\nRéservations : ${bookings.length}`)) {
                        onDeleteSession(session.id);
                        setShowDropdown(false);
                      }
                    }}
                  >
                    🗑️ Supprimer la session
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.sessionCapacity}>
          {totalPeople} <span className={styles.capacitySeparator}>/</span>{maxCapacity}
        </div>
      </div>

      {/* Barre de progression horizontale avec badges */}
      <div className={styles.progressBarContainer}>
        {/* Barre de fond grise */}
        <div
          className={styles.progressBarBackground}
          style={{ borderLeftColor: getProductColor() }}
        >
          {/* Zone droppable pour les réservations */}
          <Droppable droppableId={`session-${session.id}`} type="booking" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`${styles.bookingsZone} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
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
        </div>
      </div>
    </div>
  );
};

export default SessionSlot;
