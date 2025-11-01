import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stripeAPI, settingsAPI } from '../../services/api';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';


const GiftVoucherPurchase = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clientColor, setClientColor] = useState(() => {
    return localStorage.getItem('clientThemeColor') || '#3498db';
  });

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

  useEffect(() => {
    const loadClientColor = async () => {
      try {
        const response = await settingsAPI.get();
        const settings = response.data.settings;
        if (settings?.clientButtonColor) {
          setClientColor(settings.clientButtonColor);
          localStorage.setItem('clientThemeColor', settings.clientButtonColor);
        }
      } catch (error) {
        console.error('Erreur chargement couleur client:', error);
      }
    };
    loadClientColor();
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculer le montant total (bon cadeau + frais de livraison si applicable)
      const voucherAmount = parseFloat(formData.amount);
      const deliveryFee = formData.deliveryMethod === 'postal' ? 5 : 0;
      const totalAmount = voucherAmount + deliveryFee;

      // Préparer les données pour l'API
      const recipientName = formData.recipientFirstName && formData.recipientLastName
        ? `${formData.recipientFirstName} ${formData.recipientLastName}`
        : '';

      const paymentData = {
        amount: totalAmount,
        buyerEmail: formData.buyerEmail,
        recipientEmail: formData.recipientEmail || null,
        recipientName: recipientName || null,
        message: formData.personalMessage || null
      };

      // Créer la session de paiement Stripe
      const response = await stripeAPI.createGiftVoucherCheckout(paymentData);

      if (response.data.success && response.data.url) {
        // Rediriger vers Stripe pour le paiement
        window.location.href = response.data.url;
      } else {
        throw new Error('Impossible de créer la session de paiement');
      }
    } catch (error) {
      console.error('Erreur création bon cadeau:', error);
      alert(t('ErreurSessionPayment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.clientContainer}>
      {/* Styles globaux pour les éléments avec effets bleus */}
      <style>
        {`
          .${styles.voucherTypeCard}:hover {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
          .${styles.voucherTypeCard}.active {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
          .${styles.amountOption}:hover {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
          .${styles.amountOption}.active {
            border-color: ${clientColor} !important;
            background: ${clientColor} !important;
          }
          .${styles.formGroup} input:focus,
          .${styles.formGroup} select:focus {
            border-color: ${clientColor} !important;
            box-shadow: 0 0 0 3px ${clientColor}20 !important;
          }
          .${styles.radioOption}:hover {
            background: ${clientColor}15 !important;
            border-color: ${clientColor} !important;
          }
          .${styles.voucherCodeBox} {
            background: ${clientColor}15 !important;
            border-color: ${clientColor} !important;
          }
          .${styles.loader} {
            border-top-color: ${clientColor} !important;
          }
        `}
      </style>
      <div className={styles.searchHeader}>
        <button
          onClick={() => navigate('/client/search')}
          className={styles.btnSecondary}
          style={{ marginBottom: '1rem' }}
        >
          ← {t('RetourSearch')}
        </button>
        <h1>🎁 {t('achatGift')}</h1>
        <p>{t('GiftExp')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.giftVoucherForm}>

          {/* Montant ou activité */}
          <div className={styles.formSection}>
            {formData.voucherType === 'amount' ? (
              <>
                <h2>{t('MontantBon')}</h2>
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
                  <label>{t('MontantPerso')}</label>
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
                <h2>{t('ChooseActivity')}</h2>
                <select
                  value={formData.selectedProduct}
                  onChange={(e) => handleChange('selectedProduct', e.target.value)}
                  required
                >
                  <option value="">{t('SelectCanyon')}</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.priceIndividual}€/pers
                    </option>
                  ))}
                </select>
                <div className={styles.quantitySelector}>
                  <label>{t('NbrParticipants')}</label>
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
            <h2>{t('yoursInfos')}</h2>
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
                <label>{t('Nom')} *</label>
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
                <label>{t('Téléphone')} *</label>
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
            <h2>{t('BeneficiaireGift')}</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>{t('Prénom')}</label>
                <input
                  type="text"
                  value={formData.recipientFirstName}
                  onChange={(e) => handleChange('recipientFirstName', e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('Nom')}</label>
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
              <label>{t('MessagePerso')}</label>
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
            <h2>{t('ModeLivraison')}</h2>
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
                  <strong>{t('emailFree')}</strong>
                  <p>{t('LivraisonImmediate')}</p>
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
                  <strong>{t('Courrier')} (+5€)</strong>
                  <p>{t('CartePhysique')}</p>
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>{t('DateSend')}</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleChange('deliveryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <small>{t('BonEnvoyerDate')}</small>
            </div>
          </div>

          {/* Résumé et paiement */}
          <div className={styles.formSection}>
            <div className={styles.orderSummary}>
              <h2>{t('Récapitulatif')}</h2>
              <div className={styles.summaryItem}>
                <span>{t('MontantBon')}</span>
                <strong>{formData.amount || '0'}€</strong>
              </div>
              {formData.deliveryMethod === 'postal' && (
                <div className={styles.summaryItem}>
                  <span>{t('FraisLivraison')}</span>
                  <strong>5€</strong>
                </div>
              )}
              <div className={styles.summaryTotal}>
                <span>{t('Total')}</span>
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
              {t('Annuler')}
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
              {loading ? t('payment.processing') : t('payment.proceed')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GiftVoucherPurchase;
