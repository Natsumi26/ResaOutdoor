import { useState, useEffect } from 'react';
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
    status: 'pending'
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [errors, setErrors] = useState({});
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

      // Présélectionner le premier produit disponible
      const firstAvailable = products.find(p => p.isAvailable);
      if (firstAvailable) {
        setFormData(prev => ({ ...prev, productId: firstAvailable.id }));
        setSelectedProduct(firstAvailable);
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
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email invalide';
    }
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Téléphone requis';
    }
    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Nombre de personnes invalide';
    }
    if (!formData.productId) {
      newErrors.productId = 'Sélectionnez un canyon';
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

  // gestion de la nationalité
  const countries = [
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italie' },
  { code: 'ES', name: 'Espagne' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'DK', name: 'Danemark' },
  { code: 'IE', name: 'Irlande' },
  { code: 'EL', name: 'Grèce' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'BG', name: 'Bulgarie' },
  { code: 'US', name: 'États-Unis' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'PT', name: 'Portugal' },
  { code: 'MA', name: 'Maroc' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
];

const getFlagEmoji = (countryCode) => {
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
};



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

          {selectedProduct && (
            <div className={styles.productDetails}>
              <div className={styles.productInfo}>
                <strong>{selectedProduct.name}</strong>
                <p>{selectedProduct.shortDescription}</p>
                <div className={styles.priceInfo}>
                  <span>💰 Prix individuel : {selectedProduct.priceIndividual}€</span>
                  {selectedProduct.priceGroup && (
                    <span className={styles.groupPrice}>
                      💵 Prix groupe (≥{selectedProduct.priceGroup.min} pers.) : {selectedProduct.priceGroup.price}€/pers.
                    </span>
                  )}
                  <span>👥 Capacité max : {selectedProduct.maxCapacity}</span>
                  <span>⏱️ Durée : {selectedProduct.duration}min</span>
                </div>
              </div>
            </div>
          )}

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
              <small>Maximum : {selectedProduct.placesLeft} places disponibles</small>
            )}
          </div>
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

          <div className={styles.formGroup}>
            <label>Email *</label>
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
            <label>Téléphone *</label>
            <input
              type="tel"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              className={errors.clientPhone ? styles.error : ''}
            />
            {errors.clientPhone && <span className={styles.errorMsg}>{errors.clientPhone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Nationalité</label>
             <div className={styles.nationalityWrapper}>
              <span className={styles.flag}>
                {getFlagEmoji(formData.clientNationality)}
              </span>
              <select
                name="clientNationality"
                value={formData.clientNationality}
                onChange={handleChange}
              >
                <option value="">-- Sélectionner --</option>
                {countries.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
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
