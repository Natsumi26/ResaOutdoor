import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import {Trans, useTranslation } from 'react-i18next';

const BookingConfirmation = () => {
  const { t } = useTranslation();
  const { bookingId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const colorFromUrl = queryParams.get('color');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const clientColor = colorFromUrl || localStorage.getItem('clientThemeColor') || '#3498db';

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookingRes = await bookingsAPI.getById(bookingId);
      setBooking(bookingRes.data.booking);

      // Sauvegarder la couleur dans localStorage si elle vient de l'URL
      if (colorFromUrl) {
        localStorage.setItem('clientThemeColor', colorFromUrl);
      }
    } catch (error) {
      console.error('Erreur chargement réservation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('Chargement')}...</div>;
  }

  if (!booking) {
    return (
      <div className={styles.clientContainerIframe}>
        <div className={styles.error}>{t('noReservation')}</div>
      </div>
    );
  }

  const isPaid = (booking.amountPaid+booking.discountAmount) >= booking.totalPrice;
  console.log(booking)
  return (
    <div className={styles.clientContainerIframe}>
      <div className={styles.confirmationContainer}>
        {/* En-tête de succès */}
        <div className={styles.confirmationHeader}>
          <div className={styles.successIcon}>✓</div>
          <h1>{t('resaConfirm')}</h1>
        </div>

        {/* Détails de la réservation */}
        <div className={styles.confirmationCard}>
          {/* Prochaines étapes - EN PREMIER */}
          <div className={styles.confirmationSection}>
            <h3 style={{ fontSize: '1.5rem', color: clientColor, marginBottom: '1.5rem', textAlign: 'center' }}>{t('nextstep')}</h3>
            <div className={styles.nextSteps}>
              <div className={styles.step}>
                <span className={styles.stepIcon}>📧</span>
                <div>
                  <strong>{t('comfirmParMail')}</strong>
                  <p>Un email de confirmation a été envoyé à <strong>{booking.clientEmail}</strong> avec toutes les informations et les liens GPS du lieu de rendez-vous.</p>
                </div>
              </div>

              <div className={styles.step}>
                <span className={styles.stepIcon}>👕</span>
                <div>
                  <strong>{t('InfoParts')}</strong>
                  <p>
                    {t("formReminder.text")}{" "}
                    <strong>{t("formReminder.editable")}</strong>
                  </p>
                </div>
              </div>

              {!isPaid && (
                <div className={styles.step}>
                  <span className={styles.stepIcon}>💳</span>
                  <div>
                    <strong>{t('soldePayment')}</strong>
                    <p>
                      {t("paymentReminder.text", {
                        amount: booking.totalPrice - booking.amountPaid - booking.discountAmount
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.step}>
                <span className={styles.stepIcon}>⏰</span>
                <div>
                  <strong>{t("arrival.title")}</strong>
                  <p>{t("arrival.text")}</p>
                </div>
              </div>

              {booking.product.postBookingMessage && (
                <div className={styles.step}>
                  <span className={styles.stepIcon}>ℹ️</span>
                  <div>
                    <strong>{t('MessageGuide')}</strong>
                    <p>{booking.product.postBookingMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.confirmationSection}>
            <h2 style={{ textAlign: 'center' }}>{t('detailResa')}</h2>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(52, 152, 219, 0.1)'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>Canyon</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{booking.product.name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>📅 Date</div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                    {format(new Date(booking.session.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>🕐 {t('Horaire')}</div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>{booking.session.timeSlot} - {booking.session.startTime}</div>
                </div>
              </div>

              <div style={{
                background: isPaid ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                borderRadius: '10px',
                padding: '1.25rem',
                border: isPaid ? '2px solid #28a745' : '2px solid #ffc107',
                marginTop: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.95rem', color: '#495057', fontWeight: '500' }}>👥 {booking.numberOfPeople} personne{booking.numberOfPeople > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#2c3e50' }}>{t('totalPrice')}: {booking.totalPrice}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: isPaid ? '#155724' : '#856404' }}>
                    {isPaid ? '✓ Payé' : `💳 ${t('payMontant')}`}
                  </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '700', color: isPaid ? '#28a745' : '#fd7e14' }}>
                    {booking.amountPaid}€
                    {booking.discountAmount > 0 && <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem' }}>({t('Reduc')} {booking.discountAmount}€)</span>}
                  </span>
                </div>
                {!isPaid && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#856404', textAlign: 'right' }}>
                    {t('RestePaid')} <strong>{booking.totalPrice - booking.amountPaid - booking.discountAmount}€</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.confirmationSection}>
            <h3>{t('yoursInfos')}</h3>
            <div className={styles.clientInfo}>
              <p><strong>{t('Nom')} :</strong> {booking.clientFirstName} {booking.clientLastName}</p>
              <p><strong>Email :</strong> {booking.clientEmail}</p>
              <p><strong>{t('Téléphone')} :</strong> {booking.clientPhone}</p>
              <p><strong>{t("languageSpoken.title")}</strong>
                <img
                  src={`https://flagcdn.com/16x12/${booking.clientNationality === 'EN' ? 'gb' : 'fr'}.png`}
                  alt={booking.clientNationality}
                />
                {booking.clientNationality === 'FR' ? ' Français' : ' English'}
              </p>
            </div>
          </div>

          {/* Liste de matériel à apporter */}
          {booking.product.equipmentList && (
            <div className={styles.confirmationSection}>
              <h3>🎒 Matériel à apporter</h3>
              <div style={{
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#555'
              }}>
                {booking.product.equipmentList.items}
              </div>
            </div>
          )}

          {/* Liens utiles */}
          {(booking.product.wazeLink || booking.product.googleMapsLink) && (
            <div className={styles.confirmationSection}>
              <h3>{t('LieuRDV')}</h3>
              <div className={styles.locationLinks}>
                {booking.product.wazeLink && (
                  <a
                    href={booking.product.wazeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkBtn}
                  >
                    🗺️ {t('waze')}
                  </a>
                )}
                {booking.product.googleMapsLink && (
                  <a
                    href={booking.product.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkBtn}
                  >
                    📍 {t('maps')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.confirmationActions}>
            <Link
              to={`/client/my-booking/${booking.id}`}
              className={styles.btnPrimary}
              style={{ backgroundColor: clientColor, borderColor: clientColor }}
            >
              {t('InfosPart')}
            </Link>
            <Link
              to="/client/search"
              className={styles.btnSecondary}
            >
              {t('autreResa')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
