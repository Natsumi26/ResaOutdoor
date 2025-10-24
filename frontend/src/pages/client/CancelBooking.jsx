import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const CancelBooking = () => {
  const { t } = useTranslation();
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getById(bookingId);
      const bookingData = response.data.booking;

      setBooking(bookingData);

      // Vérifier si la réservation peut être annulée
      if (bookingData.status === 'cancelled') {
        setError('Cette réservation a déjà été annulée');
      }

      // Calculer la politique d'annulation
      const sessionDate = new Date(bookingData.session.date);
      const now = new Date();
      const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);

      let refundPercentage = 0;
      let refundPolicy = '';

      if (hoursUntilSession >= 48) {
        refundPercentage = 100;
        refundPolicy = t('refundPolicyFull');
      } else if (hoursUntilSession >= 24) {
        refundPercentage = 50;
        refundPolicy = t('refundPolicy50');
      } else {
        refundPercentage = 0;
        refundPolicy = t('refundPolicyNull');
      }

      const refundAmount = (bookingData.amountPaid * refundPercentage) / 100;

      setCancellationPolicy({
        refundPercentage,
        refundAmount,
        policy: refundPolicy,
        hoursUntilSession: Math.round(hoursUntilSession)
      });

    } catch (error) {
      console.error('Erreur chargement réservation:', error);
      setError('Impossible de charger la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(t('WindowConfirmCancell'))) {
      return;
    }

    try {
      setCancelling(true);
      setError('');

      const response = await bookingsAPI.cancel(bookingId, { reason });

      setCancellationPolicy(response.data.cancellationPolicy);
      setSuccess(true);

    } catch (error) {
      console.error('Erreur annulation:', error);
      setError(error.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>
      <div className={styles.loading}>{t('Chargement')}...</div>
    </div>;
  }

  if (!booking) {
    return <div className={styles.container}>
      <div className={styles.error}>{t('noReservation')}</div>
    </div>;
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <h1>✅ {t('CancelBooking')}</h1>

          <div className={styles.infoBox}>
            <h2>{t('refundPolicy')}</h2>
            <div className={styles.policyInfo}>
              <div className={styles.policyRow}>
                <span>{t('refundPourcent')}</span>
                <strong>{cancellationPolicy?.refundPercentage}%</strong>
              </div>
              <div className={styles.policyRow}>
                <span>{t('refundAmount')}</span>
                <strong>{cancellationPolicy?.refundAmount?.toFixed(2)} €</strong>
              </div>
              <div className={styles.policyDescription}>
                <p>{cancellationPolicy?.policy}</p>
              </div>
            </div>
          </div>

          <div className={styles.nextSteps}>
            <h3>{t('nextstep')}</h3>
            <ul>
              <li>{t('mailConfirmCancel')}</li>
              {cancellationPolicy?.refundAmount > 0 && (
                <li>{t('refundMessage', { amount: cancellationPolicy.refundAmount.toFixed(2) })}</li>
              )}
              <li>{t('crewInformCancel')}</li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/client/search')}
            className={styles.btnPrimary}
          >
            {t('RetourSearch')}
          </button>
        </div>
      </div>
    );
  }

  const sessionDate = format(new Date(booking.session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>❌ {t('BookingCancelYours')}</h1>

        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        <div className={styles.bookingSummary}>
          <h2>{t('ResumeBooking')}</h2>
          <div className={styles.summaryRow}>
            <span>Canyon :</span>
            <strong>{booking.product.name}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Date :</span>
            <strong>{sessionDate}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('Heure')} :</span>
            <strong>{booking.session.startTime}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('nbrPersonne')} :</span>
            <strong>{booking.numberOfPeople}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('payMontant')} :</span>
            <strong>{booking.amountPaid.toFixed(2)} €</strong>
          </div>
        </div>

        {cancellationPolicy && (
          <div className={styles.policyCard}>
            <h2>📋 {t('PolicyCancel')}</h2>

            <div className={styles.policyHighlight}>
              <div className={styles.refundInfo}>
                <div className={styles.refundPercentage}>
                  {cancellationPolicy.refundPercentage}%
                </div>
                <div className={styles.refundLabel}>{t('refund')}</div>
              </div>
              <div className={styles.refundAmount}>
                <strong>{cancellationPolicy.refundAmount.toFixed(2)} €</strong>
                <span>{t('Rembourse')}</span>
              </div>
            </div>

            <div className={styles.policyDetails}>
              <p><strong>{cancellationPolicy.policy}</strong></p>
              <p className={styles.timeInfo}>
                {t('TimeBeforeSession')} : <strong>{cancellationPolicy.hoursUntilSession}h</strong>
              </p>
            </div>

            <div className={styles.policyRules}>
              <h3>{t('CancelRule')} :</h3>
              <ul>
                <li>{t('PolicyRefund.full')}</li>
                <li>{t('PolicyRefund.partial')}</li>
                <li>{t('PolicyRefund.none')}</li>

              </ul>
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label>{t('cancelRaison')}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pourquoi annulez-vous cette réservation ?"
            rows={4}
            maxLength={500}
            disabled={booking.status === 'cancelled' || cancelling}
          />
          <small>{reason.length}{t('500Caractere')}</small>
        </div>

        <div className={styles.warningBox}>
          <strong>⚠️ {t('Warning')}</strong>
          <p>{t('ActionIreversible')}</p>
        </div>

        <div className={styles.actionButtons}>
          <button
            onClick={() => navigate(-1)}
            className={styles.btnSecondary}
            disabled={cancelling}
          >
            {t('Retour')}
          </button>
          <button
            onClick={handleCancel}
            className={styles.dangerButton}
            disabled={booking.status === 'cancelled' || cancelling}
          >
            {cancelling ? t('CancelChargment') : t('ConfirmCancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBooking;
