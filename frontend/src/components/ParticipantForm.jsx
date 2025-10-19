import { useState, useEffect } from 'react';
import styles from './ParticipantForm.module.css';

const ParticipantForm = ({
  booking,
  shoeRentalAvailable,
  shoeRentalPrice,
  onSubmit,
  onCancel,
  initialParticipants = []
}) => {
  const [participants, setParticipants] = useState([]);

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
          shoeSize: ''
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

    // Validation
    const errors = [];
    participants.forEach((p, i) => {
      if (!p.firstName.trim()) errors.push(`Participant ${i + 1}: Prénom requis`);
      if (!p.age || p.age < 1) errors.push(`Participant ${i + 1}: Âge valide requis`);
      if (!p.height || p.height < 50) errors.push(`Participant ${i + 1}: Taille valide requise`);
      if (!p.weight || p.weight < 10) errors.push(`Participant ${i + 1}: Poids valide requis`);
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
              {participant.height && participant.weight && (
                <span className={styles.wetsuitSizeBadge}>
                  Combinaison: {calculateWetsuitSize(participant.height, participant.weight)}
                </span>
              )}
            </div>

            <div className={styles.participantGrid}>
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

              <div className={styles.formGroup}>
                <label>Âge *</label>
                <input
                  type="number"
                  value={participant.age}
                  onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                  placeholder="Âge"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Taille (cm) *</label>
                <input
                  type="number"
                  value={participant.height}
                  onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                  placeholder="Ex: 175"
                  min="50"
                  max="250"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Poids (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={participant.weight}
                  onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                  placeholder="Ex: 70"
                  min="10"
                  max="200"
                  required
                />
              </div>
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
