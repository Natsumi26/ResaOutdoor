import { useNavigate } from 'react-router-dom';
import styles from './PaymentSuccess.module.css';

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleGoToCalendar = () => {
    navigate('/calendar');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconError}>⚠️</div>
        <h1 style={{ color: '#f59e0b' }}>Paiement annulé</h1>
        <p className={styles.subtitle}>
          Vous avez annulé le processus de paiement
        </p>

        <div className={styles.infoBox} style={{ background: '#fef3c7', borderColor: '#f59e0b' }}>
          <p style={{ color: '#92400e' }}>
            💡 Votre réservation est toujours active mais n'est pas encore payée.
          </p>
          <p style={{ color: '#92400e' }}>
            Vous pouvez effectuer le paiement plus tard depuis le calendrier.
          </p>
        </div>

        <button className={styles.btn} onClick={handleGoToCalendar}>
          Retour au calendrier
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
