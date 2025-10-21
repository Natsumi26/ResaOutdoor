import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsAPI,productsAPI, bookingsAPI, giftVouchersAPI, stripeAPI, participantsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const BookingForm = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get('productId');
  console.log(productId)
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    numberOfPeople: 1,
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    clientNationality:'',
    voucherCode: '',
    paymentMethod: 'online', // 'online' ou 'onsite'
    fillParticipantsNow: false
  });

  const [participants, setParticipants] = useState([]);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    loadSession();
    loadProduct();
  }, [sessionId, productId]);

  useEffect(() => {
    // Initialiser les participants quand le nombre de personnes change
    if (formData.fillParticipantsNow) {
      const newParticipants = Array(formData.numberOfPeople).fill(null).map((_, i) => ({
        firstName: participants[i]?.firstName || '',
        age: participants[i]?.age || '',
        weight: participants[i]?.weight || '',
        height: participants[i]?.height || '',
        shoeRental: participants[i]?.shoeRental || false,
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

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(productId);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Erreur chargement produit:', error);
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
      setVoucherError(t('saisirCode'));
      return;
    }

    try {
      const response = await giftVouchersAPI.verifyCode(formData.voucherCode);
      if (response.data.valid) {
        setVoucherInfo(response.data.voucher);
        setVoucherError('');
      } else {
        setVoucherError(t('codeEronner'));
        setVoucherInfo(null);
      }
    } catch (error) {
      setVoucherError(error.response?.data?.error || 'Code invalide');
      setVoucherInfo(null);
    }
  };

  const calculateTotal = () => {
    if (!session || !product) return 0;

    const numberOfPeople = formData.numberOfPeople;

    let pricePerPerson = product.priceIndividual;

    // Appliquer le prix de groupe si applicable
    if (product.priceGroup && numberOfPeople >= product.priceGroup.min) {
      pricePerPerson = product.priceGroup.price;
    }

    let total = pricePerPerson * numberOfPeople;

    // Ajouter la location de chaussures (si les participants sont remplis)
    if (formData.fillParticipantsNow && session.shoeRentalPrice) {
      const shoeRentalCount = participants.filter(p => p.shoeRental).length;
      total += session.shoeRentalPrice * shoeRentalCount;
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
    if (!formData.clientFirstName || !formData.clientLastName  || !formData.clientEmail || !formData.clientPhone || !formData.clientNationality) {
      alert(t('alerts.champsOblig'));
      return;
    }

    if (formData.fillParticipantsNow) {
      const allFilled = participants.every(p => {
        const basicInfoFilled = p.firstName && p.age && p.weight && p.height;
        // Si le participant veut des chaussures, la pointure est obligatoire
        const shoeSizeValid = !p.shoeRental || (p.shoeRental && p.shoeSize);
        return basicInfoFilled && shoeSizeValid;
      });
      if (!allFilled) {
        alert(t('alerts.RemplirAllChamps'));
        return;
      }
    }

    try {
      setSubmitting(true);

      const total = calculateTotal();

      // Calculer le nombre de locations de chaussures
      let shoeRentalCount = 0;
      if (formData.fillParticipantsNow && session.shoeRentalPrice) {
        shoeRentalCount = participants.filter(p => p.shoeRental).length;
      }

      const bookingData = {
        sessionId: session.id,
        productId: productId,
        numberOfPeople: formData.numberOfPeople,
        clientFirstName: formData.clientFirstName,
        clientLastName: formData.clientLastName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        clientNationality: formData.clientNationality,
        totalPrice: total,
        amountPaid: formData.paymentMethod === 'online' ? total : 0,
        status: formData.paymentMethod === 'online' ? 'confirmed' : 'pending',
        shoeRentalCount: shoeRentalCount || null,
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
    return <div className={styles.loading}>{t('Chargement')}...</div>;
  }

  if (!session) {
    return <div className={styles.error}>{t('noSession')}</div>;
  }

  const total = calculateTotal();
  const nationalityOptions = [
  "FR", "IT", "ES", "DE", "BE", "CH", "GB", "US", "CA", "NL",
  "PT", "SE", "NO", "DK", "AU", "NZ", "JP", "CN", "BR", "AR"
];

  return (
    <div className={styles.clientContainer}>
      <div className={styles.bookingFormContainer}>
        {/* Résumé de la session */}
        <div className={styles.bookingSummary}>
          <h2>{t('detailResa')}</h2>

          <div className={styles.summaryCard}>
            <h3>{product.name}</h3>
            <div className={styles.summaryDetails}>
              <p><strong>Date:</strong> {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
              <p><strong>{t('Horaire')}:</strong> {session.timeSlot} - {session.startTime}</p>
              <p><strong>{t('Durée')}:</strong> {product.duration / 60}h</p>
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
            <h3>{t('priceDetail')}</h3>
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

            {formData.fillParticipantsNow && session.shoeRentalPrice && participants.filter(p => p.shoeRental).length > 0 && (
              <div className={styles.priceItem}>
                <span>{participants.filter(p => p.shoeRental).length} {t('locaShoes')} × {session.shoeRentalPrice}€</span>
                <span>{session.shoeRentalPrice * participants.filter(p => p.shoeRental).length}€</span>
              </div>
            )}

            {voucherInfo && (
              <div className={`${styles.priceItem} ${styles.discount}`}>
                <span>{t('BonApply')}</span>
                <span>-{voucherInfo.amount}€</span>
              </div>
            )}

            <div className={`${styles.priceItem} ${styles.total}`}>
              <strong>{t('Total')}</strong>
              <strong>{total}€</strong>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className={styles.bookingFormSection}>
          <h2>{t('yoursInfos')}</h2>

          <form onSubmit={handleSubmit} className={styles.bookingForm}>
            <div className={styles.formGroup}>
              <label>{t('nbrPersonne')} *</label>
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
              <label>{t('Prénom')} *</label>
              <input
                type="text"
                value={formData.clientFirstName}
                onChange={(e) => handleChange('clientFirstName', e.target.value)}
                placeholder="Jean"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('Nom')} *</label>
              <input
                type="text"
                value={formData.clientLastName}
                onChange={(e) => handleChange('clientLastName', e.target.value)}
                placeholder="Dupont"
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
              <label>{t('Téléphone')} *</label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => handleChange('clientPhone', e.target.value)}
                placeholder="06 12 34 56 78"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('Nationalité')} *</label>
              <select
                value={formData.clientNationality}
                onChange={(e) => handleChange('clientNationality', e.target.value)}
                required
              >
                <option value="">{t('nationalities.placeholder')}</option>
                {nationalityOptions.map((code) => (
                  <option key={code} value={code}>
                    {t(`nationalities.${code}`)}
                  </option>
                ))}
              </select>
            </div>


            {/* Bon cadeau */}
            <div className={styles.voucherSection}>
              <label>{t('CodeCadeau')}</label>
              <div className={styles.voucherInput}>
                <input
                  type="text"
                  value={formData.voucherCode}
                  onChange={(e) => handleChange('voucherCode', e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                />
                <button type="button" onClick={handleVerifyVoucher} className={styles.btnSecondary}>
                  {t('Vérifier')}
                </button>
              </div>
              {voucherError && <p className={styles.error}>{voucherError}</p>}
              {voucherInfo && (
                <p className={styles.success}>
                  {t('ValidBon')} : {voucherInfo.amount}€
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
                {t('FormNowPart')}{t(session.shoeRentalAvailable ? 'shoesLoc' : '')})
              </label>
              <small>{t('FormLaterPart')}</small>
              {session.shoeRentalAvailable && !formData.fillParticipantsNow && (
                <small className={styles.infoNote}>ℹ️ {t('AskLaterShoesLoc')}</small>
              )}
            </div>

            {/* Formulaire participants */}
            {formData.fillParticipantsNow && (
              <div className={styles.participantsSection}>
                <h3>{t('InfosPart')}</h3>
                {participants.map((participant, index) => (
                  <div key={index} className={styles.participantCard}>
                    <h4>Participant {index + 1}</h4>
                    <div className={styles.participantGrid}>
                      <div className={styles.formGroup}>
                        <label>{t('Prénom')} *</label>
                        <input
                          type="text"
                          value={participant.firstName}
                          onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{t('Poids')} (kg) *</label>
                        <input
                          type="number"
                          value={participant.weight}
                          onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{t('Taille')} (cm) *</label>
                        <input
                          type="number"
                          value={participant.height}
                          onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Age (an) *</label>
                        <input
                          type="number"
                          value={participant.age}
                          onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                          required={formData.fillParticipantsNow}
                        />
                      </div>
                    </div>

                    

                    {/* Location de chaussures */}
                    {session.shoeRentalAvailable && (
                      <div className={styles.shoeRentalSection}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={participant.shoeRental}
                            onChange={(e) => handleParticipantChange(index, 'shoeRental', e.target.checked)}
                          />
                          {t('LocShoes')} (+{session.shoeRentalPrice}€)
                        </label>

                        {participant.shoeRental && (
                          <div className={styles.formGroup}>
                            <label>{t('Pointure')} *</label>
                            <input
                              type="number"
                              value={participant.shoeSize}
                              onChange={(e) => handleParticipantChange(index, 'shoeSize', e.target.value)}
                              placeholder="Ex: 42"
                              min="20"
                              max="50"
                              required={participant.shoeRental}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mode de paiement */}
            <div className={styles.paymentMethodSection}>
              <h3>{t('PaymentMode')}</h3>
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
                    <strong>{t('payNow')}</strong>
                    <p>{t('cbPay')}</p>
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
                    <strong>{t('payOnPlace')}</strong>
                    <p>{t('payDayActivity')}</p>
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
                {t('Retour')}
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {t(submitting ? 'Traitement...' : (
                  formData.paymentMethod === 'online' ? `Payer ${total}€` : 'comfirmResa'
                ))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
