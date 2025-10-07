import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from './SessionForm.module.css';

const SessionForm = ({ session, products, onSubmit, onCancel, initialDate }) => {
  const [formData, setFormData] = useState({
    date: initialDate ? format(new Date(initialDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    timeSlot: 'matin',
    startTime: '09:00',
    isMagicRotation: false,
    productIds: [],  // Array de produits sélectionnés
    status: 'open'
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
        status: session.status
      });
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'isMagicRotation') {
      setFormData(prev => ({
        ...prev,
        isMagicRotation: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleTimeSlotChange = (slot) => {
    let defaultTime = '09:00';
    if (slot === 'après-midi') defaultTime = '14:00';
    if (slot === 'journée') defaultTime = '09:00';

    setFormData(prev => ({
      ...prev,
      timeSlot: slot,
      startTime: defaultTime
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
        // Mode normal: sélection unique ou multiple (selon votre besoin)
        // Pour l'instant, on autorise quand même le multi-sélection en mode normal
        return {
          ...prev,
          productIds: isSelected
            ? prev.productIds.filter(id => id !== productId)
            : [...prev.productIds, productId]
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
      productIds: formData.productIds
    };

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
              onChange={handleChange}
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
            >
              🌅 Matin
            </button>
            <button
              type="button"
              className={formData.timeSlot === 'après-midi' ? styles.active : ''}
              onClick={() => handleTimeSlotChange('après-midi')}
            >
              ☀️ Après-midi
            </button>
            <button
              type="button"
              className={formData.timeSlot === 'journée' ? styles.active : ''}
              onClick={() => handleTimeSlotChange('journée')}
            >
              🌞 Journée
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
              ℹ️ Mode standard : Vous pouvez proposer plusieurs canyons sur ce créneau.
              Chaque canyon peut être réservé indépendamment jusqu'à sa capacité maximale.
            </p>
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
                    <span>⏱️ {product.duration}min</span>
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
