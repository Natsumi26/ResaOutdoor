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
    quantity: 1
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
      // Calculer le montant total du bon cadeau
      const totalAmount = parseFloat(formData.amount);

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
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
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
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          e.target.style.background = 'white';
        }}
        title="Retour"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.searchHeader}>
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
                <div className={styles.customAmount} style={{ maxWidth: '300px', margin: '1.5rem auto', textAlign: 'center' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem' }}>{t('MontantPerso')}</label>
                  <input
                    type="number"
                    min="20"
                    placeholder="Montant en €"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    required
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', width: '100%' }}
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

          {/* Informations de l'acheteur et du bénéficiaire en 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div className={styles.formSection}>
              <h2>{t('yoursInfos')}</h2>
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

            <div className={styles.formSection}>
              <h2>{t('BeneficiaireGift')}</h2>
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
          </div>

          {/* Info mémo */}
          <div className={styles.formSection} style={{ backgroundColor: '#f0f8ff', borderLeft: `4px solid ${clientColor}` }}>
            <p style={{ margin: '0', lineHeight: '1.6', color: '#333' }}>
              <strong>📧 Bon cadeau par email :</strong> Une fois le paiement validé, vous reçevez un email contenant le bon cadeau en version imprimable et personnalisé. Le bon peut être utilisé en une ou plusieurs fois directement sur le site.
            </p>
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
              {loading ? t('payment.processing') : `${t('payment.proceed')} - ${formData.amount || '0'}€`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GiftVoucherPurchase;
