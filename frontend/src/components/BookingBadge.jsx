import { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import styles from './BookingBadge.module.css';

const BookingBadge = ({ booking, index, onClick, isVisible = true }) => {
  const { numberOfPeople, clientFirstName, clientLastName, status, totalPrice, amountPaid, participantsFormCompleted, clientEmail } = booking;
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

  // Déterminer la couleur du badge selon la complétion du formulaire et l'email
  const getBookingColor = () => {
    if (status === 'cancelled') return '#94a3b8'; // Gris

    // Vert si TOUT est complété (formulaire participants ET email présent)
    if (participantsFormCompleted && clientEmail) {
      return '#72b416'; // Vert
    }

    // Orange sinon
    return '#f59e0b'; // Orange
  };

  // Formater le numéro de téléphone avec indicatif pays et espaces
  const formatPhoneNumber = (phone, countryCode) => {
    if (!phone) return 'N/A';

    // Retirer tous les espaces et caractères spéciaux
    let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    // Indicatifs pays pour FR et EN (UK)
    const countryPrefixes = {
      'FR': '+33',
      'EN': '+44', // Angleterre (UK)
    };

    let prefix = countryPrefixes[countryCode?.toUpperCase()] || '';

    // Si le numéro commence déjà par +, extraire l'indicatif
    if (cleanPhone.startsWith('+')) {
      const match = cleanPhone.match(/^\+(\d{1,3})/);
      if (match) {
        prefix = '+' + match[1];
        cleanPhone = cleanPhone.substring(match[0].length);
      }
    }
    // Si le numéro commence par 00, convertir en +
    else if (cleanPhone.startsWith('00')) {
      const match = cleanPhone.match(/^00(\d{1,3})/);
      if (match) {
        prefix = '+' + match[1];
        cleanPhone = cleanPhone.substring(match[0].length);
      }
    }
    // Si numéro français commence par 0, retirer le 0 initial
    else if (cleanPhone.startsWith('0') && countryCode?.toUpperCase() === 'FR') {
      cleanPhone = cleanPhone.substring(1);
    }

    // Formater avec des espaces tous les 2 chiffres
    const formatted = cleanPhone.match(/.{1,2}/g)?.join(' ') || cleanPhone;

    return prefix ? `${prefix} ${formatted}` : formatted;
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
            {numberOfPeople > 1 && <span className={styles.numberOfPeople}>{numberOfPeople}</span>}
            {booking.clientNationality && (
              <img
                src={`https://flagcdn.com/16x12/${booking.clientNationality === 'EN' ? 'gb' : 'fr'}.png`}
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
              <div className={styles.tooltipHeader} style={{ backgroundColor: getBookingColor() }}>
                <div className={styles.tooltipHeaderTop}>
                  <span className={styles.tooltipNumberBadge}>{numberOfPeople}</span>
                  <span className={styles.tooltipName}>{clientLastName.toUpperCase()}</span>
                </div>
                <div className={styles.tooltipHeaderBottom}>
                  {booking.clientNationality && (
                    <img
                      src={`https://flagcdn.com/16x12/${booking.clientNationality === 'EN' ? 'gb' : booking.clientNationality.toLowerCase()}.png`}
                      alt={booking.clientNationality}
                      className={styles.tooltipFlag}
                    />
                  )}
                  <span className={styles.tooltipPhone}>
                    {formatPhoneNumber(booking.clientPhone, booking.clientNationality)}
                  </span>
                </div>
              </div>
              <div className={styles.tooltipBody}>
                <div className={styles.tooltipPaymentRow}>
                  <div className={styles.tooltipPaymentLeft}>
                    <span className={styles.tooltipPaymentLabel}>ENCAISSÉ :</span>
                    <span className={styles.tooltipPaymentValue} style={{ color: '#22c55e' }}>
                      {amountPaid || 0} €
                    </span>
                  </div>
                  <div className={styles.tooltipPaymentSeparator}></div>
                  <div className={styles.tooltipPaymentRight}>
                    <span className={styles.tooltipPaymentLabel}>RESTE À RÉGLER&nbsp;:</span>
                    <span className={styles.tooltipPaymentValue} style={{ color: (totalPrice - (amountPaid || 0)) > 0 ? '#ef4444' : '#888888' }}>
                      {(totalPrice - (amountPaid || 0))} €
                    </span>
                  </div>
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
