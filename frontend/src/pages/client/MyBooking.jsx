import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookingsAPI, participantsAPI, stripeAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';

const MyBooking = () => {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBooking();
    loadParticipants();
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

  const loadParticipants = async () => {
    try {
      const response = await participantsAPI.getByBooking(bookingId);
      const existingParticipants = response.data.participants || [];

      // S'assurer qu'on a le bon nombre de participants
      if (booking) {
        const needed = booking.numberOfPeople;
        while (existingParticipants.length < needed) {
          existingParticipants.push({
            name: '',
            weight: '',
            height: '',
            shoeSize: ''
          });
        }
      }

      setParticipants(existingParticipants);
    } catch (error) {
      console.error('Erreur chargement participants:', error);
    }
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      [field]: value
    };
    setParticipants(newParticipants);
  };

  const handleSaveParticipants = async () => {
    try {
      setSaving(true);
      await participantsAPI.upsert(bookingId, { participants });
      setEditMode(false);
      alert('Informations des participants enregistrées avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde participants:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePayBalance = async () => {
    if (!booking) return;

    const balance = booking.totalPrice - booking.amountPaid;
    if (balance <= 0) {
      alert('Votre réservation est déjà entièrement payée');
      return;
    }

    try {
      const response = await stripeAPI.createCheckoutSession({
        bookingId: booking.id,
        amount: balance
      });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors de la création de la session de paiement');
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await bookingsAPI.cancel(bookingId);
      alert('Réservation annulée avec succès');
      loadBooking();
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation');
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
  const balance = booking.totalPrice - booking.amountPaid;
  const isCancelled = booking.status === 'cancelled';
  const allParticipantsFilled = participants.every(p => p.name && p.weight && p.height && p.shoeSize);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.myBookingContainer}>
        {/* En-tête */}
        <div className={styles.bookingHeader}>
          <div>
            <h1>Ma réservation</h1>
            <p className={styles.bookingRef}>
              Référence : <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
            </p>
          </div>
          <div className={styles.bookingStatus}>
            {isCancelled ? (
              <span className={styles.statusCancelled}>Annulée</span>
            ) : isPaid ? (
              <span className={styles.statusPaid}>Payée</span>
            ) : (
              <span className={styles.statusPending}>En attente de paiement</span>
            )}
          </div>
        </div>

        {/* Détails de la réservation */}
        <div className={styles.bookingDetailsCard}>
          <h2>Détails de la réservation</h2>

          <div className={styles.bookingInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Canyon</span>
              <strong>{booking.product.name}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Date</span>
              <strong>
                {format(new Date(booking.session.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Horaire</span>
              <strong>{booking.session.timeSlot} - {booking.session.startTime}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Guide</span>
              <strong>{booking.session.guide.login}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nombre de personnes</span>
              <strong>{booking.numberOfPeople} personne{booking.numberOfPeople > 1 ? 's' : ''}</strong>
            </div>
            {booking.shoeRentalCount > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Location chaussures</span>
                <strong>{booking.shoeRentalCount} paire{booking.shoeRentalCount > 1 ? 's' : ''}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Paiement */}
        <div className={styles.bookingDetailsCard}>
          <h2>Paiement</h2>

          <div className={styles.paymentInfo}>
            <div className={styles.paymentRow}>
              <span>Prix total</span>
              <strong>{booking.totalPrice}€</strong>
            </div>
            <div className={styles.paymentRow}>
              <span>Montant payé</span>
              <strong className={styles.paidAmount}>{booking.amountPaid}€</strong>
            </div>
            {!isPaid && !isCancelled && (
              <>
                <div className={`${styles.paymentRow} ${styles.balance}`}>
                  <strong>Solde restant</strong>
                  <strong>{balance}€</strong>
                </div>
                <button
                  onClick={handlePayBalance}
                  className={styles.btnPrimary}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  Payer le solde ({balance}€)
                </button>
              </>
            )}
            {isPaid && (
              <div className={styles.paymentSuccess}>
                ✓ Réservation entièrement payée
              </div>
            )}
          </div>
        </div>

        {/* Informations participants */}
        <div className={styles.bookingDetailsCard}>
          <div className={styles.cardHeader}>
            <h2>Informations des participants</h2>
            {!isCancelled && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className={styles.btnSecondary}
              >
                {allParticipantsFilled ? 'Modifier' : 'Remplir'}
              </button>
            )}
          </div>

          {!allParticipantsFilled && !editMode && (
            <div className={styles.warningBox}>
              ⚠️ Veuillez remplir les informations de tous les participants pour la préparation du matériel
            </div>
          )}

          <div className={styles.participantsList}>
            {participants.map((participant, index) => (
              <div key={index} className={styles.participantItem}>
                <h4>Participant {index + 1}</h4>
                {editMode ? (
                  <div className={styles.participantEditGrid}>
                    <div className={styles.formGroup}>
                      <label>Nom *</label>
                      <input
                        type="text"
                        value={participant.name || ''}
                        onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Poids (kg) *</label>
                      <input
                        type="number"
                        value={participant.weight || ''}
                        onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Taille (cm) *</label>
                      <input
                        type="number"
                        value={participant.height || ''}
                        onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pointure *</label>
                      <input
                        type="number"
                        value={participant.shoeSize || ''}
                        onChange={(e) => handleParticipantChange(index, 'shoeSize', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={styles.participantViewGrid}>
                    {participant.name ? (
                      <>
                        <p><strong>Nom :</strong> {participant.name}</p>
                        <p><strong>Poids :</strong> {participant.weight} kg</p>
                        <p><strong>Taille :</strong> {participant.height} cm</p>
                        <p><strong>Pointure :</strong> {participant.shoeSize}</p>
                      </>
                    ) : (
                      <p className={styles.notFilled}>Non renseigné</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {editMode && (
            <div className={styles.editActions}>
              <button
                onClick={() => {
                  setEditMode(false);
                  loadParticipants(); // Réinitialiser
                }}
                className={styles.btnSecondary}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveParticipants}
                className={styles.btnPrimary}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {/* Informations contact */}
        <div className={styles.bookingDetailsCard}>
          <h2>Vos informations</h2>
          <div className={styles.contactInfo}>
            <p><strong>Nom :</strong> {booking.clientName}</p>
            <p><strong>Email :</strong> {booking.clientEmail}</p>
            <p><strong>Téléphone :</strong> {booking.clientPhone}</p>
          </div>
        </div>

        {/* Message du guide */}
        {booking.product.postBookingMessage && (
          <div className={styles.bookingDetailsCard}>
            <h2>Message du guide</h2>
            <p>{booking.product.postBookingMessage}</p>
          </div>
        )}

        {/* Lieu de rendez-vous */}
        {(booking.product.wazeLink || booking.product.googleMapsLink) && (
          <div className={styles.bookingDetailsCard}>
            <h2>Lieu de rendez-vous</h2>
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

        {/* Actions d'annulation */}
        {!isCancelled && (
          <div className={styles.dangerZone}>
            <h3>Annuler la réservation</h3>
            <p>Si vous souhaitez annuler votre réservation, veuillez contacter le guide ou cliquer ci-dessous.</p>
            <button
              onClick={handleCancelBooking}
              className={styles.btnDanger}
            >
              Annuler ma réservation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooking;
