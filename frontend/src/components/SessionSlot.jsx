import { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styles from './SessionSlot.module.css';
import BookingBadge from './BookingBadge';
import { productsAPI } from '../services/api';

const SessionSlot = ({ session, onClick, onBookingClick, onCreateBooking, filters = { reservations: true, paiements: false, stocks: false } }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { bookings = [], product, startTime } = session;
  // Calculer le taux de remplissage
  const getMaxCapacity = () => {
    if (session.products?.length === 1) {
      return session.products[0]?.product?.maxCapacity || 10;
    }
    if (bookings?.length > 0) {
      return bookings[0]?.product?.maxCapacity || 10;
    }
    return 12;
  };

  const maxCapacity = getMaxCapacity();
  const totalPeople = bookings.reduce((sum, booking) =>
    booking.status !== 'cancelled' ? sum + (booking.numberOfPeople || 0) : sum, 0
  );
  // Séparer les réservations confirmées et incomplètes
  const confirmedPeople = bookings.reduce((sum, b) =>
    b.status !== 'cancelled' && b.amountPaid >= b.totalPrice
      ? sum + (b.numberOfPeople || 0)
      : sum, 0
  );

  const incompletePeople = bookings.reduce((sum, b) =>
    b.status !== 'cancelled' && b.amountPaid < b.totalPrice
      ? sum + (b.numberOfPeople || 0)
      : sum, 0
  );

  const confirmedPercentage = (confirmedPeople / maxCapacity) * 100;
  const incompletePercentage = (incompletePeople / maxCapacity) * 100;
  console.log(confirmedPercentage)
  console.log(incompletePercentage)
  const remainingCapacity = maxCapacity - totalPeople;

  // Calculer les statistiques de paiements
  const bookingsWithPaymentIssues = bookings.filter(b => {
    if (b.status === 'cancelled') return false;
    return b.amountPaid < b.totalPrice;
  });

  // Déterminer la couleur de la barre latérale selon le produit
  const getProductColor = () => {
      // Si la session contient un seul produit avec une couleur définie
      if (session.products?.length === 1 && session.products[0]?.product?.color) {
        return session.products[0].product.color;
      }
      // Cas 2 : au moins une réservation avec un produit
      if (bookings?.length > 0 && bookings[0]?.product?.color) {
        return bookings[0].product.color;
      }
        // Couleur par défaut
        return '#94a3b8';
  };

console.log('Session', session, "products:", session.products.map(p=>p.product.color));

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
          {session.products?.length === 1
            ? session.products[0]?.product?.name
            : bookings?.length > 0
              ? bookings[0]?.product?.name || 'Session'
              : 'Session'}
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
            width: `${confirmedPercentage}%`,
            backgroundColor: '#10b981' // vert
          }}
        />
        <div
          className={styles.progressFill}
          style={{
            width: `${incompletePercentage}%`,
            backgroundColor: '#f59e0b' // orange
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
