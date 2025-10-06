import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import styles from './BookingBadge.module.css';

const BookingBadge = ({ booking, index }) => {
  const { numberOfPeople, clientFirstName, clientLastName, status, totalPrice, amountPaid, payments = [] } = booking;

  // Déterminer la couleur du badge selon le statut de paiement
  const getBookingColor = () => {
    if (status === 'cancelled') return '#94a3b8'; // Gris

    const paidPercentage = (amountPaid / totalPrice) * 100;

    if (paidPercentage >= 100) return '#10b981'; // Vert - Payé
    if (paidPercentage > 0) return '#f59e0b'; // Orange - Partiel
    return '#ef4444'; // Rouge - Non payé
  };

  // Icônes selon le statut
  const getIcon = () => {
    if (status === 'cancelled') return '✕';

    const paidPercentage = (amountPaid / totalPrice) * 100;

    if (paidPercentage >= 100) return '✓';
    if (paidPercentage > 0) return '◐';
    return '○';
  };

  // Format du nom
  const displayName = `${clientFirstName} ${clientLastName.charAt(0)}.`;

  return (
    <Draggable draggableId={booking.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.bookingBadge} ${snapshot.isDragging ? styles.dragging : ''}`}
          style={{
            ...provided.draggableProps.style,
            backgroundColor: getBookingColor(),
          }}
          title={`${displayName} - ${numberOfPeople} pers. - ${amountPaid}€ / ${totalPrice}€`}
        >
          <span className={styles.numberOfPeople}>{numberOfPeople}</span>
          <span className={styles.icon}>{getIcon()}</span>
          <span className={styles.clientName}>{displayName}</span>
        </div>
      )}
    </Draggable>
  );
};

export default BookingBadge;
