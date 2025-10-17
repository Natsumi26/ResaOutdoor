import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

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
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!booking) {
    return (
      <div className={styles.clientContainer}>
        <div className={styles.error}>Réservation introuvable</div>
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
          <h1>Réservation confirmée !</h1>
          <p className={styles.confirmationSubtitle}>
            {isPaid
              ? 'Votre paiement a été enregistré avec succès'
              : 'Votre réservation a été enregistrée'
            }
          </p>
        </div>

        {/* Détails de la réservation */}
        <div className={styles.confirmationCard}>
          <div className={styles.confirmationSection}>
            <h2>Détails de votre réservation</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Numéro de réservation</span>
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
                <span className={styles.detailLabel}>Horaire</span>
                <strong>{booking.session.timeSlot} - {booking.session.startTime}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nombre de personnes</span>
                <strong>{booking.numberOfPeople} personne{booking.numberOfPeople > 1 ? 's' : ''}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Prix total</span>
                <strong>{booking.totalPrice}€</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Montant payé</span>
                <strong className={isPaid ? styles.paidAmount : styles.partialAmount}>
                  {booking.amountPaid}€
                  {!isPaid && ` (Reste ${booking.totalPrice - booking.amountPaid}€)`}
                </strong>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.confirmationSection}>
            <h3>Vos informations</h3>
            <div className={styles.clientInfo}>
              <p><strong>Nom :</strong> {booking.clientFirstName} {booking.clientLastName}</p>
              <p><strong>Email :</strong> {booking.clientEmail}</p>
              <p><strong>Téléphone :</strong> {booking.clientPhone}</p>
              <p><strong>Nationalité : </strong>
                <img
                  src={`https://flagcdn.com/16x12/${booking.clientNationality.toLowerCase()}.png`}
                  alt={booking.clientNationality}
                />
              </p>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className={styles.confirmationSection}>
            <h3>Prochaines étapes</h3>
            <div className={styles.nextSteps}>
              <div className={styles.step}>
                <span className={styles.stepIcon}>📧</span>
                <div>
                  <strong>Confirmation par email</strong>
                  <p>Un email de confirmation vous a été envoyé à {booking.clientEmail}</p>
                </div>
              </div>

              {!isPaid && (
                <div className={styles.step}>
                  <span className={styles.stepIcon}>💳</span>
                  <div>
                    <strong>Paiement du solde</strong>
                    <p>Vous pouvez payer le solde restant ({booking.totalPrice - booking.amountPaid}€) depuis votre page de réservation</p>
                  </div>
                </div>
              )}

              <div className={styles.step}>
                <span className={styles.stepIcon}>👕</span>
                <div>
                  <strong>Informations participants</strong>
                  <p>Remplissez les informations de taille, poids et pointure pour la préparation du matériel (Si pas déjà rempli)</p>
                </div>
              </div>

              {booking.product.postBookingMessage && (
                <div className={styles.step}>
                  <span className={styles.stepIcon}>ℹ️</span>
                  <div>
                    <strong>Message du guide</strong>
                    <p>{booking.product.postBookingMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liens utiles */}
          {booking.product.wazeLink || booking.product.googleMapsLink && (
            <div className={styles.confirmationSection}>
              <h3>Lieu de rendez-vous</h3>
              <div className={styles.locationLinks}>
                {booking.product.wazeLink && (
                  <a
                    href={booking.product.wazeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkBtn}
                  >
                    🗺️ Ouvrir dans Waze
                  </a>
                )}
                {booking.product.googleMapsLink && (
                  <a
                    href={booking.product.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkBtn}
                  >
                    📍 Ouvrir dans Google Maps
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
              Gérer ma réservation
            </Link>
            <Link
              to="/client/search"
              className={styles.btnSecondary}
            >
              Réserver une autre activité
            </Link>
          </div>
        </div>

        {/* Note importante */}
        <div className={styles.importantNote}>
          <h4>⚠️ Important</h4>
          <p>Conservez votre numéro de réservation : <strong>{booking.id.slice(0, 8).toUpperCase()}</strong></p>
          <p>Vous pouvez accéder à votre réservation à tout moment en cliquant sur le lien envoyé par email ou en utilisant le numéro de réservation.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
