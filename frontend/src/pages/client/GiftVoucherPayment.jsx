import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripeAPI } from '../../services/api';
import styles from './ClientPages.module.css';

// Charger Stripe avec la clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, buyerEmail, recipientEmail, recipientName, message, clientColor }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', // Ne redirige que si nécessaire (3D Secure, etc.)
      });

      if (error) {
        setErrorMessage(error.message);
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
        navigate(`/client/gift-voucher/success?payment_intent=${paymentIntent.id}&payment_intent_client_secret=${paymentIntent.client_secret}&${params.toString()}`);
      }
    } catch (err) {
      console.error('Erreur lors de la confirmation du paiement:', err);
      setErrorMessage('Une erreur est survenue lors du paiement. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.paymentElement}>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className={styles.payButton}
        style={{
          backgroundColor: clientColor || '#4CAF50',
          opacity: (isLoading || !stripe || !elements) ? 0.6 : 1
        }}
      >
        {isLoading ? 'Traitement en cours...' : `Payer ${amount}€`}
      </button>

      <div className={styles.securePayment}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Paiement 100% sécurisé par Stripe</span>
      </div>
    </form>
  );
};

const GiftVoucherPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientColor, setClientColor] = useState('#4CAF50');

  // Récupérer les paramètres de l'URL
  const amount = parseFloat(searchParams.get('amount'));
  const buyerEmail = searchParams.get('buyerEmail');
  const recipientEmail = searchParams.get('recipientEmail') || null;
  const recipientName = searchParams.get('recipientName') || null;
  const message = searchParams.get('message') || null;
  const guideId = searchParams.get('guideId') || null;
  const teamName = searchParams.get('teamName') || null;

  useEffect(() => {
    // Récupérer la couleur personnalisée
    const urlParams = new URLSearchParams(window.location.search);
    const color = urlParams.get('color');
    if (color) {
      setClientColor(`#${color}`);
    }
  }, []);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Valider les paramètres requis
        if (!amount || !buyerEmail) {
          throw new Error('Paramètres manquants');
        }

        // Créer le Payment Intent
        const response = await stripeAPI.createGiftVoucherPaymentIntent({
          amount,
          buyerEmail,
          recipientEmail,
          recipientName,
          message,
          guideId,
          teamName
        });

        setClientSecret(response.data.clientSecret);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la création du Payment Intent:', err);
        setError(err.response?.data?.message || 'Une erreur est survenue lors de la préparation du paiement.');
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, buyerEmail, recipientEmail, recipientName, message, guideId, teamName]);

  if (loading) {
    return (
      <div className={styles.clientContainerIframe}>
        <div className={styles.paymentContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>Préparation du paiement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.clientContainerIframe}>
        <div className={styles.paymentContainer}>
          <div className={styles.errorMessage}>
            <h3>Erreur</h3>
            <p>{error}</p>
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
              className={styles.backButton}
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: clientColor,
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className={styles.clientContainerIframe}>
      <div className={styles.paymentContainer}>
        <h2 className={styles.paymentTitle}>Paiement du bon cadeau</h2>

        <div className={styles.paymentSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Montant du bon cadeau:</span>
            <span className={styles.summaryValue}>{amount.toFixed(2)}€</span>
          </div>

          {recipientName && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Destinataire:</span>
              <span className={styles.summaryValue}>{recipientName}</span>
            </div>
          )}

          {recipientEmail && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Email destinataire:</span>
              <span className={styles.summaryValue}>{recipientEmail}</span>
            </div>
          )}

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Votre email:</span>
            <span className={styles.summaryValue}>{buyerEmail}</span>
          </div>

          {message && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Message:</span>
              <span className={styles.summaryValue}>{message}</span>
            </div>
          )}

          <div className={styles.summaryTotal}>
            <span className={styles.summaryLabel}>Total à payer:</span>
            <span className={styles.summaryValue}>{amount.toFixed(2)}€</span>
          </div>
        </div>

        {clientSecret && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              amount={amount}
              buyerEmail={buyerEmail}
              recipientEmail={recipientEmail}
              recipientName={recipientName}
              message={message}
              clientColor={clientColor}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default GiftVoucherPayment;
