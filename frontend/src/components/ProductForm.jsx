import { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import { categoriesAPI, equipmentListsAPI } from '../services/api';
import styles from './ProductForm.module.css';
import imageCompression from 'browser-image-compression';

const ProductForm = ({ product, categories: initialCategories, users, currentUser, onSubmit, onCancel }) => {
  // Activités pré-définies
  const predefinedActivities = [
    { id: 'canyoning', name: 'Canyoning', description: 'Descente de canyons en eau' },
    { id: 'via-ferrata', name: 'Via Ferrata', description: 'Escalade équipée en montagne' },
    { id: 'escalade', name: 'Escalade', description: 'Escalade de bloc et falaise' },
    { id: 'speleologie', name: 'Spéléologie', description: 'Exploration de grottes' }
  ];

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
    meetingPoint: '',
    websiteLink: '',
    wazeLink: '',
    googleMapsLink: '',
    activityTypeId: '', // Type d'activité (catégorie principale)
    categoryIds: [],
    equipmentListId: '', // Liste de matériel associée
    guideId: '',
    images: [],
    priceGroup: { enabled: false, min: '', price: '' }
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState(initialCategories || []);
  const [equipmentLists, setEquipmentLists] = useState([]);
  const [guidePracticeActivities, setGuidePracticeActivities] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [showEquipmentListModal, setShowEquipmentListModal] = useState(false);
  const [newEquipmentList, setNewEquipmentList] = useState({ name: '', items: '' });
  const [creatingEquipmentList, setCreatingEquipmentList] = useState(false);

  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  useEffect(() => {
    // Charger les listes de matériel
    const loadEquipmentLists = async () => {
      try {
        const response = await equipmentListsAPI.getAll();
        setEquipmentLists(response.data.equipmentLists || []);
      } catch (error) {
        console.error('Erreur lors du chargement des listes de matériel:', error);
      }
    };

    loadEquipmentLists();
  }, []);

  useEffect(() => {
    // Initialiser les activités pratiquées du guide actuel
    if (currentUser?.practiceActivities) {
      setGuidePracticeActivities(currentUser.practiceActivities);

      // Si le guide n'a qu'une activité, la pré-sélectionner
      if (currentUser.practiceActivities.length === 1 && !formData.activityTypeId) {
        setFormData(prev => ({
          ...prev,
          activityTypeId: currentUser.practiceActivities[0]
        }));
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (product) {
      // Extraire les IDs de catégories depuis la structure product.categories
      const categoryIds = product.categories
        ? product.categories.map(pc => pc.categoryId || pc.category?.id).filter(Boolean)
        : [];

      setFormData({
        ...product,
        duration: product.duration ? product.duration / 60 : '', // Convertir minutes en heures
        categoryIds: categoryIds,
        equipmentListId: product.equipmentListId || '',
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

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const categoryIds = prev.categoryIds || [];
      const isSelected = categoryIds.includes(categoryId);

      return {
        ...prev,
        categoryIds: isSelected
          ? categoryIds.filter(id => id !== categoryId)
          : [...categoryIds, categoryId]
      };
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Veuillez entrer un nom de catégorie');
      return;
    }

    setCreatingCategory(true);
    try {
      const response = await categoriesAPI.create({
        name: newCategoryName,
        description: ''
      });

      // Ajouter la nouvelle catégorie à la liste
      const newCategory = response.data.category;
      setCategories(prev => [...prev, newCategory]);

      // Pré-sélectionner la nouvelle catégorie
      setFormData(prev => ({
        ...prev,
        categoryIds: [...(prev.categoryIds || []), newCategory.id]
      }));

      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la création de la catégorie');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateEquipmentList = async () => {
    if (!newEquipmentList.name.trim()) {
      alert('Veuillez entrer un nom de liste');
      return;
    }
    if (!newEquipmentList.items.trim()) {
      alert('Veuillez entrer les éléments de la liste');
      return;
    }

    setCreatingEquipmentList(true);
    try {
      const response = await equipmentListsAPI.create({
        name: newEquipmentList.name,
        items: newEquipmentList.items
      });

      // Ajouter la nouvelle liste
      const newList = response.data.equipmentList;
      setEquipmentLists(prev => [...prev, newList]);

      // Pré-sélectionner la nouvelle liste
      setFormData(prev => ({
        ...prev,
        equipmentListId: newList.id
      }));

      setNewEquipmentList({ name: '', items: '' });
      setShowEquipmentListModal(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la création de la liste de matériel');
    } finally {
      setCreatingEquipmentList(false);
    }
  };

  const handleColorChange = (color) => {
    setFormData(prev => ({ ...prev, color: color.hex }));
  };

//Gestion des images avec compression 
  const compressImages = async (files) => {
    const options = {
      maxSizeMB: 1, // limite à 1 Mo
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    const compressedFiles = await Promise.all(
      files.map(file => imageCompression(file, options))
    );

    return compressedFiles;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const compressed = await compressImages(files);
    console.log(compressed)
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      compressed.forEach(file => {
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

    if (!formData.activityTypeId.trim()) newErrors.activityTypeId = 'Type d\'activité requis';
    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.priceIndividual || formData.priceIndividual <= 0)
      newErrors.priceIndividual = 'Prix individuel requis';
    if (!formData.duration || formData.duration <= 0)
      newErrors.duration = 'Durée requise';
    if (!formData.maxCapacity || formData.maxCapacity <= 0)
      newErrors.maxCapacity = 'Capacité requise';

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

    // Ne pas envoyer guideId si l'utilisateur n'est pas super_admin ou leader (sera auto-assigné côté serveur)
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'leader' && currentUser?.role !== 'admin') {
      delete submitData.guideId;
    }

    onSubmit(submitData);
  };

  return (
    <>
      {/* Bouton retour */}
      <button
        onClick={onCancel}
        type="button"
        style={{
          position: 'fixed',
          top: '20px',
          left: '290px',
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
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          e.currentTarget.style.background = 'white';
        }}
        title="Retour"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

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
              <label>Type d'activité *</label>
              <select
                name="activityTypeId"
                value={formData.activityTypeId}
                onChange={handleChange}
                className={errors.activityTypeId ? styles.error : ''}
              >
                <option value="">-- Sélectionner --</option>
                {predefinedActivities
                  .filter(activity => guidePracticeActivities.includes(activity.id))
                  .map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
              </select>
              {errors.activityTypeId && <span className={styles.errorMsg}>{errors.activityTypeId}</span>}
            </div>

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
          </div>

          <div className={styles.formGroup}>
            <label>Catégories personnalisées</label>
            <div className={styles.categoriesCheckboxes}>
              {categories.length === 0 ? (
                <p className={styles.noCategories}>Aucune catégorie personnalisée pour le moment</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className={styles.categoryItem}>
                    <label className={styles.categoryCheckbox}>
                      <input
                        type="checkbox"
                        checked={formData.categoryIds?.includes(cat.id) || false}
                        onChange={() => handleCategoryToggle(cat.id)}
                      />
                      <span>{cat.name}</span>
                    </label>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              className={styles.btnAddCategory}
              onClick={() => setShowCategoryModal(true)}
            >
              + Ajouter une catégorie
            </button>
            <small>Créez vos propres catégories pour organiser vos produits</small>
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
                    <img src={`http://localhost:5000${url}`} alt={`Image ${index + 1}`} />
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
            <label>Liste de matériel à apporter</label>
            <select
              name="equipmentListId"
              value={formData.equipmentListId}
              onChange={handleChange}
            >
              <option value="">-- Aucune liste --</option>
              {equipmentLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.btnAddCategory}
              onClick={() => setShowEquipmentListModal(true)}
            >
              + Créer une nouvelle liste
            </button>
            <small>Sélectionnez ou créez une liste de matériel que les clients devront apporter</small>
          </div>

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
            <label>Lien vers la page internet</label>
            <input
              type="url"
              name="websiteLink"
              value={formData.websiteLink}
              onChange={handleChange}
              placeholder="https://votre-site.com/produit"
            />
            <small>Lien vers la page de présentation du produit sur votre site web</small>
          </div>

          <div className={styles.formGroup}>
            <label>Lieu de départ</label>
            <input
              type="text"
              name="meetingPoint"
              value={formData.meetingPoint}
              onChange={handleChange}
              placeholder="Ex: Devant la mairie de Thônes"
            />
            <small>Point de rendez-vous pour les participants (affiché dans la page client)</small>
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

      {/* Modal de création de catégorie personnalisée */}
      {showCategoryModal && (
        <div className={styles.modal} onClick={() => setShowCategoryModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Créer une catégorie personnalisée</h2>
            <div className={styles.formGroup}>
              <label>Nom de la catégorie *</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Progression, Initiation, Expérience..."
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowCategoryModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleCreateCategory}
                disabled={creatingCategory}
              >
                {creatingCategory ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de liste de matériel */}
      {showEquipmentListModal && (
        <div className={styles.modal} onClick={() => setShowEquipmentListModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Créer une liste de matériel</h2>
            <div className={styles.formGroup}>
              <label>Nom de la liste *</label>
              <input
                type="text"
                value={newEquipmentList.name}
                onChange={(e) => setNewEquipmentList(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Matériel Canyon Découverte"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Liste du matériel à apporter *</label>
              <textarea
                value={newEquipmentList.items}
                onChange={(e) => setNewEquipmentList(prev => ({ ...prev, items: e.target.value }))}
                placeholder="Ex:&#10;- Maillot de bain&#10;- Serviette&#10;- Chaussures de sport fermées&#10;- Bouteille d'eau"
                rows="8"
              />
              <small>Entrez chaque élément sur une ligne séparée</small>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowEquipmentListModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleCreateEquipmentList}
                disabled={creatingEquipmentList}
              >
                {creatingEquipmentList ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
    </>
  );
};

export default ProductForm;
