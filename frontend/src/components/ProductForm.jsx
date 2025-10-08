import { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import styles from './ProductForm.module.css';

const ProductForm = ({ product, categories, users, currentUser, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    priceIndividual: '',
    duration: '',
    color: '#3498db',
    level: 'découverte',
    maxCapacity: '',
    autoCloseHoursBefore: '',
    postBookingMessage: '',
    wazeLink: '',
    googleMapsLink: '',
    categoryId: '',
    guideId: '',
    images: [],
    priceGroup: { enabled: false, min: '', price: '' }
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        duration: product.duration ? product.duration / 60 : '', // Convertir minutes en heures
        priceGroup: product.priceGroup
          ? { enabled: true, ...product.priceGroup }
          : { enabled: false, min: '', price: '' }
      });
    } else if (users.length > 0 && !formData.guideId) {
      setFormData(prev => ({ ...prev, guideId: users[0].id }));
    }
  }, [product, users]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriceGroupChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      priceGroup: {
        ...prev.priceGroup,
        [field]: value
      }
    }));
  };

  const handleColorChange = (color) => {
    setFormData(prev => ({ ...prev, color: color.hex }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      files.forEach(file => {
        formDataUpload.append('images', file);
      });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...data.urls]
      }));
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload des images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.priceIndividual || formData.priceIndividual <= 0)
      newErrors.priceIndividual = 'Prix individuel requis';
    if (!formData.duration || formData.duration <= 0)
      newErrors.duration = 'Durée requise';
    if (!formData.maxCapacity || formData.maxCapacity <= 0)
      newErrors.maxCapacity = 'Capacité requise';
    if (!formData.categoryId)
      newErrors.categoryId = 'Catégorie requise';

    // Valider le guideId uniquement pour les admins
    // if (currentUser?.role === 'admin' && !formData.guideId)
    //   newErrors.guideId = 'Guide requis';

    if (formData.priceGroup.enabled) {
      if (!formData.priceGroup.min || formData.priceGroup.min <= 0)
        newErrors.priceGroupMin = 'Min personnes requis';
      if (!formData.priceGroup.price || formData.priceGroup.price <= 0)
        newErrors.priceGroupPrice = 'Prix groupe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      ...formData,
      priceIndividual: parseFloat(formData.priceIndividual),
      duration: parseInt(formData.duration) * 60, // Convertir heures en minutes
      maxCapacity: parseInt(formData.maxCapacity),
      autoCloseHoursBefore: formData.autoCloseHoursBefore
        ? parseInt(formData.autoCloseHoursBefore)
        : null,
      priceGroup: formData.priceGroup.enabled
        ? {
            min: parseInt(formData.priceGroup.min),
            price: parseFloat(formData.priceGroup.price)
          }
        : null
    };

    // Ne pas envoyer guideId si l'utilisateur n'est pas admin (sera auto-assigné côté serveur)
    if (currentUser?.role !== 'admin') {
      delete submitData.guideId;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        {/* Informations de base */}
        <div className={styles.section}>
          <h3>📝 Informations de base</h3>

          <div className={styles.formGroup}>
            <label>Nom du produit *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? styles.error : ''}
              placeholder="Ex: Canyon des Écouges"
            />
            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Description courte</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Résumé en une ligne"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description complète</label>
            <textarea
              name="longDescription"
              value={formData.longDescription}
              onChange={handleChange}
              rows="4"
              placeholder="Description détaillée de l'activité..."
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Catégorie *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={errors.categoryId ? styles.error : ''}
              >
                <option value="">Sélectionner...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className={styles.errorMsg}>{errors.categoryId}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Niveau *</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="découverte">Découverte</option>
                <option value="aventure">Aventure</option>
                <option value="sportif">Sportif</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Capacité max *</label>
              <input
                type="number"
                name="maxCapacity"
                value={formData.maxCapacity}
                onChange={handleChange}
                className={errors.maxCapacity ? styles.error : ''}
                min="1"
              />
              {errors.maxCapacity && <span className={styles.errorMsg}>{errors.maxCapacity}</span>}
            </div>
          </div>
        </div>

        {/* Tarification */}
        <div className={styles.section}>
          <h3>💰 Tarification</h3>

          <div className={styles.formGroup}>
            <label>Prix individuel (€) *</label>
            <input
              type="number"
              name="priceIndividual"
              value={formData.priceIndividual}
              onChange={handleChange}
              className={errors.priceIndividual ? styles.error : ''}
              step="0.01"
              min="0"
            />
            {errors.priceIndividual && <span className={styles.errorMsg}>{errors.priceIndividual}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.priceGroup.enabled}
                onChange={(e) => handlePriceGroupChange('enabled', e.target.checked)}
              />
              Activer les prix groupe
            </label>
          </div>

          {formData.priceGroup.enabled && (
            <div className={styles.priceGroupBox}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Min. personnes *</label>
                  <input
                    type="number"
                    value={formData.priceGroup.min}
                    onChange={(e) => handlePriceGroupChange('min', e.target.value)}
                    className={errors.priceGroupMin ? styles.error : ''}
                    min="1"
                  />
                  {errors.priceGroupMin && <span className={styles.errorMsg}>{errors.priceGroupMin}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Prix/personne (€) *</label>
                  <input
                    type="number"
                    value={formData.priceGroup.price}
                    onChange={(e) => handlePriceGroupChange('price', e.target.value)}
                    className={errors.priceGroupPrice ? styles.error : ''}
                    step="0.01"
                    min="0"
                  />
                  {errors.priceGroupPrice && <span className={styles.errorMsg}>{errors.priceGroupPrice}</span>}
                </div>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Durée (heures) *</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={errors.duration ? styles.error : ''}
              min="0.5"
              step="0.5"
              placeholder="Ex: 3.5"
            />
            {errors.duration && <span className={styles.errorMsg}>{errors.duration}</span>}
            <small>Vous pouvez utiliser des demi-heures (ex: 2.5 pour 2h30)</small>
          </div>
        </div>

        {/* Apparence */}
        <div className={styles.section}>
          <h3>🎨 Apparence</h3>

          <div className={styles.formGroup}>
            <label>Couleur du produit</label>
            <div className={styles.colorPickerWrapper}>
              <div
                className={styles.colorSwatch}
                style={{ backgroundColor: formData.color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <span>{formData.color}</span>
              </div>
              {showColorPicker && (
                <div className={styles.colorPickerPopover}>
                  <div
                    className={styles.colorPickerCover}
                    onClick={() => setShowColorPicker(false)}
                  />
                  <ChromePicker
                    color={formData.color}
                    onChange={handleColorChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className={styles.fileInput}
            />
            {uploading && <p className={styles.uploading}>Upload en cours...</p>}

            {formData.images.length > 0 && (
              <div className={styles.imagePreview}>
                {formData.images.map((url, index) => (
                  <div key={index} className={styles.imageItem}>
                    <img src={url} alt={`Image ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImage}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className={styles.section}>
          <h3>⚙️ Configuration</h3>

          <div className={styles.formGroup}>
            <label>Fermeture auto (heures avant)</label>
            <input
              type="number"
              name="autoCloseHoursBefore"
              value={formData.autoCloseHoursBefore}
              onChange={handleChange}
              min="0"
              placeholder="Ex: 24"
            />
            <small>Nombre d'heures avant la session pour bloquer les réservations</small>
          </div>

          <div className={styles.formGroup}>
            <label>Message après réservation</label>
            <textarea
              name="postBookingMessage"
              value={formData.postBookingMessage}
              onChange={handleChange}
              rows="3"
              placeholder="Message envoyé au client après sa réservation..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Lien Waze</label>
            <input
              type="url"
              name="wazeLink"
              value={formData.wazeLink}
              onChange={handleChange}
              placeholder="https://waze.com/ul?ll=..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Lien Google Maps</label>
            <input
              type="url"
              name="googleMapsLink"
              value={formData.googleMapsLink}
              onChange={handleChange}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.btnSubmit}>
          {product ? 'Modifier' : 'Créer'} le produit
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
