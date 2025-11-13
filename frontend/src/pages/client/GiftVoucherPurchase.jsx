import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { stripeAPI, settingsAPI } from '../../services/api';
import { Trans, useTranslation } from 'react-i18next';
import GiftVoucherPreview from '../../components/GiftVoucherPreview';
import modalStyles from '../../components/GiftVoucherModal.module.css';

const GiftVoucherPurchase = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryParams = new URLSearchParams(location.search);
  const colorFromUrl = queryParams.get('color');

  const [clientColor, setClientColor] = useState(() => {
    return colorFromUrl || localStorage.getItem('clientThemeColor') || '#3498db';
  });

  const [formData, setFormData] = useState({
    buyerFirstName: '',
    buyerLastName: '',
    buyerEmail: '',
    buyerPhone: '',
    recipientFirstName: '',
    recipientLastName: '',
    recipientEmail: '',
    personalMessage: '',
    voucherType: 'amount',
    amount: '',
    selectedProduct: '',
    quantity: 1
  });

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [guideSettings, setGuideSettings] = useState({
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    logo: '',
    slogan: ''
  });

  const amountOptions = [50, 75, 100, 150, 200];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.get();
        const settings = response.data.settings;

        // Priorité à la couleur de l'URL, sinon celle des settings
        if (colorFromUrl) {
          localStorage.setItem('clientThemeColor', colorFromUrl);
        } else if (settings?.clientButtonColor) {
          setClientColor(settings.clientButtonColor);
          localStorage.setItem('clientThemeColor', settings.clientButtonColor);
        }

        if (settings) {
          setGuideSettings({
            companyName: settings.companyName || 'Canyon Life',
            companyPhone: settings.companyPhone || '',
            companyEmail: settings.companyEmail || '',
            companyWebsite: settings.website || '',
            logo: settings.logo || '',
            slogan: settings.slogan || 'Pour une sortie exceptionnelle'
          });
        }
      } catch (error) {
        console.error('Erreur chargement settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleClose = () => {
    const params = new URLSearchParams();
    const guideId = searchParams.get('guideId');
    const teamName = searchParams.get('teamName');

    if (guideId) params.set('guideId', guideId);
    if (teamName) params.set('teamName', teamName);
    const color = searchParams.get('color');
    if (color) params.set('color', color);
    navigate(`/client/search?${params.toString()}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = parseFloat(formData.amount);

      const recipientName = formData.recipientFirstName && formData.recipientLastName
        ? `${formData.recipientFirstName} ${formData.recipientLastName}`
        : '';

      // Construire l'URL avec les paramètres
      const urlParams = new URLSearchParams(window.location.search);
      const color = urlParams.get('color');
      const guideId = urlParams.get('guideId');
      const teamName = urlParams.get('teamName');

      const paymentUrl = new URL('/client/gift-voucher/payment', window.location.origin);
      paymentUrl.searchParams.set('amount', totalAmount.toString());
      paymentUrl.searchParams.set('buyerEmail', formData.buyerEmail);

      if (formData.recipientEmail) {
        paymentUrl.searchParams.set('recipientEmail', formData.recipientEmail);
      }
      if (recipientName) {
        paymentUrl.searchParams.set('recipientName', recipientName);
      }
      if (formData.personalMessage) {
        paymentUrl.searchParams.set('message', formData.personalMessage);
      }
      if (color) {
        paymentUrl.searchParams.set('color', color);
      }
      if (guideId) {
        paymentUrl.searchParams.set('guideId', guideId);
      }
      if (teamName) {
        paymentUrl.searchParams.set('teamName', teamName);
      }

      // Rediriger vers la page de paiement
      navigate(paymentUrl.pathname + paymentUrl.search);
    } catch (error) {
      console.error('Erreur création bon cadeau:', error);
      alert(t('ErreurSessionPayment'));
      setLoading(false);
    }
  };

  return (
    <div className={modalStyles.modalOverlay} onClick={handleClose}>
      <style>
        {`
          .${modalStyles.modal} input:-webkit-autofill,
          .${modalStyles.modal} input:-webkit-autofill:hover,
          .${modalStyles.modal} input:-webkit-autofill:focus,
          .${modalStyles.modal} input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #495057 !important;
          }
          .${modalStyles.modal} input:-webkit-autofill {
            border-color: ${clientColor} !important;
          }
          .amountOption {
            padding: 1rem !important;
            background: #f8f9fa !important;
            border: 2px solid #dee2e6 !important;
            border-radius: 8px !important;
            font-size: 1.5rem !important;
            font-weight: bold !important;
            color: #2c3e50 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          }
          .amountOption:hover {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
          .amountOption.active {
            border-color: ${clientColor} !important;
            background: ${clientColor} !important;
            color: white !important;
          }
        `}
      </style>

      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={modalStyles.closeButton} onClick={handleClose} title="Fermer">
          ✕
        </button>

        <GiftVoucherPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          amount={formData.amount}
          buyerName={formData.buyerFirstName && formData.buyerLastName ? `${formData.buyerFirstName} ${formData.buyerLastName}` : ''}
          recipientName={formData.recipientFirstName && formData.recipientLastName ? `${formData.recipientFirstName} ${formData.recipientLastName}` : ''}
          personalMessage={formData.personalMessage}
          companyName={guideSettings.companyName}
          companyPhone={guideSettings.companyPhone}
          companyEmail={guideSettings.companyEmail}
          companyWebsite={guideSettings.companyWebsite}
          logo={guideSettings.logo}
          slogan={guideSettings.slogan}
          themeColor={clientColor}
        />

        <div className={modalStyles.modalContent}>
          <div className={modalStyles.header}>
            <h1>🎁 {t('achatGift')}</h1>
            <p>{t('GiftExp')}</p>
          </div>

          <form onSubmit={handleSubmit} className={modalStyles.giftVoucherForm}>
            {/* Montant */}
            <div className={modalStyles.formSection}>
              <h2>{t('MontantBon')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {amountOptions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="amountOption"
                    onClick={() => handleChange('amount', amount.toString())}
                    style={formData.amount === amount.toString() ? {
                      borderColor: clientColor,
                      backgroundColor: clientColor,
                      color: 'white'
                    } : {}}
                  >
                    {amount}€
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: '200px', width: '100%' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    {t('MontantPerso')}
                  </label>
                  <input
                    key={i18n.language}
                    type="number"
                    min="20"
                    placeholder={t('gift.amountPlaceholder')}
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    required
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Infos Acheteur & Bénéficiaire */}
            <div className={modalStyles.buyerInfo}>
              <div className={modalStyles.formSection}>
                <h2>{t('yoursInfos')}</h2>
                <div className={modalStyles.formGroup}>
                  <label>{t('Prénom')} *</label>
                  <input
                    type="text"
                    value={formData.buyerFirstName}
                    onChange={(e) => handleChange('buyerFirstName', e.target.value)}
                    required
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>{t('Nom')} *</label>
                  <input
                    type="text"
                    value={formData.buyerLastName}
                    onChange={(e) => handleChange('buyerLastName', e.target.value)}
                    required
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.buyerEmail}
                    onChange={(e) => handleChange('buyerEmail', e.target.value)}
                    required
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>{t('Téléphone')} *</label>
                  <input
                    type="tel"
                    value={formData.buyerPhone}
                    onChange={(e) => handleChange('buyerPhone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={modalStyles.formSection}>
                <h2>{t('BeneficiaireGift')}</h2>
                <div className={modalStyles.formGroup}>
                  <label>{t('Prénom')}</label>
                  <input
                    type="text"
                    value={formData.recipientFirstName}
                    onChange={(e) => handleChange('recipientFirstName', e.target.value)}
                    placeholder={t('form.optional')}
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>{t('Nom')}</label>
                  <input
                    type="text"
                    value={formData.recipientLastName}
                    onChange={(e) => handleChange('recipientLastName', e.target.value)}
                    placeholder={t('form.optional')}
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>Email</label>
                  <input
                    type="text"
                    value={formData.recipientEmail}
                    onChange={(e) => handleChange('recipientEmail', e.target.value)}
                    placeholder={t('form.optional')}
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>{t('MessagePerso')}</label>
                  <textarea
                    value={formData.personalMessage}
                    onChange={(e) => handleChange('personalMessage', e.target.value)}
                    placeholder={t('gift.personalMessagePlaceholder')}
                    rows="4"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className={modalStyles.formSection} style={{ backgroundColor: `${clientColor}08`, borderLeft: `3px solid ${clientColor}` }}>
              <p style={{ margin: '0', lineHeight: '1.6', fontSize: '0.9rem', color: '#333' }}>
                <Trans i18nKey="gift.email" values={{
                  label: t('gift.emailLabel'),
                  description: t('gift.emailDescription')
                }}
                components={{ strong: <strong /> }}
                >
                </Trans>
              </p>
            </div>

            {/* Buttons */}
            <div className={modalStyles.formActions}>
              <button
                type="button"
                onClick={handleClose}
                className={modalStyles.btnSecondary}
              >
                {t('Annuler')}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!formData.amount || parseFloat(formData.amount) < 20}
                style={{
                  backgroundColor: 'white',
                  color: clientColor,
                  border: `2px solid ${clientColor}`,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: (!formData.amount || parseFloat(formData.amount) < 20) ? 'not-allowed' : 'pointer',
                  opacity: (!formData.amount || parseFloat(formData.amount) < 20) ? 0.5 : 1
                }}
              >
                👁️ {showPreview ? t('common.hidePreview') : t('common.showPreview')}
              </button>
              <button
                type="submit"
                className={modalStyles.btnPrimary}
                disabled={loading || !formData.amount || parseFloat(formData.amount) < 20}
                style={{
                  backgroundColor: clientColor,
                  opacity: (!loading && formData.amount && parseFloat(formData.amount) >= 20) ? 1 : 0.5,
                  cursor: (!loading && formData.amount && parseFloat(formData.amount) >= 20) ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? t('payment.processing') : `${t('payment.proceed')} - ${formData.amount || '0'}€`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GiftVoucherPurchase;
