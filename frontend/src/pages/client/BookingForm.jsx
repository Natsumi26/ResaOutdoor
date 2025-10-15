import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsAPI, bookingsAPI, giftVouchersAPI, stripeAPI, participantsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';

const BookingForm = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    numberOfPeople: 1,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    voucherCode: '',
    shoeRentalCount: 0,
    paymentMethod: 'online', // 'online' ou 'onsite'
    fillParticipantsNow: false
  });

  const [participants, setParticipants] = useState([]);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    // Initialiser les participants quand le nombre de personnes change
    if (formData.fillParticipantsNow) {
      const newParticipants = Array(formData.numberOfPeople).fill(null).map((_, i) => ({
        name: participants[i]?.name || '',
        weight: participants[i]?.weight || '',
        height: participants[i]?.height || '',
        shoeSize: participants[i]?.shoeSize || ''
      }));
      setParticipants(newParticipants);
    }
  }, [formData.numberOfPeople, formData.fillParticipantsNow]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await sessionsAPI.getById(sessionId);
      setSession(response.data.session);
    } catch (error) {
      console.error('Erreur chargement session:', error);
      navigate('/client/search');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      [field]: value
    };
    setParticipants(newParticipants);
  };

  const handleVerifyVoucher = async () => {
    if (!formData.voucherCode) {
      setVoucherError('Veuillez saisir un code');
      return;
    }

    try {
      const response = await giftVouchersAPI.verifyCode(formData.voucherCode);
      if (response.data.valid) {
        setVoucherInfo(response.data.voucher);
        setVoucherError('');
      } else {
        setVoucherError('Code invalide ou expiré');
        setVoucherInfo(null);
      }
    } catch (error) {
      setVoucherError(error.response?.data?.error || 'Code invalide');
      setVoucherInfo(null);
    }
  };

  const calculateTotal = () => {
    if (!session || !session.products || session.products.length === 0) return 0;

    const product = session.products[0].product;
    const numberOfPeople = formData.numberOfPeople;

    let pricePerPerson = product.priceIndividual;

    // Appliquer le prix de groupe si applicable
    if (product.priceGroup && numberOfPeople >= product.priceGroup.min) {
      pricePerPerson = product.priceGroup.price;
    }

    let total = pricePerPerson * numberOfPeople;

    // Ajouter la location de chaussures
    if (formData.shoeRentalCount > 0 && session.shoeRentalPrice) {
      total += session.shoeRentalPrice * formData.shoeRentalCount;
    }

    // Appliquer le bon cadeau
    if (voucherInfo) {
      total -= voucherInfo.amount;
      if (total < 0) total = 0;
    }

    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.fillParticipantsNow) {
      const allFilled = participants.every(p => p.name && p.weight && p.height && p.shoeSize);
      if (!allFilled) {
        alert('Veuillez remplir les informations de tous les participants');
        return;
      }
    }

    try {
      setSubmitting(true);

      const total = calculateTotal();
      const bookingData = {
        sessionId: session.id,
        productId: session.products[0].product.id,
        numberOfPeople: formData.numberOfPeople,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        totalPrice: total,
        amountPaid: formData.paymentMethod === 'online' ? total : 0,
        status: formData.paymentMethod === 'online' ? 'confirmed' : 'pending',
        shoeRentalCount: formData.shoeRentalCount || null,
        voucherCode: formData.voucherCode || null
      };

      // Créer la réservation
      const bookingResponse = await bookingsAPI.create(bookingData);
      const booking = bookingResponse.data.booking;

      // Enregistrer les participants si remplis
      if (formData.fillParticipantsNow && participants.length > 0) {
        await participantsAPI.upsert(booking.id, { participants });
      }

      // Rediriger selon le mode de paiement
      if (formData.paymentMethod === 'online') {
        // Créer une session de paiement Stripe
        const stripeResponse = await stripeAPI.createCheckoutSession({
          bookingId: booking.id,
          amount: total
        });
        window.location.href = stripeResponse.data.url;
      } else {
        // Paiement sur place - rediriger vers la confirmation
        navigate(`/client/booking-confirmation/${booking.id}`);
      }
    } catch (error) {
      console.error('Erreur création réservation:', error);
      alert(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!session || !session.products || session.products.length === 0) {
    return <div className={styles.error}>Session introuvable</div>;
  }

  const product = session.products[0].product;
  const total = calculateTotal();

  return (
    <div className={styles.clientContainer}>
      <div className={styles.bookingFormContainer}>
        {/* Résumé de la session */}
        <div className={styles.bookingSummary}>
          <h2>Résumé de votre réservation</h2>

          <div className={styles.summaryCard}>
            <h3>{product.name}</h3>
            <div className={styles.summaryDetails}>
              <p><strong>Date:</strong> {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
              <p><strong>Horaire:</strong> {session.timeSlot} - {session.startTime}</p>
              <p><strong>Durée:</strong> {product.duration / 60}h</p>
              <p><strong>Guide:</strong> {session.guide.login}</p>
            </div>

            {product.images && product.images.length > 0 && (
              <img
                src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`}
                alt={product.name}
                className={styles.summaryImage}
              />
            )}
          </div>

          {/* Calcul du prix */}
          <div className={styles.priceBreakdown}>
            <h3>Détail du prix</h3>
            <div className={styles.priceItem}>
              <span>{formData.numberOfPeople} personne(s) × {
                product.priceGroup && formData.numberOfPeople >= product.priceGroup.min
                  ? product.priceGroup.price
                  : product.priceIndividual
              }€</span>
              <span>{(product.priceGroup && formData.numberOfPeople >= product.priceGroup.min
                ? product.priceGroup.price
                : product.priceIndividual) * formData.numberOfPeople}€</span>
            </div>

            {formData.shoeRentalCount > 0 && session.shoeRentalPrice && (
              <div className={styles.priceItem}>
                <span>{formData.shoeRentalCount} location(s) chaussures × {session.shoeRentalPrice}€</span>
                <span>{session.shoeRentalPrice * formData.shoeRentalCount}€</span>
              </div>
            )}

            {voucherInfo && (
              <div className={`${styles.priceItem} ${styles.discount}`}>
                <span>Bon cadeau appliqué</span>
                <span>-{voucherInfo.amount}€</span>
              </div>
            )}

            <div className={`${styles.priceItem} ${styles.total}`}>
              <strong>Total</strong>
              <strong>{total}€</strong>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className={styles.bookingFormSection}>
          <h2>Vos informations</h2>

          <form onSubmit={handleSubmit} className={styles.bookingForm}>
            <div className={styles.formGroup}>
              <label>Nombre de personnes *</label>
              <select
                value={formData.numberOfPeople}
                onChange={(e) => handleChange('numberOfPeople', parseInt(e.target.value))}
                required
              >
                {Array.from({ length: product.maxCapacity }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num} personne{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Nom complet *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleChange('clientEmail', e.target.value)}
                placeholder="jean.dupont@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Téléphone *</label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => handleChange('clientPhone', e.target.value)}
                placeholder="06 12 34 56 78"
                required
              />
            </div>

            {session.shoeRentalAvailable && (
              <div className={styles.formGroup}>
                <label>Location de chaussures ({session.shoeRentalPrice}€/paire)</label>
                <select
                  value={formData.shoeRentalCount}
                  onChange={(e) => handleChange('shoeRentalCount', parseInt(e.target.value))}
                >
                  {Array.from({ length: formData.numberOfPeople + 1 }, (_, i) => i).map(num => (
                    <option key={num} value={num}>{num} paire{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Bon cadeau */}
            <div className={styles.voucherSection}>
              <label>Code bon cadeau (optionnel)</label>
              <div className={styles.voucherInput}>
                <input
                  type="text"
                  value={formData.voucherCode}
                  onChange={(e) => handleChange('voucherCode', e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                />
                <button type="button" onClick={handleVerifyVoucher} className={styles.btnSecondary}>
                  Vérifier
                </button>
              </div>
              {voucherError && <p className={styles.error}>{voucherError}</p>}
              {voucherInfo && (
                <p className={styles.success}>
                  Bon cadeau valide : {voucherInfo.amount}€
                </p>
              )}
            </div>

            {/* Remplir les infos participants maintenant */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.fillParticipantsNow}
                  onChange={(e) => handleChange('fillParticipantsNow', e.target.checked)}
                />
                Remplir les informations des participants maintenant (taille, poids, pointure)
              </label>
              <small>Vous pourrez aussi les remplir plus tard depuis votre page de réservation</small>
            </div>

            {/* Formulaire participants */}
            {formData.fillParticipantsNow && (
              <div className={styles.participantsSection}>
                <h3>Informations des participants</h3>
                {participants.map((participant, index) => (
                  <div key={index} className={styles.participantCard}>
                    <h4>Participant {index + 1}</h4>
                    <div className={styles.participantGrid}>
                      <div className={styles.formGroup}>
                        <label>Nom *</label>
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Poids (kg) *</label>
                        <input
                          type="number"
                          value={participant.weight}
                          onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Taille (cm) *</label>
                        <input
                          type="number"
                          value={participant.height}
                          onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Pointure *</label>
                        <input
                          type="number"
                          value={participant.shoeSize}
                          onChange={(e) => handleParticipantChange(index, 'shoeSize', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mode de paiement */}
            <div className={styles.paymentMethodSection}>
              <h3>Mode de paiement</h3>
              <div className={styles.paymentOptions}>
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  />
                  <div>
                    <strong>Payer en ligne maintenant</strong>
                    <p>Paiement sécurisé par carte bancaire</p>
                  </div>
                </label>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="onsite"
                    checked={formData.paymentMethod === 'onsite'}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  />
                  <div>
                    <strong>Payer sur place</strong>
                    <p>Vous pourrez payer le jour de l'activité</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={styles.btnSecondary}
                disabled={submitting}
              >
                Retour
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Traitement...' : (
                  formData.paymentMethod === 'online' ? `Payer ${total}€` : 'Confirmer la réservation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
