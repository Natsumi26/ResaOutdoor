import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, participantsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const MyBooking = () => {
  const { t } = useTranslation();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState({});
  const navigate = useNavigate();


  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      loadParticipants();
    }
  }, [booking]);

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
      if (booking && typeof booking.numberOfPeople === 'number') {
        const needed = booking.numberOfPeople;
        while (existingParticipants.length < needed) {
          existingParticipants.push({
            firstName: '',
            age: '',
            weight: '',
            height: '',
            shoeRental: false,
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
    if (!booking || !booking.session) {
      console.error('Booking ou session manquant');
      alert(t('SaveInfosFail'));
      setSaving(false);
      return;
    }

    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      [field]: value
    };
    setParticipants(newParticipants);
  };

  const toggleTooltip = (participantIndex) => {
    setTooltipVisible(prev => ({
      ...prev,
      [participantIndex]: !prev[participantIndex]
    }));
  };

  const handleSaveParticipants = async () => {
    try {
      setSaving(true);

      // Calculer le nombre de locations de chaussures
      const shoeRentalCount = participants.filter(p => p.shoeRental).length;

      const cleanedParticipants = participants.map(p => ({
        firstName: p.firstName.trim() || null,
        age: p.age !== '' ? parseInt(p.age) : null,
        weight: p.weight !== '' ? parseFloat(p.weight) : null,
        height: p.height !== '' ? parseInt(p.height) : null,
        shoeRental: !!p.shoeRental,
        shoeSize: p.shoeRental && p.shoeSize ? parseInt(p.shoeSize) : null
      }));

      // Mettre à jour les participants et le nombre de locations si changé
      await participantsAPI.upsert(bookingId, {participants: cleanedParticipants  });

      // Si le nombre de locations a changé, mettre à jour la réservation
      if (booking.shoeRentalCount !== shoeRentalCount && booking.session.shoeRentalPrice) {
        const previousShoePrice = (booking.shoeRentalCount || 0) * booking.session.shoeRentalPrice;
        const newShoePrice = shoeRentalCount * booking.session.shoeRentalPrice;
        const newTotalPrice = booking.totalPrice - previousShoePrice + newShoePrice;

        await bookingsAPI.update(bookingId, {
          totalPrice: newTotalPrice
        });

        // Recharger la réservation pour avoir les nouvelles valeurs
        await loadBooking();
      }

      alert(t('SaveInfos'));
      navigate('/client/search');

    } catch (error) {
      console.error('Erreur sauvegarde participants:', error);
      alert(t('SaveInfosFail'));
    } finally {
      setSaving(false);
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

  return (
    <div className={styles.clientContainer}>
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'white',
          border: '2px solid #2c3e50',
          cursor: 'pointer',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          transition: 'all 0.2s',
          padding: 0
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          e.target.style.background = 'white';
        }}
        title="Retour"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.myBookingContainer}>
        {/* En-tête simplifié */}
        <div className={styles.compactHeader}>
          <h1>{t('InfosGroup')}</h1>
          <p className={styles.bookingDate}>
            {booking.product.name} - {format(new Date(booking.session.date), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Texte explicatif compact */}
        <div className={styles.compactInfoBox}>
          <div className={styles.infoRow}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📏</span>
              <span>{t('Fournir')} <strong>{t('CombiAdapt')}</strong></span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>👟</span>
              <span>
                {t('Chaussures')} <strong>{t('TypeChaussures')}</strong>
                {booking.session.shoeRentalAvailable && ` (location ${booking.session.shoeRentalPrice}€ optionnelle)`}
              </span>
            </div>
          </div>
        </div>

        {/* Formulaire participants compact */}
        <div className={styles.compactParticipantsForm}>
          {participants.map((participant, index) => (
            <div key={index} className={styles.compactParticipantCard}>
              <div className={styles.participantHeader}>
                <span className={styles.participantNumber}>Participant {index + 1}</span>
              </div>

              {/* Grille compacte avec les 4 champs de base seulement */}
              <div className={styles.compactFieldsGrid}>
                <div className={styles.formGroup}>
                  <label>{t('Prénom')}</label>
                  <input
                    type="text"
                    value={participant.firstName || ''}
                    onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                    placeholder="Prénom"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Âge</label>
                  <input
                    type="number"
                    value={participant.age || ''}
                    onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                    placeholder="Âge"
                    min="1"
                    max="120"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('Poids')} (kg)</label>
                  <input
                    type="number"
                    value={participant.weight || ''}
                    onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                    placeholder="kg"
                    min="1"
                    max="300"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('Taille')} (cm)</label>
                  <input
                    type="number"
                    value={participant.height || ''}
                    onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                    placeholder="cm"
                    min="50"
                    max="250"
                  />
                </div>
              </div>

              {/* Section location de chaussures compacte sur une ligne */}
              {booking.session.shoeRentalAvailable && (
                <div className={styles.shoeRentalCompactLine}>
                  <div className={styles.tooltipContainer}>
                    <span
                      className={styles.tooltipIcon}
                      onClick={() => toggleTooltip(index)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M8 7V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="8" cy="5" r="0.75" fill="currentColor"/>
                      </svg>
                    </span>
                    <div className={`${styles.tooltip} ${tooltipVisible[index] ? styles.visible : ''}`}>
                      {t('ProposeShoes')}
                    </div>
                  </div>

                  <div className={styles.shoeRentalLabel}>
                    {t('LocShoes')} (+{booking.session.shoeRentalPrice}€)
                  </div>

                  <div className={styles.shoeCheckboxLine}>
                    <input
                      type="checkbox"
                      id={`shoe-rental-${index}`}
                      checked={participant.shoeRental || false}
                      onChange={(e) => handleParticipantChange(index, 'shoeRental', e.target.checked)}
                    />
                  </div>

                  {participant.shoeRental && (
                    <div className={styles.shoeSizeInline}>
                      <label htmlFor={`shoe-size-${index}`}>{t('Pointure')} *</label>
                      <input
                        type="number"
                        id={`shoe-size-${index}`}
                        value={participant.shoeSize || ''}
                        onChange={(e) => handleParticipantChange(index, 'shoeSize', e.target.value)}
                        placeholder="Ex: 42"
                        min="20"
                        max="50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bouton de sauvegarde */}
        <div className={styles.saveSection}>
          <button
            onClick={handleSaveParticipants}
            className={styles.btnSave}
          >
            {saving ? t('Enregistrement en cours...') : t('Enregistrer les informations')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyBooking;
