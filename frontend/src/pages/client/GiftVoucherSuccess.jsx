import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { stripeAPI } from '../../services/api';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const GiftVoucherSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(t('VerifPayement'));

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const stripe = await stripePromise;
      const clientSecret = searchParams.get('payment_intent_client_secret');

      if (!clientSecret) {
        setStatus('error');
        setError('Paramètres de paiement manquants.');
        setLoading(false);
        return;
      }

      // Récupérer le Payment Intent
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (paymentIntent.status === 'succeeded') {
        setMessage(t('PaySuccess') || 'Paiement réussi ! Recherche de votre bon cadeau...');

        // Attendre que le webhook crée le bon cadeau
        pollForGiftVoucher(paymentIntent.id, 0);
      } else if (paymentIntent.status === 'processing') {
        setMessage('Votre paiement est en cours de traitement...');
        // Réessayer dans 2 secondes
        setTimeout(() => verifyPayment(), 2000);
      } else {
        setStatus('error');
        setError('Le paiement n\'a pas abouti. Veuillez contacter le support.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erreur vérification paiement:', err);
      setStatus('error');
      setError('Erreur lors de la vérification du paiement.');
      setLoading(false);
    }
  };

  const pollForGiftVoucher = async (paymentIntentId, currentAttempt) => {
    const maxAttempts = 30; // 30 secondes max

    try {
      console.log(`Tentative ${currentAttempt + 1}/${maxAttempts} - Recherche bon cadeau...`);

      // Essayer de trouver le bon cadeau créé par le webhook via le Payment Intent ID
      const response = await stripeAPI.getGiftVoucherByPaymentIntent(paymentIntentId);

      if (response.data.found && response.data.voucher) {
        // Bon cadeau trouvé !
        console.log('Bon cadeau trouvé:', response.data.voucher);
        setVoucher(response.data.voucher);
        setStatus('success');
        setLoading(false);
      } else {
        // Pas encore trouvé, réessayer
        if (currentAttempt < maxAttempts - 1) {
          setTimeout(() => pollForGiftVoucher(paymentIntentId, currentAttempt + 1), 1000); // Réessayer dans 1 seconde
        } else {
          // Trop de tentatives
          console.log('Trop de tentatives, abandon');
          setStatus('error');
          setError('La création de votre bon cadeau prend plus de temps que prévu. Vous recevrez un email de confirmation sous peu.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Erreur recherche bon cadeau:', err);

      // Réessayer
      if (currentAttempt < maxAttempts - 1) {
        setTimeout(() => pollForGiftVoucher(paymentIntentId, currentAttempt + 1), 1000);
      } else {
        setStatus('error');
        setError('Impossible de récupérer votre bon cadeau. Vous recevrez un email de confirmation.');
        setLoading(false);
      }
    }
  };

  const copyToClipboard = () => {
    if (voucher?.code) {
      navigator.clipboard.writeText(voucher.code);
      alert(t('alerts.CopyPressPapier'));
    }
  };

  if (loading) {
    return (
      <div className={styles.clientContainerIframe}>
        <div className={styles.searchHeader}>
          <h1>{t('VerifPayement')}</h1>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.clientContainerIframe}>
        <div className={styles.searchHeader}>
          <h1>{t('Erreur')}</h1>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'red' }}>{error}</p>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                const guideId = searchParams.get('guideId');
                const teamName = searchParams.get('teamName');

                if (guideId) params.set('guideId', guideId);
                if (teamName) params.set('teamName', teamName);
                const color = searchParams.get('color');
                if (color) params.set('color', color);
              navigate(`/client/gift-voucher?${params.toString()}`);
            }}
              className={styles.btnPrimary}
              style={{ marginTop: '1rem' }}
            >
              {t('Réessayer')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.clientContainerIframe}>
      <div className={styles.searchHeader}>
        <h1>{t('PaySuccess')}</h1>
        <p>{t('CreateGiftSuccess')}</p>
      </div>

      <div className={styles.successCard}>
        <div className={styles.successIcon}>🎉</div>

        <h2>{t('ThanksAchat')}</h2>
        <p>{t('UseGift')}</p>

        <div className={styles.voucherCodeBox}>
          <label>{t('GiftCode')}</label>
          <div className={styles.codeDisplay}>
            <span className={styles.code}>{voucher?.code}</span>
            <button
              onClick={copyToClipboard}
              className={styles.btnSecondary}
              style={{ marginLeft: '1rem' }}
            >
              {t('Copier')}
            </button>
          </div>
        </div>

        <div className={styles.voucherDetails}>
          <div className={styles.detailItem}>
            <span>{t('Montant')}</span>
            <strong>{voucher?.amount}€</strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t('Validite')}</span>
            <strong>
              {voucher?.expiresAt
                ? new Date(voucher.expiresAt).toLocaleDateString('fr-FR')
                : 'Indéfini'}
            </strong>
          </div>
        </div>

        <div className={styles.infoBox}>
          <h3>{t('HowUseGift')}</h3>
          <ol>
            <li>{t('RDVSearchActivity')}</li>
            <li>{t('SelectAndCreate')}</li>
            <li>{t('PaiementWhithCode')}</li>
            <li>{t('MontantDeduit')}</li>
          </ol>
        </div>

        <div className={styles.formActions}>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              const guideId = searchParams.get('guideId');
              const teamName = searchParams.get('teamName');

              if (guideId) params.set('guideId', guideId);
              if (teamName) params.set('teamName', teamName);
              const color = searchParams.get('color');
              if (color) params.set('color', color);
              navigate(`/client/search?${params.toString()}`)}}
            className={styles.btnPrimary}
          >
            {t('SaveActivity')}
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              const guideId = searchParams.get('guideId');
                const teamName = searchParams.get('teamName');

                if (guideId) params.set('guideId', guideId);
                if (teamName) params.set('teamName', teamName);
                const color = searchParams.get('color');
                if (color) params.set('color', color);
              navigate(`/client/gift-voucher?${params.toString()}`);
            }}
            className={styles.btnSecondary}
          >
            {t('BuyOtherBon')}
          </button>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <small style={{ color: '#6c757d' }}>
            {t('MailCode')}
          </small>
        </div>
      </div>
    </div>
  );
};

export default GiftVoucherSuccess;
