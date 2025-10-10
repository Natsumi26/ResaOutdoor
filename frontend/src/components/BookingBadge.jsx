import { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import styles from './BookingBadge.module.css';

const BookingBadge = ({ booking, index, onClick, isVisible = true }) => {
  const { numberOfPeople, clientFirstName, clientLastName, status, totalPrice, amountPaid } = booking;
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024); // Désactiver tooltip sur mobile et tablette
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // gestion nationalité - convertir code pays en émoji drapeau
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <Draggable draggableId={booking.id} index={index}>
      {(provided, snapshot) => (
        <div className={styles.bookingBadgeWrapper}>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${styles.bookingBadge} ${snapshot.isDragging ? styles.dragging : ''}`}
            style={{
              ...provided.draggableProps.style,
              backgroundColor: getBookingColor(),
              opacity: isVisible ? 1 : 0,
              pointerEvents: isVisible ? 'auto' : 'none',
            }}
            onMouseEnter={() => !snapshot.isDragging && !isMobile && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (!snapshot.isDragging) {
                console.log("Badge cliqué :", booking.id);
                onClick?.(booking.id);
              }
            }}
          >
            <span className={styles.numberOfPeople}>{numberOfPeople}</span>
            {booking.clientNationality && (
              <img
                src={`https://flagcdn.com/16x12/${booking.clientNationality.toLowerCase()}.png`}
                alt={booking.clientNationality}
                className={styles.flagIcon}
                onError={(e) => {
                  // Si l'image ne charge pas, afficher le code pays
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
            )}
            {booking.clientNationality && (
              <span className={styles.countryCodeFallback} style={{display: 'none'}}>
                {booking.clientNationality.toUpperCase()}
              </span>
            )}
          </div>

          {/* Tooltip personnalisé */}
          {showTooltip && !snapshot.isDragging && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipContent}>
                <div className={styles.tooltipMainRow}>
                  <div>
                    <span className={styles.tooltipParticipants}>{numberOfPeople}</span>
                  </div>
                  <span className={styles.tooltipClientName}>
                    {clientLastName} <br />
                    {getFlagEmoji(booking.clientNationality)}  {booking.clientPhone}
                  </span>
                </div>
                
                <div className={styles.tooltipPayment}>
                  <span className={styles.tooltipPaid}>Encaissé : <br />{amountPaid}€</span>
                  <span className={styles.tooltipRemaining}>
                    Reste: <br /> {(totalPrice - amountPaid).toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default BookingBadge;
