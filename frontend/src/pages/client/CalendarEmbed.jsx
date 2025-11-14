import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productsAPI, sessionsAPI } from '../../services/api';
import { format, addDays } from 'date-fns';
import styles from './CalendarEmbed.module.css';
import DateRangePicker from '../../components/DateRangePicker';
import { useTranslation } from 'react-i18next';

const CalendarEmbed = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const colorFromUrl = searchParams.get('color');
  const [product, setProduct] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateAvailability, setDateAvailability] = useState({});
  const [dateInfo, setDateInfo] = useState({});
  const [showContactModal, setShowContactModal] = useState(false);
  const clientColor = colorFromUrl || localStorage.getItem('clientThemeColor') || '#3498db';

  useEffect(() => {
    loadProduct();
    loadMonthAvailability();
    if (colorFromUrl) {
      localStorage.setItem('clientThemeColor', colorFromUrl);
    }
  }, [id, colorFromUrl]);

  useEffect(() => {
    if (selectedDate) {
      loadSessions();
    }
  }, [selectedDate]);

  const loadMonthAvailability = async () => {
    try {
      const today = new Date();
      const endDate = addDays(today, 60);

      const response = await sessionsAPI.getAll({
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });

      const allSessions = response.data.sessions || [];
      const availability = {};
      const info = {};
      // Extraire le vrai productId si c'est un uniqueId
      let realProductId = id;
      if (id.includes('_override_')) {
        realProductId = id.split('_override_')[0];
      }
      const currentProductId = String(realProductId);
      const now = new Date();

      allSessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.startTime.split(':').map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);
        const isSessionPast = sessionDate <= now;

        if (isSessionPast) {
          return;
        }

        // Ne pas inclure les sessions fermées dans le calendrier
        if (session.status === 'closed') {
          return;
        }

        const hasThisProduct = session.products.some(p => String(p.product.id) === currentProductId);

        // Traiter le produit actuel s'il est dans cette session
        if (hasThisProduct) {
          const productInSession = session.products.find(p => String(p.product.id) === currentProductId);
          if (productInSession) {
            const maxCapacity = productInSession.product.maxCapacity;
            const booked = session.bookings
              .filter(b => String(b.productId) === currentProductId && b.status !== 'cancelled')
              .reduce((sum, b) => sum + b.numberOfPeople, 0);
            const availablePlaces = maxCapacity - booked;

            // Vérifier s'il y a une réservation pour un autre produit dans cette session
            const hasBookingForOtherProduct = session.bookings.some(
              b => String(b.productId) !== currentProductId && b.status !== 'cancelled'
            );

            // Ne marquer comme disponible/full QUE si pas de réservation pour autre produit
            if (!hasBookingForOtherProduct) {
              if (session.status === 'open' && availablePlaces > 0) {
                availability[dateKey] = 'available';
                info[dateKey] = { type: 'available', places: availablePlaces };
              } else {
                availability[dateKey] = 'full';
                info[dateKey] = { type: 'full' };
              }
            }
          }
        }

        // Vérifier s'il y a d'autres produits RÉSERVÉS dans cette session
        // On ne veut afficher que les produits qui ont effectivement des réservations
        const bookedProductIds = session.bookings
          .filter(b => b.status !== 'cancelled')
          .map(b => String(b.productId));

        const otherProductsWithBookings = session.products
          .filter(sp => {
            const productId = String(sp.product.id);
            return productId !== currentProductId && bookedProductIds.includes(productId);
          })
          .map(sp => ({
            id: sp.product.id,
            name: sp.product.name
          }));

        if (otherProductsWithBookings.length > 0) {
          // Ne marquer en jaune que si on n'a pas déjà marqué comme "available" (vert)
          if (!info[dateKey] || info[dateKey].type !== 'available') {
            if (!info[dateKey]) {
              availability[dateKey] = 'otherProduct';
              info[dateKey] = { type: 'otherProduct', sessions: [] };
            } else if (info[dateKey].type === 'otherProduct') {
              // Continuer à ajouter à la liste
            } else if (info[dateKey].type === 'full' || info[dateKey].type === 'closed') {
              // Remplacer par otherProduct si c'était full ou closed
              availability[dateKey] = 'otherProduct';
              info[dateKey] = { type: 'otherProduct', sessions: [] };
            }

            info[dateKey].sessions = info[dateKey].sessions || [];
            info[dateKey].sessions.push({
              timeSlot: session.timeSlot,
              startTime: session.startTime,
              products: otherProductsWithBookings
            });
          }
        }
      });

      // Marquer les dates sans sessions comme "closed"
      for (let i = 0; i < 60; i++) {
        const date = addDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!availability[dateKey]) {
          availability[dateKey] = 'closed';
          info[dateKey] = { type: 'closed' };
        }
      }

      setDateAvailability(availability);
      setDateInfo(info);
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);

      // Si sessionId est fourni, charger le produit depuis cette session (avec overrides appliqués)
      const sessionId = searchParams.get('sessionId');

      if (sessionId) {
        const sessionResponse = await sessionsAPI.getById(sessionId);
        const session = sessionResponse.data.session;

        // Extraire le vrai productId si c'est un uniqueId
        let realProductId = id;
        if (id.includes('_override_')) {
          realProductId = id.split('_override_')[0];
        }

        // Trouver le produit dans la session (les overrides sont déjà appliqués par le backend)
        const sessionProduct = session.products?.find(sp => sp.product.id === realProductId);

        if (sessionProduct) {
          setProduct(sessionProduct.product);
        } else {
          throw new Error('Produit non trouvé dans cette session');
        }
      } else {
        // Extraire le vrai productId si c'est un uniqueId
        let realProductId = id;
        if (id.includes('_override_')) {
          realProductId = id.split('_override_')[0];
        }

        // Charger le produit normalement
        const response = await productsAPI.getById(realProductId);
        setProduct(response.data.product);
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await sessionsAPI.getAll({
        date: formattedDate
      });
      console.log(response.data)
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      setSessions([]);
    }
  };

  const getTimeSlotLabel = (timeSlot) => {
    const labels = {
      'matin': t('calendarEmbed.morning'),
      'après-midi': t('calendarEmbed.afternoon'),
      'journée': t('calendarEmbed.fullDay')
    };
    return labels[timeSlot] || timeSlot;
  };

  const getAvailableSpots = (session) => {
    if (!product) return 0;
    // Extraire le vrai productId si c'est un uniqueId
    let realProductId = id;
    if (id.includes('_override_')) {
      realProductId = id.split('_override_')[0];
    }
    const currentProduct = session.products.find(p => p.product.id === realProductId);
    if (!currentProduct) return 0;

    const total = currentProduct.product.maxCapacity;
    const booked = session.bookings
      .filter(b => b.productId === realProductId)
      .reduce((sum, b) => sum + b.numberOfPeople, 0);

    return total - booked;
  };

  const handleBookSession = (sessionId) => {
    if (!product) return;
    // Extraire le vrai productId si c'est un uniqueId
    let realProductId = id;
    if (id.includes('_override_')) {
      realProductId = id.split('_override_')[0];
    }
    const params = new URLSearchParams();
    const guideId = searchParams.get('guideId');
    const teamName = searchParams.get('teamName');

    if (guideId) params.set('guideId', guideId);
    if (teamName) params.set('teamName', teamName);
    const color = searchParams.get('color');
    if (color) params.set('color', color);
    const url = `/client/book/${sessionId}?productId=${realProductId}&${params.toString()}`;
    navigate(url);
  };

  const handleDateChange = (startDate, endDate) => {
    if (startDate) {
      setSelectedDate(new Date(startDate));
    } else {
      setSelectedDate(null);
    }
  };

  const handleClosedDateClick = (date, status) => {
    setShowContactModal(true);
  };

  const isSessionReservedByOtherProduct = (session) => {
    if (!product) return false;
    // Extraire le vrai productId si c'est un uniqueId
    let realProductId = id;
    if (id.includes('_override_')) {
      realProductId = id.split('_override_')[0];
    }
    return session.bookings.some(b => b.productId !== realProductId);
  };

  const visibleSessions = sessions.filter(s => {
    if (!product) return false;
    // Extraire le vrai productId si c'est un uniqueId
    let realProductId = id;
    if (id.includes('_override_')) {
      realProductId = id.split('_override_')[0];
    }

    // Trouver le produit dans la session
    const sessionProduct = s.products?.find(p => {
      return String(p.product?.id) === String(realProductId);
    });

    if (!sessionProduct) return false;

    // Ne pas afficher les sessions fermées (vérifier le statut de la session ET les overrides)
    if (s.status === 'closed') {
      return false;
    }

    // Vérifier si le produit a un override de statut "closed"
    if (sessionProduct.productOverrides && sessionProduct.productOverrides.status === 'closed') {
      return false;
    }

    const now = new Date();
    const sessionDate = new Date(s.date);
    const [hours, minutes] = s.startTime.split(':').map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    return sessionDate > now;
  });

  if (loading) {
    return <div className={styles.loading}>{t('calendarEmbed.loading')}</div>;
  }

  if (!product) {
    return <div className={styles.error}>{t('calendarEmbed.productNotFound')}</div>;
  }

  return (
    <div className={styles.embedContainer}>
      <style>
        {`
          .${styles.sessionCard}:hover:not(.${styles.disabled}) {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
        `}
      </style>

      {/* Header avec nom du canyon */}
      <div className={styles.header}>
        <h1>{product.name}</h1>
        <p className={styles.price}>{product.priceIndividual}€/pers</p>
      </div>

      {/* Layout 2 colonnes: Calendrier à gauche, Résultats à droite */}
      <div className={styles.calendarResultsContainer}>
        {/* Colonne gauche: Calendrier */}
        <div className={styles.calendarColumn}>
          {/* Légende des couleurs */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: 'rgba(40, 167, 69, 0.2)', borderColor: '#28a745' }}></div>
              <span>{t('calendarEmbed.available')}</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: '#ffc107' }}></div>
              <span>{t('calendarEmbed.otherCanyon')}</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: '#dc3545' }}></div>
              <span>{t('calendarEmbed.fullClosed')}</span>
            </div>
          </div>

          <DateRangePicker
            onDateChange={handleDateChange}
            initialStartDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null}
            initialEndDate={null}
            hideRangeMode={true}
            dateAvailability={dateAvailability}
            accentColor={clientColor}
            onClosedDateClick={handleClosedDateClick}
          />
        </div>

        {/* Colonne droite: Résultats */}
        <div className={styles.resultsColumn}>
          {/* Afficher les infos des autres canyons si date jaune sélectionnée */}
          {selectedDate && dateInfo[format(selectedDate, 'yyyy-MM-dd')]?.type === 'otherProduct' && (
            <div className={styles.otherProductInfo}>
              <p className={styles.otherProductTitle}>
                ℹ️ {t('calendarEmbed.otherCanyonBooked')}
              </p>
              {dateInfo[format(selectedDate, 'yyyy-MM-dd')].sessions.map((session, idx) => (
                <div key={idx} className={styles.otherProductSession}>
                  <p className={styles.otherProductTime}>
                    {getTimeSlotLabel(session.timeSlot)} - {session.startTime}
                  </p>
                  {session.products.map((otherProduct) => (
                    <div key={otherProduct.id} className={styles.otherProductItem}>
                      <span>{otherProduct.name}</span>
                      <button
                        onClick={() => {
                            const params = new URLSearchParams();
                            const guideId = searchParams.get('guideId');
                            const teamName = searchParams.get('teamName');

                            if (guideId) params.set('guideId', guideId);
                            if (teamName) params.set('teamName', teamName);
                            const color = searchParams.get('color');
                            if (color) params.set('color', color);
                          navigate(`/client/canyon/${otherProduct.id}?${params.toString()}`)}}
                        className={styles.otherProductButton}
                      >
                        {t('calendarEmbed.viewThisCanyon')}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Liste des sessions */}
          <div className={styles.sessionsList}>
            {visibleSessions.length === 0 ? (
              selectedDate && dateInfo[format(selectedDate, 'yyyy-MM-dd')]?.type === 'otherProduct' ? null : (
                <div className={styles.noSessions}>
                  <p>{t('calendarEmbed.noSessionsAvailable')}</p>
                  <p className={styles.hint}>{t('calendarEmbed.tryAnotherDate')}</p>
                </div>
              )
            ) : (
              visibleSessions.map((session) => {
                const availableSpots = getAvailableSpots(session);
                // Extraire le vrai productId si c'est un uniqueId
                let realProductId = id;
                if (id.includes('_override_')) {
                  realProductId = id.split('_override_')[0];
                }
                const currentProductInSession = session.products.find(p => p.product.id === realProductId);
                const isAutoClosed = currentProductInSession?.product?.isAutoClosed || false;
                const isAvailable = session.status === 'open' && availableSpots > 0 && !isAutoClosed;

                if (isSessionReservedByOtherProduct(session)) {
                  return null;
                }

                return (
                  <div
                    key={session.id}
                    className={`${styles.sessionCard} ${(!isAvailable || isAutoClosed) ? styles.disabled : ''}`}
                  >
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionTime}>
                        <span className={styles.timeSlot}>{getTimeSlotLabel(session.timeSlot)}</span>
                        <span className={styles.startTime} style={{ color: clientColor }}>{session.startTime}</span>
                      </div>
                      <div className={styles.sessionDetails}>
                        <p>{t('calendarEmbed.availableSpots')} <strong>{availableSpots}</strong></p>
                        {isAutoClosed && (
                          <p className={styles.autoClosedWarning}>
                            ⚠️ {t('calendarEmbed.closedOnline')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={styles.sessionActions}>
                      {isAutoClosed ? (
                        <div className={styles.autoClosedInfo}>
                          <p className={styles.autoClosedTitle}>
                            {t('calendarEmbed.bookingClosedOnline')}
                          </p>
                          <p className={styles.autoClosedDescription}>
                            📞 {t('calendarEmbed.callGuideToBook')}
                          </p>
                        </div>
                      ) : isAvailable ? (
                        <button
                          onClick={() => handleBookSession(session.id)}
                          className={styles.btnPrimary}
                          style={{ backgroundColor: clientColor, borderColor: clientColor }}
                        >
                          {t('calendarEmbed.book')}
                        </button>
                      ) : (
                        <button className={styles.btnDisabled} disabled>
                          {session.status === 'full' ? t('calendarEmbed.full') : t('calendarEmbed.closed')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de contact */}
      {showContactModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowContactModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>📞 Contactez-nous</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowContactModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                {t('calendarEmbed.noActivityAvailable')}
              </p>
              <p className={styles.modalSubMessage}>
                {t('calendarEmbed.contactUsToOpen')}
              </p>

              {product?.guide && (
                <div className={styles.contactButtons}>
                  {product.guide.settings?.companyPhone && (
                    <a
                      href={`tel:${product.guide.settings.companyPhone}`}
                      className={styles.contactButton}
                      style={{ backgroundColor: clientColor, borderColor: clientColor }}
                    >
                      📞 {product.guide.settings.companyPhone}
                    </a>
                  )}
                  {product.guide.settings?.companyEmail && (
                    <a
                      href={`mailto:${product.guide.settings.companyEmail}`}
                      className={styles.contactButton}
                      style={{ backgroundColor: clientColor, borderColor: clientColor }}
                    >
                      📧 {product.guide.settings.companyEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarEmbed;