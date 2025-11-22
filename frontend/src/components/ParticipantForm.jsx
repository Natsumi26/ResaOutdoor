import { useState, useEffect } from 'react';
import { activityConfigAPI } from '../services/api';
import styles from './ParticipantForm.module.css';

const ParticipantForm = ({
  booking,
  shoeRentalAvailable,
  shoeRentalPrice,
  onSubmit,
  onCancel,
  initialParticipants = [],
  activityTypeId = 'canyoning',
  guideId = null
}) => {
  const [participants, setParticipants] = useState([]);
  const [activityConfig, setActivityConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Charger la configuration de l'activité
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        // Utiliser l'endpoint public si on a un guideId, sinon l'endpoint authentifié
        const response = guideId
          ? await activityConfigAPI.getPublic(activityTypeId, guideId)
          : await activityConfigAPI.get(activityTypeId);
        setActivityConfig(response.data);
      } catch (error) {
        console.error('Erreur chargement config activité:', error);
        // Config par défaut en cas d'erreur
        setActivityConfig({
          fields: {
            firstName: { enabled: true, required: true },
            age: { enabled: true, required: true },
            height: { enabled: true, required: true },
            weight: { enabled: true, required: true },
            shoeRental: { enabled: true, required: false },
            shoeSize: { enabled: true, required: false },
            practiceLevel: { enabled: false, required: false },
            comment: { enabled: false, required: false }
          },
          wetsuitBrand: 'guara'
        });
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, [activityTypeId, guideId]);

  useEffect(() => {
    const numberOfPeople = booking.numberOfPeople;

    // Commencer avec les participants existants ou un tableau vide
    let updatedParticipants = [...initialParticipants];

    // Si on a moins de participants que nécessaire, ajouter des participants vides
    if (updatedParticipants.length < numberOfPeople) {
      const additionalParticipants = Array.from(
        { length: numberOfPeople - updatedParticipants.length },
        (_, i) => ({
          id: `temp-${updatedParticipants.length + i}`,
          firstName: '',
          age: '',
          height: '',
          weight: '',
          shoeRental: false,
          shoeSize: '',
          practiceLevel: '',
          comment: ''
        })
      );
      updatedParticipants = [...updatedParticipants, ...additionalParticipants];
    }

    // Si on a trop de participants, garder seulement le bon nombre
    if (updatedParticipants.length > numberOfPeople) {
      updatedParticipants = updatedParticipants.slice(0, numberOfPeople);
    }

    setParticipants(updatedParticipants);
  }, [booking.numberOfPeople, initialParticipants.length]);

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setParticipants(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation basée sur la configuration de l'activité
    const errors = [];
    const fields = activityConfig?.fields || {};

    participants.forEach((p, i) => {
      // Prénom toujours requis
      if (!p.firstName.trim()) errors.push(`Participant ${i + 1}: Prénom requis`);

      // Âge - vérifié seulement si le champ est activé et requis
      if (fields.age?.enabled && fields.age?.required && (!p.age || p.age < 1)) {
        errors.push(`Participant ${i + 1}: Âge valide requis`);
      }

      // Taille - vérifié seulement si le champ est activé et requis
      if (fields.height?.enabled && fields.height?.required && (!p.height || p.height < 50)) {
        errors.push(`Participant ${i + 1}: Taille valide requise`);
      }

      // Poids - vérifié seulement si le champ est activé et requis
      if (fields.weight?.enabled && fields.weight?.required && (!p.weight || p.weight < 10)) {
        errors.push(`Participant ${i + 1}: Poids valide requis`);
      }

      // Location de chaussures
      if (p.shoeRental && (!p.shoeSize || p.shoeSize < 20)) {
        errors.push(`Participant ${i + 1}: Pointure requise pour la location`);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    onSubmit({
      participants,
      shoeRentalTotal: getTotalShoeRentalCost(),
      totalWithShoes: getTotalBookingWithShoes()
    });
  };

  const getTotalBookingWithShoes = () => {
    const shoeTotal = getTotalShoeRentalCost();
    const baseTotal = booking.totalPrice || 0;
    return baseTotal + shoeTotal;
  };

  // Calculer la taille de combinaison basée sur le POIDS (taille principale)
  const calculateWetsuitSizeByWeight = (weight) => {
    if (!weight) return '?';
    const w = parseFloat(weight);

    if (w < 25) return 'T6 ans';
    else if (w < 30) return 'T8 ans';
    else if (w < 35) return 'T10 ans';
    else if (w < 40) return 'T12 ans';
    else if (w < 45) return 'T14 ans';
    else if (w < 55) return 'T1';
    else if (w < 65) return 'T2';
    else if (w < 75) return 'T3';
    else if (w < 90) return 'T4';
    else if (w < 105) return 'T5';
    else if (w < 115) return 'T6';
    else if (w < 125) return 'T7';
    else if (w < 135) return 'T8';
    else return 'T8+';
  };

  // Calculer la taille de combinaison basée sur la HAUTEUR (taille alternative)
  const calculateWetsuitSizeByHeight = (height) => {
    if (!height) return '?';
    const h = parseInt(height);

    if (h < 120) return 'T6 ans';
    else if (h < 125) return 'T8 ans';
    else if (h < 130) return 'T10 ans';
    else if (h < 135) return 'T12 ans';
    else if (h < 140) return 'T14 ans';
    else if (h < 155) return 'T0';
    else if (h < 160) return 'T1';
    else if (h < 175) return 'T2';
    else if (h < 180) return 'T3';
    else if (h < 185) return 'T4';
    else if (h < 190) return 'T5';
    else if (h < 195) return 'T6';
    else if (h < 200) return 'T7';
    else if (h < 210) return 'T8';
    else return 'T8+';
  };

  // Fonction de compatibilité - garde l'ancienne logique pour calculateWetsuitSize
  const calculateWetsuitSize = (height, weight) => {
    if (!height || !weight) return '?';

    const h = parseInt(height);
    const w = parseFloat(weight);

    if (w < 25) {
      return 'T6 ans';
    } else if (w < 30) {
      return 'T8 ans';
    } else if (w < 35) {
      return 'T10 ans';
    } else if (w < 40) {
      return 'T12 ans';
    } else if (w < 45) {
      if (h < 145) return 'T14 ans';
      if (h < 155) return 'T0';
      return 'T1';
    } else if (w < 55) {
      return 'T1';
    } else if (w < 65) {
      return 'T2';
    } else if (w < 75) {
      return 'T3';
    } else if (w < 90) {
      return 'T4';
    } else if (w < 105) {
      return 'T5';
    } else if (w < 115) {
      return 'T6';
    } else if (w < 125) {
      return 'T7';
    } else if (w < 135) {
      return 'T8';
    } else {
      return 'T8+';
    }
  };

  const getTotalShoeRentalCost = () => {
    if (!shoeRentalAvailable || !shoeRentalPrice) return 0;
    const count = participants.filter(p => p.shoeRental).length;
    return count * shoeRentalPrice;
  };

  // Helper pour vérifier si un champ est activé
  const isFieldEnabled = (fieldName) => {
    return activityConfig?.fields?.[fieldName]?.enabled !== false;
  };

  // Helper pour vérifier si un champ est requis
  const isFieldRequired = (fieldName) => {
    return activityConfig?.fields?.[fieldName]?.required === true;
  };

  // Afficher un indicateur de chargement pendant le chargement de la config
  if (loadingConfig) {
    return (
      <div className={styles.form}>
        <div className={styles.header}>
          <h3>👥 Informations des participants</h3>
          <p>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <h3>👥 Informations des participants</h3>
        <p className={styles.subtitle}>
          Veuillez renseigner les informations pour chaque participant ({booking.numberOfPeople} personne{booking.numberOfPeople > 1 ? 's' : ''})
        </p>
      </div>

      <div className={styles.participantsList}>
        {participants.map((participant, index) => (
          <div key={participant.id || index} className={styles.participantCard}>
            <div className={styles.participantHeader}>
              <span className={styles.participantNumber}>Participant {index + 1}</span>
              {/* Afficher les badges de taille uniquement pour le canyoning */}
              {activityTypeId === 'canyoning' && (
                <div className={styles.wetsuitBadges}>
                  {participant.weight && (
                    <span className={styles.wetsuitSizeBadge} title="Taille basée sur le poids">
                      {calculateWetsuitSizeByWeight(participant.weight)}
                    </span>
                  )}
                  {participant.height && (
                    <span className={styles.wetsuitSizeBadgeAlt} title="Taille basée sur la hauteur">
                      {calculateWetsuitSizeByHeight(participant.height)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.participantGrid}>
              {/* Prénom - toujours affiché */}
              <div className={styles.formGroup}>
                <label>Prénom *</label>
                <input
                  type="text"
                  value={participant.firstName}
                  onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                  placeholder="Prénom"
                  required
                />
              </div>

              {/* Âge - conditionnel */}
              {isFieldEnabled('age') && (
                <div className={styles.formGroup}>
                  <label>Âge {isFieldRequired('age') ? '*' : ''}</label>
                  <input
                    type="number"
                    value={participant.age}
                    onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                    placeholder="Âge"
                    min="1"
                    max="120"
                    required={isFieldRequired('age')}
                  />
                </div>
              )}

              {/* Taille - conditionnel */}
              {isFieldEnabled('height') && (
                <div className={styles.formGroup}>
                  <label>Taille (cm) {isFieldRequired('height') ? '*' : ''}</label>
                  <input
                    type="number"
                    value={participant.height}
                    onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                    placeholder="Ex: 175"
                    min="50"
                    max="250"
                    required={isFieldRequired('height')}
                  />
                </div>
              )}

              {/* Poids - conditionnel */}
              {isFieldEnabled('weight') && (
                <div className={styles.formGroup}>
                  <label>Poids (kg) {isFieldRequired('weight') ? '*' : ''}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={participant.weight}
                    onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                    placeholder="Ex: 70"
                    min="10"
                    max="200"
                    required={isFieldRequired('weight')}
                  />
                </div>
              )}

              {/* Niveau de pratique - conditionnel */}
              {isFieldEnabled('practiceLevel') && (
                <div className={styles.formGroup}>
                  <label>Niveau de pratique {isFieldRequired('practiceLevel') ? '*' : ''}</label>
                  <input
                    type="text"
                    value={participant.practiceLevel}
                    onChange={(e) => handleParticipantChange(index, 'practiceLevel', e.target.value)}
                    placeholder="Ex: Débutant, Intermédiaire, Confirmé"
                    required={isFieldRequired('practiceLevel')}
                  />
                </div>
              )}

              {/* Commentaire - conditionnel */}
              {isFieldEnabled('comment') && (
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Commentaire {isFieldRequired('comment') ? '*' : ''}</label>
                  <textarea
                    value={participant.comment}
                    onChange={(e) => handleParticipantChange(index, 'comment', e.target.value)}
                    placeholder="Informations complémentaires..."
                    rows="3"
                    required={isFieldRequired('comment')}
                  />
                </div>
              )}
            </div>

            {shoeRentalAvailable && (
              <div className={styles.shoeRentalSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={participant.shoeRental}
                    onChange={(e) => handleParticipantChange(index, 'shoeRental', e.target.checked)}
                  />
                  <span>
                    Location de chaussures (+{shoeRentalPrice}€)
                  </span>
                </label>

                {participant.shoeRental && (
                  <div className={styles.formGroup}>
                    <label>Pointure *</label>
                    <input
                      type="number"
                      value={participant.shoeSize}
                      onChange={(e) => handleParticipantChange(index, 'shoeSize', e.target.value)}
                      placeholder="Ex: 42"
                      min="20"
                      max="50"
                      required
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {shoeRentalAvailable && getTotalShoeRentalCost() > 0 && (
        <div className={styles.rentalSummary}>
          <strong>Total location de chaussures:</strong> {getTotalShoeRentalCost().toFixed(2)}€
          <br />
          <strong>Total réservation + chaussures:</strong> {getTotalBookingWithShoes().toFixed(2)}€
        </div>
      )}

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.btnSubmit}>
          Enregistrer les participants
        </button>
      </div>
    </form>
  );
};

export default ParticipantForm;
