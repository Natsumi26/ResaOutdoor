import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeAPI } from '../../services/api';
import styles from './ClientPages.module.css';
import { Trans, useTranslation } from 'react-i18next';


const GiftVoucherSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Session invalide');
      setLoading(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 10; // Réessayer jusqu'à 10 fois

    const verifyPayment = async () => {
      try {
        console.log(sessionId)
        const response = await stripeAPI.verifyGiftVoucherPayment(sessionId);

        if (response.data.paid && response.data.voucher) {
          setVoucher(response.data.voucher);
          setLoading(false);
        } else if (response.data.pending) {
          // Le bon cadeau n'a pas encore été créé, réessayer dans quelques secondes
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(() => {
              verifyPayment();
            }, 2000);
          } else {
            setError('Le bon cadeau prend plus de temps que prévu à être créé. Veuillez vérifier vos emails ou contacter le support.');
            setLoading(false);
          }
        } else {
          setError('Le paiement n\'a pas été confirmé');
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
        setError('Une erreur est survenue lors de la vérification du paiement');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const copyToClipboard = () => {
    if (voucher?.code) {
      navigator.clipboard.writeText(voucher.code);
      alert(t('alerts.CopyPressPapier'));
    }
  };

  if (loading) {
    return (
      <div className={styles.clientContainer}>
        <div className={styles.searchHeader}>
          <h1>{t('VerifPayement')}</h1>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className={styles.loader}></div>
            <p>{t('PatientCreationGift')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.clientContainer}>
        <div className={styles.searchHeader}>
          <h1>{t('Erreur')}</h1>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'red' }}>{error}</p>
            <button
              onClick={() => navigate('/client/gift-voucher')}
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
    <div className={styles.clientContainer}>
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
            onClick={() => navigate('/client/search')}
            className={styles.btnPrimary}
          >
            {t('SaveActivity')}
          </button>
          <button
            onClick={() => navigate('/client/gift-voucher')}
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
