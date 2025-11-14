import { Droppable } from 'react-beautiful-dnd';
import styles from './SessionSlot.module.css';
import BookingBadge from './BookingBadge';

const SessionSlot = ({ session, onClick, onBookingClick, onCreateBooking, filters = { reservations: true, paiements: false, stocks: false } }) => {
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

  // Calculer le pourcentage de remplissage
  const fillPercentage = (totalPeople / maxCapacity) * 100;
  const emptyPercentage = 100 - fillPercentage;

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
    return 'var(--guide-primary)';
  };

  const handleSessionClick = (e) => {
    // Ne pas déclencher si on clique sur un badge ou le bouton +
    if (e.target.closest('[draggable="true"]') || e.target.closest('button')) {
      return;
    }
    onClick?.(session);
  };

  return (
    <div className={styles.sessionRow} onClick={handleSessionClick}>
      {/* Informations à gauche avec liseré coloré */}
      <div className={styles.sessionInfoLeft} style={{ borderLeftColor: getProductColor() }}>
        <div className={styles.sessionTime}>{startTime}</div>
        <div className={styles.sessionName}>{getSessionName()}</div>
        <div className={styles.sessionGuide}>{session.guide?.login || ''}</div>
      </div>

      {/* Barre de progression avec badges proportionnels */}
      <div className={styles.progressContainer}>
        <Droppable droppableId={`session-${session.id}`} type="booking" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${styles.progressBar} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
            >
              {bookings.map((booking, index) => {
                const percentage = ((booking.numberOfPeople || 0) / maxCapacity) * 100;
                return (
                  <div
                    key={booking.id}
                    className={styles.badgeWrapper}
                    style={{ width: `${percentage}%` }}
                  >
                    <BookingBadge
                      booking={booking}
                      index={index}
                      onClick={onBookingClick}
                      isVisible={filters.reservations}
                    />
                  </div>
                );
              })}
              {/* Zone vide hachurée si session fermée et pas complète */}
              {session.status === 'closed' && emptyPercentage > 0 && (
                <div
                  className={styles.closedZone}
                  style={{ width: `${emptyPercentage}%` }}
                />
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {/* Capacité à droite avec bouton + au survol */}
      <div className={styles.sessionCapacityContainer}>
        <div className={styles.sessionCapacity}>
          {totalPeople} <span className={styles.capacitySeparator}>/</span>{maxCapacity}
        </div>
        <button
          className={styles.addBookingButton}
          onClick={(e) => {
            e.stopPropagation();
            onCreateBooking(session);
          }}
          title="Ajouter une réservation"
          style={{ backgroundColor: 'var(--guide-primary)' }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default SessionSlot;
