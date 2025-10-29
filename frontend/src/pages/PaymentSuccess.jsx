import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeAPI } from '../services/api';
import styles from './PaymentSuccess.module.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;


  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Session ID manquant');
      setLoading(false);
      return;
    }

    try {
      // Utiliser la nouvelle route pour les paiements de réservation
      const response = await stripeAPI.verifyBookingPayment(sessionId);

      if (response.data.paid) {
        if (response.data.pending) {
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              verifyPayment();
            }, 2000);
          } else {
            setError("La réservation est toujours en attente. Veuillez contacter le guide.");
          }
          return;
        }

         // Réservation créée
        setPaymentInfo(response.data);

        // Rediriger automatiquement vers la confirmation après 2 secondes
        if (response.data.bookingId) {
          setTimeout(() => {
            navigate(`/client/booking-confirmation/${response.data.bookingId}`);
          }, 2000);
        }
      } else {
        setError('Paiement non confirmé');
      }
    } catch (err) {
      console.error('Erreur vérification paiement:', err);
      setError('Impossible de vérifier le paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCalendar = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner}></div>
          <h2>Vérification du paiement...</h2>
          <p>Veuillez patienter quelques instants</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconError}>❌</div>
          <h2>Erreur</h2>
          <p>{error}</p>
          <button className={styles.btn}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconSuccess}>✅</div>
        <h1>Paiement réussi !</h1>
        <p className={styles.subtitle}>
          Votre paiement a été traité avec succès
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Montant payé :</span>
            <span className={styles.value}>{paymentInfo?.amount}€</span>
          </div>
        </div>

        <div className={styles.infoBox}>
          <p>
            📧 Un email de confirmation vous a été envoyé.
          </p>
          <p>
            💳 Le paiement a été enregistré et votre réservation a été mise à jour.
          </p>
          <p>
            🔄 Vous allez être redirigé vers votre réservation dans quelques secondes...
          </p>
        </div>

        <button
          className={styles.btn}
          onClick={() => paymentInfo?.bookingId && navigate(`/client/booking-confirmation/${paymentInfo.bookingId}`)}
        >
          Voir la confirmation
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
