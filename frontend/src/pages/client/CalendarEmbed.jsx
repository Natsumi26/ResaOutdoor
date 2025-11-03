import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, sessionsAPI, settingsAPI } from '../../services/api';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './CalendarEmbed.module.css';
import DateRangePicker from '../../components/DateRangePicker';

const CalendarEmbed = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateAvailability, setDateAvailability] = useState({});
  const [dateInfo, setDateInfo] = useState({});
  const [clientColor, setClientColor] = useState(() => {
    return localStorage.getItem('clientThemeColor') || '#3498db';
  });

  useEffect(() => {
    loadProduct();
    loadMonthAvailability();
    loadClientColor();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      loadSessions();
    }
  }, [selectedDate]);

  const loadClientColor = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;
      if (settings?.clientButtonColor) {
        setClientColor(settings.clientButtonColor);
        localStorage.setItem('clientThemeColor', settings.clientButtonColor);
      }
    } catch (error) {
      console.error('Erreur chargement couleur client:', error);
    }
  };

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
      const currentProductId = String(id);
      const now = new Date();
      const datesWithSessions = new Set();

      allSessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.startTime.split(':').map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);
        const isSessionPast = sessionDate <= now;

        const hasThisProduct = session.products.some(p => String(p.product.id) === currentProductId);

        if (hasThisProduct) {
          datesWithSessions.add(dateKey);
        }

        if (isSessionPast) {
          return;
        }

        if (hasThisProduct) {
          const hasBookingForOtherProduct = session.bookings.some(
            b => String(b.productId) !== currentProductId && b.status !== 'cancelled'
          );

          if (!hasBookingForOtherProduct) {
            const productInSession = session.products.find(p => String(p.product.id) === currentProductId);
            if (productInSession) {
              const maxCapacity = productInSession.product.maxCapacity;
              const booked = session.bookings
                .filter(b => String(b.productId) === currentProductId && b.status !== 'cancelled')
                .reduce((sum, b) => sum + b.numberOfPeople, 0);
              const availablePlaces = maxCapacity - booked;

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

        if (!hasThisProduct || session.bookings.some(b => String(b.productId) !== currentProductId && b.status !== 'cancelled')) {
          const bookedProductIds = session.bookings
            .filter(b => b.status !== 'cancelled')
            .map(b => String(b.productId));

          const otherProducts = session.products
            .filter(sp => {
              const productId = String(sp.product.id);
              return productId !== currentProductId && bookedProductIds.includes(productId);
            })
            .map(sp => ({
              id: sp.product.id,
              name: sp.product.name
            }));

          if (otherProducts.length > 0) {
            if (!info[dateKey] || info[dateKey].type !== 'available') {
              if (!info[dateKey]) {
                availability[dateKey] = 'otherProduct';
                info[dateKey] = { type: 'otherProduct', sessions: [] };
              } else if (info[dateKey].type === 'otherProduct') {
                // Ajouter à la liste existante
              } else if (info[dateKey].type === 'full' || info[dateKey].type === 'closed') {
                availability[dateKey] = 'otherProduct';
                info[dateKey] = { type: 'otherProduct', sessions: [] };
              }

              info[dateKey].sessions.push({
                timeSlot: session.timeSlot,
                startTime: session.startTime,
                products: otherProducts
              });
            }
          }
        }
      });

      for (let i = 0; i < 60; i++) {
        const date = addDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!availability[dateKey]) {
          if (datesWithSessions.has(dateKey)) {
            availability[dateKey] = 'past';
            info[dateKey] = { type: 'past' };
          } else {
            availability[dateKey] = 'closed';
            info[dateKey] = { type: 'closed' };
          }
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
      const response = await productsAPI.getById(id);
      setProduct(response.data.product);
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
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      setSessions([]);
    }
  };

  const getTimeSlotLabel = (timeSlot) => {
    const labels = {
      'matin': 'Matin',
      'après-midi': 'Après-midi',
      'journée': 'Journée'
    };
    return labels[timeSlot] || timeSlot;
  };

  const getAvailableSpots = (session) => {
    const currentProduct = session.products.find(p => p.product.id === product.id);
    if (!currentProduct) return 0;

    const total = currentProduct.product.maxCapacity;
    const booked = session.bookings
      .filter(b => b.productId === product.id)
      .reduce((sum, b) => sum + b.numberOfPeople, 0);

    return total - booked;
  };

  const handleBookSession = (sessionId) => {
    const url = `/client/book/${sessionId}?productId=${product.id}`;
    navigate(url);
  };

  const handleDateChange = (startDate, endDate) => {
    if (startDate) {
      setSelectedDate(new Date(startDate));
    } else {
      setSelectedDate(null);
    }
  };

  const isSessionReservedByOtherProduct = (session) => {
    return session.bookings.some(b => b.productId !== product.id);
  };

  const visibleSessions = sessions.filter(s => {
    const hasThisProduct = s.products?.some(p => {
      return String(p.product?.id) === String(product.id);
    });

    if (!hasThisProduct) return false;

    const now = new Date();
    const sessionDate = new Date(s.date);
    const [hours, minutes] = s.startTime.split(':').map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    return sessionDate > now;
  });

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!product) {
    return <div className={styles.error}>Produit non trouvé</div>;
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
              <span>Disponible</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: '#ffc107' }}></div>
              <span>Autre canyon</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: '#dc3545' }}></div>
              <span>Complet/Fermé</span>
            </div>
          </div>

          <DateRangePicker
            onDateChange={handleDateChange}
            initialStartDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null}
            initialEndDate={null}
            hideRangeMode={true}
            dateAvailability={dateAvailability}
            accentColor={clientColor}
          />
        </div>

        {/* Colonne droite: Résultats */}
        <div className={styles.resultsColumn}>
          {/* Afficher les infos des autres canyons si date jaune sélectionnée */}
          {selectedDate && dateInfo[format(selectedDate, 'yyyy-MM-dd')]?.type === 'otherProduct' && (
            <div className={styles.otherProductInfo}>
              <p className={styles.otherProductTitle}>
                ℹ️ Cette date est déjà réservée pour d'autres canyons :
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
                        onClick={() => navigate(`/client/canyon/${otherProduct.id}`)}
                        className={styles.otherProductButton}
                      >
                        Voir ce canyon →
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
                  <p>Aucune session disponible pour cette date</p>
                  <p className={styles.hint}>Essayez une autre date</p>
                </div>
              )
            ) : (
              visibleSessions.map((session) => {
                const availableSpots = getAvailableSpots(session);
                const currentProductInSession = session.products.find(p => p.product.id === product.id);
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
                        <p>Places disponibles: <strong>{availableSpots}</strong></p>
                        {session.shoeRentalAvailable && (
                          <p className={styles.shoeRental}>
                            Location chaussures: {session.shoeRentalPrice}€
                          </p>
                        )}
                        {isAutoClosed && (
                          <p className={styles.autoClosedWarning}>
                            ⚠️ Fermé en ligne
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={styles.sessionActions}>
                      {isAutoClosed ? (
                        <div className={styles.autoClosedInfo}>
                          <p className={styles.autoClosedTitle}>
                            Réservation fermée en ligne
                          </p>
                          <p className={styles.autoClosedDescription}>
                            📞 Appelez le guide pour réserver
                          </p>
                        </div>
                      ) : isAvailable ? (
                        <button
                          onClick={() => handleBookSession(session.id)}
                          className={styles.btnPrimary}
                          style={{ backgroundColor: clientColor, borderColor: clientColor }}
                        >
                          Réserver
                        </button>
                      ) : (
                        <button className={styles.btnDisabled} disabled>
                          {session.status === 'full' ? 'Complet' : 'Fermé'}
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
    </div>
  );
};

export default CalendarEmbed;