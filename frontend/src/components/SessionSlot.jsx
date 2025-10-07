import { Droppable } from 'react-beautiful-dnd';
import styles from './SessionSlot.module.css';
import BookingBadge from './BookingBadge';

const SessionSlot = ({ session, onClick, onBookingClick, onCreateBooking }) => {
  const { bookings = [], product, startTime } = session;

  // Calculer le taux de remplissage
  const totalPeople = bookings.reduce((sum, booking) =>
    booking.status !== 'cancelled' ? sum + booking.numberOfPeople : sum, 0
  );
  const maxCapacity = product?.maxCapacity || 12;
  const fillPercentage = (totalPeople / maxCapacity) * 100;

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

  return (
    <Droppable droppableId={`session-${session.id}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${styles.sessionSlot} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
          onClick={onClick}
          style={{ borderLeftColor: getProductColor() }}
        >
          {/* En-tête de la session */}
          <div className={styles.sessionHeader}>
            <div className={styles.sessionTime}>{startTime}</div>
            <div className={styles.sessionName}>
              {product?.name || 'Session'}
            </div>
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

          {/* Badges de réservations */}
          <div className={styles.bookingsContainer}>
            {bookings.map((booking, index) => (
              <BookingBadge
                key={booking.id}
                booking={booking}
                index={index}
                onClick={onBookingClick}
              />
            ))}
          </div>

          {/* Bouton Réserver */}
          {onCreateBooking && (
            <button
              className={styles.reserveBtn}
              onClick={(e) => {
                e.stopPropagation();
                onCreateBooking(session);
              }}
            >
              + Réserver
            </button>
          )}

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default SessionSlot;
