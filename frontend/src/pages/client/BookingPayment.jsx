import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { stripeAPI } from '../../services/api';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

// Charger Stripe avec la clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ sessionId, productId, bookingData, amountDue, participants, payFullAmount, clientColor }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage(t('payment.succeeded') || 'Paiement réussi !');
          // Rediriger vers la confirmation après un court délai
          setTimeout(() => {
            // Récupérer l'ID de réservation depuis les métadonnées ou l'API
            const params = new URLSearchParams();
            const guideId = searchParams.get('guideId');
            const teamName = searchParams.get('teamName');

            if (guideId) params.set('guideId', guideId);
            if (teamName) params.set('teamName', teamName);
            const color = searchParams.get('color');
            if (color) params.set('color', color);
            navigate(`/client/booking-confirmation/${paymentIntent.metadata.bookingId}?${params.toString()}`);
          }, 2000);
          break;
        case 'processing':
          setMessage(t('payment.processing') || 'Traitement en cours...');
          break;
        case 'requires_payment_method':
          setMessage(t('payment.failed') || 'Le paiement a échoué. Veuillez réessayer.');
          break;
        default:
          setMessage(t('payment.unexpected') || 'Une erreur inattendue s\'est produite.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Ne redirige que si nécessaire (3D Secure, etc.)
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message);
      } else {
        setMessage(t('payment.unexpected') || 'Une erreur inattendue s\'est produite.');
      }
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Paiement réussi, naviguer vers la page de succès SANS sortir de l'iframe
      const params = new URLSearchParams();
      const guideId = searchParams.get('guideId');
      const teamName = searchParams.get('teamName');

      if (guideId) params.set('guideId', guideId);
      if (teamName) params.set('teamName', teamName);
      const color = searchParams.get('color');
      if (color) params.set('color', color);
      navigate(`/client/payment-confirmation?payment_intent=${paymentIntent.id}&payment_intent_client_secret=${paymentIntent.client_secret}&${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <PaymentElement />

      <button
        disabled={isLoading || !stripe || !elements}
        className={styles.payButton}
        style={{ backgroundColor: clientColor, borderColor: clientColor }}
      >
        <span>
          {isLoading ? (t('payment.processing') || 'Traitement...') : (t('payment.payNow') || 'Payer maintenant')}
        </span>
      </button>

      {message && <div className={styles.paymentMessage}>{message}</div>}
    </form>
  );
};

const BookingPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amountToPay, setAmountToPay] = useState(0);
  const [isDeposit, setIsDeposit] = useState(false);

  // Récupérer les paramètres de l'URL
  const sessionId = searchParams.get('sessionId');
  const productId = searchParams.get('productId');
  const bookingData = searchParams.get('bookingData') ? JSON.parse(decodeURIComponent(searchParams.get('bookingData'))) : null;
  const amountDue = parseFloat(searchParams.get('amountDue'));
  const participants = searchParams.get('participants') ? JSON.parse(decodeURIComponent(searchParams.get('participants'))) : null;
  const payFullAmount = searchParams.get('payFullAmount') === 'true';
  const colorFromUrl = searchParams.get('color');
  const clientColor = colorFromUrl || localStorage.getItem('clientThemeColor') || '#3498db';

  useEffect(() => {
    if (colorFromUrl) {
      localStorage.setItem('clientThemeColor', colorFromUrl);
    }
  }, [colorFromUrl]);

  useEffect(() => {
    if (!sessionId || !productId || !bookingData || !amountDue) {
      setError('Paramètres manquants');
      setLoading(false);
      return;
    }

    createPaymentIntent();
  }, [sessionId, productId]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await stripeAPI.createPaymentIntent({
        sessionId,
        productId,
        bookingData,
        amountDue,
        participants,
        payFullAmount
      });
      
      setClientSecret(response.data.clientSecret);
      setAmountToPay(response.data.amountToPay);
      setIsDeposit(response.data.isDeposit);
      setLoading(false);
    } catch (error) {
      console.error('Erreur création Payment Intent:', error);
      setError(error.response?.data?.error || 'Erreur lors de la création du paiement');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.searchPageContainerIframe}>
        <div className={styles.loading}>
          {t('loading') || 'Chargement...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.searchPageContainerIframe}>
        <div className={styles.errorBox}>
          <h2>{t('error') || 'Erreur'}</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            {t('Retour') || 'Retour'}
          </button>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: clientColor,
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    
    <div className={styles.searchPageContainerIframe}>
      {/* Bouton retour */}
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

      <div className={styles.paymentContainer}>
        <h1>{t('payment.title') || 'Paiement'}</h1>

        <div className={styles.paymentSummary}>
          <h2>{t('Récapitulatif') || 'Récapitulatif'}</h2>
          <div className={styles.summaryLine}>
            <span>{t('Montant') || 'Montant'} {isDeposit ? `(${t('payment.deposit') || 'Acompte'})` : ''}:</span>
            <strong>{amountToPay.toFixed(2)}€</strong>
          </div>
          {bookingData && (
            <>
              <div className={styles.summaryLine}>
                <span>{t('payment.participants') || 'Participants'}:</span>
                <span>{bookingData.numberOfPeople}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>{t('payment.client') || 'Client'}:</span>
                <span>{bookingData.clientFirstName} {bookingData.clientLastName}</span>
              </div>
            </>
          )}
        </div>

        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm
              sessionId={sessionId}
              productId={productId}
              bookingData={bookingData}
              amountDue={amountDue}
              participants={participants}
              payFullAmount={payFullAmount}
              clientColor={clientColor}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default BookingPayment;
