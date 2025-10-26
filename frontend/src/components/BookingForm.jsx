import { useState, useEffect } from 'react';
import { resellersAPI } from '../services/api';
import styles from './BookingForm.module.css';

const BookingForm = ({ session, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    clientNationality: '',
    numberOfPeople: 1,
    productId: '',
    totalPrice: 0,
    amountPaid: 0,
    status: 'pending',
    resellerId: null
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [isResellerBooking, setIsResellerBooking] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Charger les revendeurs
    const loadResellers = async () => {
      try {
        const response = await resellersAPI.getAll();
        setResellers(response.data.resellers || []);
      } catch (error) {
        console.error('Erreur chargement revendeurs:', error);
      }
    };
    loadResellers();
  }, []);

  useEffect(() => {
    if (session) {
      // Calculer les produits disponibles avec leurs places restantes
      const products = session.products.map(sp => {
        const product = sp.product;

        // Calculer l'occupation actuelle pour ce produit
        const currentOccupancy = session.bookings
          .filter(b => b.productId === product.id && b.status !== 'cancelled')
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        const placesLeft = product.maxCapacity - currentOccupancy;

        // En mode rotation magique, vérifier si un produit est déjà réservé
        let isAvailable = true;
        let blockedReason = null;

        if (session.isMagicRotation && session.bookings.length > 0) {
          const firstBookingProductId = session.bookings[0].productId;
          if (firstBookingProductId !== product.id) {
            isAvailable = false;
            blockedReason = 'Guide occupé avec un autre canyon';
          }
        }

        if (placesLeft <= 0) {
          isAvailable = false;
          blockedReason = 'Complet';
        }

        return {
          ...product,
          placesLeft,
          isAvailable,
          blockedReason
        };
      });

      setAvailableProducts(products);

      // Pré-sélection du canyon :
      // 1. Si la session a déjà des réservations → pré-sélectionner le canyon de la première réservation
      // 2. Sinon, si un seul produit est disponible → pré-sélectionner ce produit
      // 3. Sinon, si la session n'a qu'un seul produit configuré → pré-sélectionner ce produit
      let productToSelect = null;

      if (session.bookings && session.bookings.length > 0) {
        // Cas 1 : Il y a déjà des réservations, prendre le canyon de la première
        const firstBookingProductId = session.bookings[0].productId;
        productToSelect = products.find(p => p.id === firstBookingProductId && p.isAvailable);
      }

      if (!productToSelect) {
        // Cas 2 : Un seul produit est disponible
        const availableProducts = products.filter(p => p.isAvailable);
        if (availableProducts.length === 1) {
          productToSelect = availableProducts[0];
        }
      }

      if (!productToSelect && products.length === 1 && products[0].isAvailable) {
        // Cas 3 : Un seul produit configuré
        productToSelect = products[0];
      }

      if (productToSelect) {
        setFormData(prev => ({ ...prev, productId: productToSelect.id }));
        setSelectedProduct(productToSelect);
      }
    }
  }, [session]);

  useEffect(() => {
    // Recalculer le prix quand le produit ou le nombre de personnes change
    if (selectedProduct && formData.numberOfPeople) {
      const price = calculatePrice(selectedProduct, formData.numberOfPeople);
      setFormData(prev => ({ ...prev, totalPrice: price }));
    }
  }, [selectedProduct, formData.numberOfPeople]);

  const calculatePrice = (product, numberOfPeople) => {
    if (!product) return 0;

    // Vérifier si un prix groupe s'applique
    if (product.priceGroup && numberOfPeople >= product.priceGroup.min) {
      return numberOfPeople * product.priceGroup.price;
    }

    // Sinon, prix individuel
    return numberOfPeople * product.priceIndividual;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'productId') {
      const product = availableProducts.find(p => p.id === value);
      setSelectedProduct(product);
    }

    if (name === 'numberOfPeople') {
      const num = parseInt(value);
      if (selectedProduct && num > selectedProduct.placesLeft) {
        return; // Ne pas autoriser plus que la capacité restante
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.clientFirstName.trim()) {
      newErrors.clientFirstName = 'Prénom requis';
    }
    if (!formData.clientLastName.trim()) {
      newErrors.clientLastName = 'Nom requis';
    }
    // Email optionnel, mais si rempli, doit être valide
    if (formData.clientEmail.trim() && !/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email invalide';
    }
    // Téléphone optionnel
    // if (!formData.clientPhone.trim()) {
    //   newErrors.clientPhone = 'Téléphone requis';
    // }
    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Nombre de personnes invalide';
    }
    if (!formData.productId) {
      newErrors.productId = 'Sélectionnez un canyon';
    }
    if (isResellerBooking && !formData.resellerId) {
      newErrors.resellerId = 'Sélectionnez un revendeur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      ...formData,
      numberOfPeople: parseInt(formData.numberOfPeople),
      totalPrice: parseFloat(formData.totalPrice),
      amountPaid: parseFloat(formData.amountPaid),
      sessionId: session.id
    };

    onSubmit(submitData);
  };

  if (!session) {
    return <div className={styles.error}>Session non trouvée</div>;
  }

  // Langues disponibles
  const languages = [
    { code: 'FR', name: 'Français', flagCode: 'fr' },
    { code: 'EN', name: 'English', flagCode: 'gb' }
  ];

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>📝 Nouvelle réservation</h2>

      <div className={styles.sessionInfo}>
        <h3>Session : {new Date(session.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })} - {session.timeSlot} ({session.startTime})</h3>
        {session.isMagicRotation && (
          <span className={styles.badge}>🎲 Rotation Magique</span>
        )}
      </div>

      <div className={styles.formGrid}>
        {/* Canyon */}
        <div className={styles.section}>
          <h3>🏞️ Canyon</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Canyon *</label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className={errors.productId ? styles.error : ''}
              >
                <option value="">Sélectionner...</option>
                {availableProducts.map(product => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={!product.isAvailable}
                  >
                    {product.name} - {product.isAvailable
                      ? `${product.placesLeft} places disponibles`
                      : product.blockedReason
                    }
                  </option>
                ))}
              </select>
              {errors.productId && <span className={styles.errorMsg}>{errors.productId}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Nombre de personnes *</label>
              <input
                type="number"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleChange}
                min="1"
                max={selectedProduct?.placesLeft || 1}
                className={errors.numberOfPeople ? styles.error : ''}
              />
              {errors.numberOfPeople && <span className={styles.errorMsg}>{errors.numberOfPeople}</span>}
              {selectedProduct && (
                <small>Max : {selectedProduct.placesLeft} places</small>
              )}
            </div>
          </div>

          {selectedProduct && (
            <div className={styles.productDetails}>
              <div className={styles.productInfo}>
                <strong>{selectedProduct.name}</strong>
                <p>{selectedProduct.shortDescription}</p>
                <div className={styles.priceInfo}>
                  <span>💰 {selectedProduct.priceIndividual}€/pers</span>
                  {selectedProduct.priceGroup && (
                    <span className={styles.groupPrice}>
                      💵 Groupe (≥{selectedProduct.priceGroup.min}) : {selectedProduct.priceGroup.price}€/pers
                    </span>
                  )}
                  <span>👥 Max : {selectedProduct.maxCapacity}</span>
                  <span>⏱️ {selectedProduct.duration}min</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revendeur - version compacte */}
        <div className={styles.resellerSection}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isResellerBooking}
              onChange={(e) => {
                setIsResellerBooking(e.target.checked);
                if (!e.target.checked) {
                  setFormData(prev => ({ ...prev, resellerId: null }));
                }
              }}
              className={styles.checkbox}
            />
            <span>Réservation revendeur</span>
          </label>

          {isResellerBooking && (
            <div className={styles.resellerSelect}>
              <select
                name="resellerId"
                value={formData.resellerId || ''}
                onChange={handleChange}
                className={errors.resellerId ? styles.error : ''}
              >
                <option value="">-- Sélectionner un revendeur --</option>
                {resellers.map(reseller => (
                  <option key={reseller.id} value={reseller.id}>
                    {reseller.name}
                    {reseller.commission && ` (${reseller.commission}%)`}
                  </option>
                ))}
              </select>
              {errors.resellerId && <span className={styles.errorMsg}>{errors.resellerId}</span>}
            </div>
          )}
        </div>

        {/* Informations client */}
        <div className={styles.section}>
          <h3>👤 Informations client</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Prénom *</label>
              <input
                type="text"
                name="clientFirstName"
                value={formData.clientFirstName}
                onChange={handleChange}
                className={errors.clientFirstName ? styles.error : ''}
              />
              {errors.clientFirstName && <span className={styles.errorMsg}>{errors.clientFirstName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Nom *</label>
              <input
                type="text"
                name="clientLastName"
                value={formData.clientLastName}
                onChange={handleChange}
                className={errors.clientLastName ? styles.error : ''}
              />
              {errors.clientLastName && <span className={styles.errorMsg}>{errors.clientLastName}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className={errors.clientEmail ? styles.error : ''}
              />
              {errors.clientEmail && <span className={styles.errorMsg}>{errors.clientEmail}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Téléphone</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className={errors.clientPhone ? styles.error : ''}
              />
              {errors.clientPhone && <span className={styles.errorMsg}>{errors.clientPhone}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Langue parlée</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '8px' }}>
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => handleChange({ target: { name: 'clientNationality', value: lang.code } })}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: formData.clientNationality === lang.code ? '2px solid #3498db' : '2px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: formData.clientNationality === lang.code ? '#e3f2fd' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={`https://flagcdn.com/24x18/${lang.flagCode}.png`}
                    alt={lang.code}
                    style={{ width: '24px', height: '18px' }}
                  />
                  <span style={{ fontWeight: formData.clientNationality === lang.code ? '600' : '400' }}>
                    {lang.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paiement */}
        <div className={styles.section}>
          <h3>💳 Paiement</h3>

          <div className={styles.priceDisplay}>
            <div className={styles.priceRow}>
              <span>Prix total :</span>
              <strong>{formData.totalPrice.toFixed(2)}€</strong>
            </div>
            {selectedProduct?.priceGroup && formData.numberOfPeople >= selectedProduct.priceGroup.min && (
              <small className={styles.priceNote}>
                ✅ Prix groupe appliqué
              </small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Montant payé (€)</label>
            <input
              type="number"
              name="amountPaid"
              value={formData.amountPaid}
              onChange={handleChange}
              step="0.01"
              min="0"
              max={formData.totalPrice}
            />
            <small>Laissez 0 si aucun acompte n'a été versé</small>
          </div>

          <div className={styles.formGroup}>
            <label>Statut</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.btnSubmit}>
          Créer la réservation
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
