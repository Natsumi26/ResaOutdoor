import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { stripeAPI, settingsAPI } from '../../services/api';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Vérification du paiement...');
  const [bookingId, setBookingId] = useState(null);
  const [clientColor, setClientColor] = useState('#3498db');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 20; // 20 tentatives = 20 secondes max

  useEffect(() => {
    loadSettings();
    verifyPayment();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;
      if (settings?.clientButtonColor) {
        setClientColor(settings.clientButtonColor);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    }
  };

  const verifyPayment = async () => {
    try {
      const stripe = await stripePromise;
      const clientSecret = searchParams.get('payment_intent_client_secret');

      if (!clientSecret) {
        setStatus('error');
        setMessage('Paramètres de paiement manquants.');
        return;
      }

      // Récupérer le Payment Intent
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (paymentIntent.status === 'succeeded') {
        setMessage('Paiement réussi ! Recherche de votre réservation...');

        // Attendre que le webhook crée la réservation
        pollForBooking(paymentIntent.id);
      } else if (paymentIntent.status === 'processing') {
        setMessage('Votre paiement est en cours de traitement...');
        // Réessayer dans 2 secondes
        setTimeout(() => verifyPayment(), 2000);
      } else {
        setStatus('error');
        setMessage('Le paiement n\'a pas abouti. Veuillez contacter le support.');
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      setStatus('error');
      setMessage('Erreur lors de la vérification du paiement.');
    }
  };

  const pollForBooking = async (paymentIntentId) => {
    try {
      // Essayer de trouver la réservation créée par le webhook via le Payment Intent ID
      const response = await stripeAPI.getBookingByPaymentIntent(paymentIntentId);

      if (response.data.found && response.data.booking) {
        // Réservation trouvée !
        const booking = response.data.booking;
        setBookingId(booking.id);
        setStatus('success');
        setMessage('Réservation confirmée ! Redirection...');

        // Rediriger vers la page de confirmation
        setTimeout(() => {
          navigate(`/client/booking-confirmation/${booking.id}`);
        }, 1500);
      } else {
        // Pas encore trouvée, réessayer
        if (attempts < maxAttempts) {
          setAttempts(attempts + 1);
          setTimeout(() => pollForBooking(paymentIntentId), 1000); // Réessayer dans 1 seconde
        } else {
          // Trop de tentatives, montrer un message d'erreur
          setStatus('error');
          setMessage('La création de votre réservation prend plus de temps que prévu. Vous recevrez un email de confirmation sous peu. Si vous ne le recevez pas, contactez-nous.');
        }
      }
    } catch (error) {
      console.error('Erreur recherche réservation:', error);

      // Réessayer
      if (attempts < maxAttempts) {
        setAttempts(attempts + 1);
        setTimeout(() => pollForBooking(paymentIntentId), 1000);
      } else {
        setStatus('error');
        setMessage('Impossible de récupérer votre réservation. Vous recevrez un email de confirmation. Si ce n\'est pas le cas, contactez-nous.');
      }
    }
  };

  return (
    <div className={styles.clientContainerIframe}>
      <div className={styles.paymentContainer}>
        {status === 'loading' && (
          <>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
            <h2 style={{ textAlign: 'center', color: '#2c3e50', marginTop: '1rem' }}>
              {message}
            </h2>
            <p style={{ textAlign: 'center', color: '#6c757d', marginTop: '0.5rem' }}>
              {t('common.pleaseWait')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ textAlign: 'center', fontSize: '4rem', color: clientColor }}>
              ✓
            </div>
            <h2 style={{ textAlign: 'center', color: '#28a745', marginTop: '1rem' }}>
              {message}
            </h2>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ textAlign: 'center', fontSize: '4rem', color: '#dc3545' }}>
              ✕
            </div>
            <h2 style={{ textAlign: 'center', color: '#dc3545', marginTop: '1rem' }}>
              Erreur
            </h2>
            <p style={{ textAlign: 'center', color: '#6c757d', marginTop: '0.5rem' }}>
              {message}
            </p>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => navigate('/client/search')}
                className={styles.btn}
                style={{ backgroundColor: clientColor }}
              >
                {t('RetourSearch')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
