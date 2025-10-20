import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClientPages.module.css';

const GiftVoucherPurchase = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Informations de l'acheteur
    buyerFirstName: '',
    buyerLastName: '',
    buyerEmail: '',
    buyerPhone: '',

    // Informations du bénéficiaire
    recipientFirstName: '',
    recipientLastName: '',
    recipientEmail: '',
    personalMessage: '',

    // Détails du bon
    voucherType: 'amount', // 'amount' ou 'activity'
    amount: '',
    selectedProduct: '',
    quantity: 1,

    // Livraison
    deliveryMethod: 'email', // 'email' ou 'postal'
    deliveryDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Options de montants prédéfinis
  const amountOptions = [50, 75, 100, 150, 200];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Appel API pour créer le bon cadeau et initier le paiement
      // const response = await api.createGiftVoucher(formData);
      // navigate(`/payment?voucherId=${response.data.id}`);

      console.log('Données du bon cadeau:', formData);

      // Pour l'instant, redirection vers une page de confirmation temporaire
      alert('Fonctionnalité en cours de développement. Votre bon cadeau sera bientôt disponible !');
    } catch (error) {
      console.error('Erreur création bon cadeau:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.searchHeader}>
        <button
          onClick={() => navigate('/client/search')}
          className={styles.btnSecondary}
          style={{ marginBottom: '1rem' }}
        >
          ← Retour à la recherche
        </button>
        <h1>🎁 Offrir un bon cadeau</h1>
        <p>Offrez une expérience inoubliable en pleine nature !</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.giftVoucherForm}>
          {/* Type de bon cadeau */}
          <div className={styles.formSection}>
            <h2>Type de bon cadeau</h2>
            <div className={styles.voucherTypeSelector}>
              <div
                className={`${styles.voucherTypeCard} ${formData.voucherType === 'amount' ? styles.active : ''}`}
                onClick={() => handleChange('voucherType', 'amount')}
              >
                <div className={styles.voucherTypeIcon}>💰</div>
                <h3>Montant libre</h3>
                <p>Le bénéficiaire choisit son activité</p>
              </div>

              <div
                className={`${styles.voucherTypeCard} ${formData.voucherType === 'activity' ? styles.active : ''}`}
                onClick={() => handleChange('voucherType', 'activity')}
              >
                <div className={styles.voucherTypeIcon}>🏞️</div>
                <h3>Activité spécifique</h3>
                <p>Choisissez le canyon à offrir</p>
              </div>
            </div>
          </div>

          {/* Montant ou activité */}
          <div className={styles.formSection}>
            {formData.voucherType === 'amount' ? (
              <>
                <h2>Montant du bon cadeau</h2>
                <div className={styles.amountOptions}>
                  {amountOptions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`${styles.amountOption} ${formData.amount === amount.toString() ? styles.active : ''}`}
                      onClick={() => handleChange('amount', amount.toString())}
                    >
                      {amount}€
                    </button>
                  ))}
                </div>
                <div className={styles.customAmount}>
                  <label>Ou montant personnalisé</label>
                  <input
                    type="number"
                    min="20"
                    placeholder="Montant en €"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <h2>Choisissez l'activité</h2>
                <select
                  value={formData.selectedProduct}
                  onChange={(e) => handleChange('selectedProduct', e.target.value)}
                  required
                >
                  <option value="">Sélectionnez un canyon</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.priceIndividual}€/pers
                    </option>
                  ))}
                </select>
                <div className={styles.quantitySelector}>
                  <label>Nombre de participants</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Informations de l'acheteur */}
          <div className={styles.formSection}>
            <h2>Vos informations</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Prénom *</label>
                <input
                  type="text"
                  value={formData.buyerFirstName}
                  onChange={(e) => handleChange('buyerFirstName', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.buyerLastName}
                  onChange={(e) => handleChange('buyerLastName', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.buyerEmail}
                  onChange={(e) => handleChange('buyerEmail', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Téléphone *</label>
                <input
                  type="tel"
                  value={formData.buyerPhone}
                  onChange={(e) => handleChange('buyerPhone', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Informations du bénéficiaire */}
          <div className={styles.formSection}>
            <h2>Bénéficiaire du bon cadeau</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Prénom</label>
                <input
                  type="text"
                  value={formData.recipientFirstName}
                  onChange={(e) => handleChange('recipientFirstName', e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nom</label>
                <input
                  type="text"
                  value={formData.recipientLastName}
                  onChange={(e) => handleChange('recipientLastName', e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => handleChange('recipientEmail', e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Message personnalisé</label>
              <textarea
                value={formData.personalMessage}
                onChange={(e) => handleChange('personalMessage', e.target.value)}
                placeholder="Ajoutez un message personnel pour accompagner votre cadeau..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Options de livraison */}
          <div className={styles.formSection}>
            <h2>Mode de livraison</h2>
            <div className={styles.deliveryOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="email"
                  checked={formData.deliveryMethod === 'email'}
                  onChange={(e) => handleChange('deliveryMethod', e.target.value)}
                />
                <div>
                  <strong>Par email (Gratuit)</strong>
                  <p>Livraison immédiate après paiement</p>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="postal"
                  checked={formData.deliveryMethod === 'postal'}
                  onChange={(e) => handleChange('deliveryMethod', e.target.value)}
                />
                <div>
                  <strong>Par courrier (+5€)</strong>
                  <p>Carte cadeau physique sous 3-5 jours ouvrés</p>
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>Date de livraison souhaitée (optionnel)</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleChange('deliveryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <small>Le bon cadeau sera envoyé à cette date</small>
            </div>
          </div>

          {/* Résumé et paiement */}
          <div className={styles.formSection}>
            <div className={styles.orderSummary}>
              <h2>Récapitulatif</h2>
              <div className={styles.summaryItem}>
                <span>Montant du bon cadeau</span>
                <strong>{formData.amount || '0'}€</strong>
              </div>
              {formData.deliveryMethod === 'postal' && (
                <div className={styles.summaryItem}>
                  <span>Frais de livraison</span>
                  <strong>5€</strong>
                </div>
              )}
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <strong>
                  {(parseFloat(formData.amount || 0) + (formData.deliveryMethod === 'postal' ? 5 : 0)).toFixed(2)}€
                </strong>
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate('/client/search')}
              className={styles.btnSecondary}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !formData.amount || parseFloat(formData.amount) < 20}
              style={{
                opacity: (!loading && formData.amount && parseFloat(formData.amount) >= 20) ? 1 : 0.5,
                cursor: (!loading && formData.amount && parseFloat(formData.amount) >= 20) ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Traitement...' : 'Procéder au paiement'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GiftVoucherPurchase;
