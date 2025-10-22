import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const BookingConfirmation = () => {
  const { t } = useTranslation();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getById(bookingId);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Erreur chargement réservation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('Chargement')}...</div>;
  }

  if (!booking) {
    return (
      <div className={styles.clientContainer}>
        <div className={styles.error}>{t('noReservation')}</div>
      </div>
    );
  }

  const isPaid = booking.amountPaid >= booking.totalPrice;

  return (
    <div className={styles.clientContainer}>
      <div className={styles.confirmationContainer}>
        {/* En-tête de succès */}
        <div className={styles.confirmationHeader}>
          <div className={styles.successIcon}>✓</div>
          <h1>{t('resaConfirm')}</h1>
          <p className={styles.confirmationSubtitle}>
            {t(isPaid
              ? 'paySaveSuccess'
              : 'bookingSave'
            )}
          </p>
        </div>

        {/* Détails de la réservation */}
        <div className={styles.confirmationCard}>
          <div className={styles.confirmationSection}>
            <h2>{t('detailResa')}</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('numberResa')}</span>
                <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Canyon</span>
                <strong>{booking.product.name}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date</span>
                <strong>
                  {format(new Date(booking.session.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('Horaire')}</span>
                <strong>{booking.session.timeSlot} - {booking.session.startTime}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('nbrPersonne')}</span>
                <strong>{booking.numberOfPeople} personne{booking.numberOfPeople > 1 ? 's' : ''}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('totalPrice')}</span>
                <strong>{booking.totalPrice}€</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('payMontant')}</span>
                <strong className={isPaid ? styles.paidAmount : styles.partialAmount}>
                  {booking.amountPaid}€
                  {!isPaid && ` (${t('Reste', { amount: booking.totalPrice - booking.amountPaid })})`}
                </strong>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.confirmationSection}>
            <h3>{t('yoursInfos')}</h3>
            <div className={styles.clientInfo}>
              <p><strong>{t('Nom')} :</strong> {booking.clientFirstName} {booking.clientLastName}</p>
              <p><strong>Email :</strong> {booking.clientEmail}</p>
              <p><strong>{t('Téléphone')} :</strong> {booking.clientPhone}</p>
              <p><strong>{t('Nationalité')} : </strong>
                <img
                  src={`https://flagcdn.com/16x12/${booking.clientNationality.toLowerCase()}.png`}
                  alt={booking.clientNationality}
                />
              </p>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className={styles.confirmationSection}>
            <h3>{t('nextstep')}</h3>
            <div className={styles.nextSteps}>
              <div className={styles.step}>
                <span className={styles.stepIcon}>📧</span>
                <div>
                  <strong>{t('comfirmParMail')}</strong>
                  <p>{t('MailEnvoi')} {booking.clientEmail}</p>
                </div>
              </div>

              {!isPaid && (
                <div className={styles.step}>
                  <span className={styles.stepIcon}>💳</span>
                  <div>
                    <strong>{t('soldePayment')}</strong>
                    <p>{t('PouvezPay')} ({booking.totalPrice - booking.amountPaid}€) {t('depuisResa')}</p>
                  </div>
                </div>
              )}

              <div className={styles.step}>
                <span className={styles.stepIcon}>👕</span>
                <div>
                  <strong>{t('InfoParts')}</strong>
                  <p>{t('RemplirForm')}</p>
                </div>
              </div>

              {booking.product.postBookingMessage && (
                <div className={styles.step}>
                  <span className={styles.stepIcon}>ℹ️</span>
                  <div>
                    <strong>{t('MessageGuide')}</strong>
                    <p>{booking.product.postBookingMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liens utiles */}
          {booking.product.wazeLink || booking.product.googleMapsLink && (
            <div className={styles.confirmationSection}>
              <h3>{t('LieuRDV')}</h3>
              <div className={styles.locationLinks}>
                {booking.product.wazeLink && (
                  <a
                    href={booking.product.wazeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkBtn}
                  >
                    🗺️ {t('waze')}
                  </a>
                )}
                {booking.product.googleMapsLink && (
                  <a
                    href={booking.product.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkBtn}
                  >
                    📍 {t('maps')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.confirmationActions}>
            <Link
              to={`/client/my-booking/${booking.id}`}
              className={styles.btnPrimary}
            >
              {t('InfosPart')}
            </Link>
            <Link
              to="/client/search"
              className={styles.btnSecondary}
            >
              {t('autreResa')}
            </Link>
          </div>
        </div>

        {/* Note importante */}
        <div className={styles.importantNote}>
          <h4>⚠️ Important</h4>
          <p>{t('saveNbrResa')} : <strong>{booking.id.slice(0, 8).toUpperCase()}</strong></p>
          <p>{t('lienResa')}</p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
