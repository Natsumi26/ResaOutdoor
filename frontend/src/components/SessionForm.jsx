import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from './SessionForm.module.css';

const SessionForm = ({ session, products, guides, currentUser, onSubmit, onCancel, initialDate }) => {
  const [formData, setFormData] = useState({
    date: initialDate ? format(new Date(initialDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    timeSlot: 'matin',
    startTime: '09:00',
    isMagicRotation: false,
    productIds: [],  // Array de produits sélectionnés
    guideId: '',  // Guide assigné (pour leader)
    status: 'open',
    shoeRentalAvailable: false,  // Location de chaussures disponible
    shoeRentalPrice: ''  // Prix de location
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (session) {
      // Extraire les IDs des produits de la session
      const productIds = session.products ? session.products.map(sp => sp.productId) : [];

      setFormData({
        date: format(new Date(session.date), 'yyyy-MM-dd'),
        timeSlot: session.timeSlot,
        startTime: session.startTime,
        isMagicRotation: session.isMagicRotation,
        productIds,
        guideId: session.guideId || '',
        status: session.status,
        shoeRentalAvailable: session.shoeRentalAvailable || false,
        shoeRentalPrice: session.shoeRentalPrice || ''
      });
    } else if (currentUser && !formData.guideId) {
      // Par défaut, le guide connecté
      setFormData(prev => ({ ...prev, guideId: currentUser.id }));
    }
  }, [session, currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

  const getTimeSlotFromTime = (time) => time >= '13:00' ? 'après-midi' : 'matin';
  const getDefaultTimeFromSlot = (slot) => slot === 'après-midi' ? '13:00' : '09:00';

  const handleTimeSlotChange = (slot) => {
    const defaultTime = getDefaultTimeFromSlot(slot);
    setFormData(prev => ({
      ...prev,
      timeSlot: slot,
      startTime: defaultTime
    }));
  };

  const handleStartTimeChange = (time) => {
    const slot = getTimeSlotFromTime(time);
    setFormData(prev => ({
      ...prev,
      startTime: time,
      timeSlot: slot
    }));
  };

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const isSelected = prev.productIds.includes(productId);

      if (prev.isMagicRotation) {
        // Mode Rotation Magique: sélection multiple
        return {
          ...prev,
          productIds: isSelected
            ? prev.productIds.filter(id => id !== productId)
            : [...prev.productIds, productId]
        };
      } else {
        // Mode normal: sélection unique uniquement
        return {
          ...prev,
          productIds: isSelected
            ? [] // Désélectionner si déjà sélectionné
            : [productId] // Sélectionner uniquement celui-ci (remplace les autres)
        };
      }
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date requise';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Heure de début requise';
    }

    if (formData.productIds.length === 0) {
      newErrors.products = 'Sélectionnez au moins un produit';
    }

    if (!formData.guideId) {
      newErrors.guideId = 'Sélectionnez un guide';
    }

    // Validation location de chaussures
    if (formData.shoeRentalAvailable) {
      if (!formData.shoeRentalPrice || parseFloat(formData.shoeRentalPrice) <= 0) {
        newErrors.shoeRentalPrice = 'Le prix de location doit être supérieur à 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      date: new Date(formData.date).toISOString(),
      timeSlot: formData.timeSlot,
      startTime: formData.startTime,
      isMagicRotation: formData.isMagicRotation,
      status: formData.status,
      productIds: formData.productIds,
      guideId: formData.guideId,
      shoeRentalAvailable: formData.shoeRentalAvailable,
      shoeRentalPrice: formData.shoeRentalAvailable ? parseFloat(formData.shoeRentalPrice) : null
    };
    console.log(formData.guideId)
    console.log(submitData)
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{session ? 'Modifier la session' : 'Nouvelle session'}</h2>

      {/* Date et horaires */}
      <div className={styles.section}>
        <h3>📅 Date et horaires</h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? styles.error : ''}
            />
            {errors.date && <span className={styles.errorMsg}>{errors.date}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Heure de début *</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className={errors.startTime ? styles.error : ''}
            />
            {errors.startTime && <span className={styles.errorMsg}>{errors.startTime}</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Créneau</label>
          <div className={styles.timeSlotButtons}>
            <button
              type="button"
              className={formData.timeSlot === 'matin' ? styles.active : ''}
              onClick={() => handleTimeSlotChange('matin')}
              style={formData.timeSlot === 'matin' ? {
                backgroundColor: 'var(--guide-primary)',
                borderColor: 'var(--guide-primary)'
              } : {}}
            >
              🌅 Matin
            </button>
            <button
              type="button"
              className={formData.timeSlot === 'après-midi' ? styles.active : ''}
              onClick={() => handleTimeSlotChange('après-midi')}
              style={formData.timeSlot === 'après-midi' ? {
                backgroundColor: 'var(--guide-primary)',
                borderColor: 'var(--guide-primary)'
              } : {}}
            >
              ☀️ Après-midi
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Statut</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="open">Ouvert</option>
            <option value="full">Complet</option>
            <option value="closed">Fermé</option>
          </select>
        </div>

        {/* Sélection du guide (pour admin) */}
        {(currentUser?.role === 'super_admin'|| currentUser?.role === 'leader' ) && guides && guides.length > 0 && (
          <div className={styles.formGroup}>
            <label>Guide assigné *</label>
            <select
              name="guideId"
              value={formData.guideId}
              onChange={handleChange}
              className={errors.guideId ? styles.error : ''}
            >
              <option value="">Sélectionner un guide...</option>
              {guides.map(guide => (
                <option key={guide.id} value={guide.id}>
                  {guide.login} {guide.email && `(${guide.email})`}
                </option>
              ))}
            </select>
            {errors.guideId && <span className={styles.errorMsg}>{errors.guideId}</span>}
          </div>
        )}
      </div>

      {/* Mode de session */}
      <div className={styles.section}>
        <h3>🎯 Type de session</h3>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isMagicRotation"
              checked={formData.isMagicRotation}
              onChange={handleChange}
            />
            <div>
              <strong>Mode Rotation Magique</strong>
              <p className={styles.helpText}>
                Ajoutez plusieurs canyons. Dès qu'un client réserve l'un d'eux, les autres deviennent indisponibles (guide occupé).
              </p>
            </div>
          </label>
        </div>

        {formData.isMagicRotation ? (
          <div className={styles.magicRotationInfo}>
            <p className={styles.infoBox}>
              🎲 En mode rotation magique : Sélectionnez plusieurs canyons de même durée (demi-journée).
              Le premier canyon réservé bloquera automatiquement les autres pour ce créneau.
            </p>
          </div>
        ) : (
          <div className={styles.normalModeInfo}>
            <p className={styles.infoBox}>
              ℹ️ Mode standard : Sélectionnez un seul canyon pour ce créneau.
              Le canyon peut être réservé jusqu'à sa capacité maximale.
            </p>
          </div>
        )}
      </div>

      {/* Location de chaussures */}
      <div className={styles.section}>
        <h3>👟 Location de chaussures</h3>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="shoeRentalAvailable"
              checked={formData.shoeRentalAvailable}
              onChange={handleChange}
            />
            <div>
              <strong>Proposer la location de chaussures</strong>
              <p className={styles.helpText}>
                Les clients pourront ajouter une location de chaussures lors de leur réservation.
              </p>
            </div>
          </label>
        </div>

        {formData.shoeRentalAvailable && (
          <div className={styles.formGroup}>
            <label>Prix de location par personne *</label>
            <input
              type="number"
              name="shoeRentalPrice"
              value={formData.shoeRentalPrice}
              onChange={handleChange}
              placeholder="Ex: 5"
              step="0.01"
              min="0"
              className={errors.shoeRentalPrice ? styles.error : ''}
            />
            {errors.shoeRentalPrice && <span className={styles.errorMsg}>{errors.shoeRentalPrice}</span>}
            <p className={styles.helpText}>Le prix sera ajouté au total de la réservation pour chaque participant qui souhaite louer des chaussures.</p>
          </div>
        )}
      </div>

      {/* Sélection de produits */}
      <div className={styles.section}>
        <h3>
          {formData.isMagicRotation ? '🎲 Canyons de la rotation' : '🏞️ Canyons disponibles'}
        </h3>

        {errors.products && <span className={styles.errorMsg}>{errors.products}</span>}
        
        <div className={styles.productGrid}>
          {products.map((product) => {
            const isSelected = formData.productIds.includes(product.id);
            

            return (
              <div
                key={product.id}
                className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleProductToggle(product.id)}
              >
                <div
                  className={styles.productColorBar}
                  style={{ backgroundColor: product.color }}
                />
                <div className={styles.productCardContent}>
                  <h4>{product.name}</h4>
                  <div className={styles.productDetails}>
                    <span>💰 {product.priceIndividual}€</span>
                    <span>⏱️ {product.duration/60}h</span>
                    <span>👥 {product.maxCapacity}</span>
                  </div>
                  <span className={styles.productLevel}>{product.level}</span>
                </div>
                {isSelected && (
                  <div className={styles.selectedBadge}>
                    ✓
                  </div>
                )}
              </div>
            );
          })}

          {products.length === 0 && (
            <p className={styles.emptyState}>
              Aucun produit disponible. Créez d'abord des produits.
            </p>
          )}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.btnSubmit}>
          {session ? 'Modifier' : 'Créer'} la session
        </button>
      </div>
    </form>
  );
};

export default SessionForm;
