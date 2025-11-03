import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, sessionsAPI, settingsAPI } from '../../services/api';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { Trans, useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';


const CanyonDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startDateParam = searchParams.get('startDate');
  const participantsParam = searchParams.get('participants');
  const [product, setProduct] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateAvailability, setDateAvailability] = useState({});
  const [dateInfo, setDateInfo] = useState({}); // Stocke les infos détaillées par date
  const [clientColor, setClientColor] = useState(() => {
    // Essayer de récupérer depuis localStorage d'abord
    return localStorage.getItem('clientThemeColor') || '#3498db';
  });

  // Vérifie que la date est bien définie et valide
  let formattedDate = '';
  if (startDateParam) {
    const parsedDate = new Date(startDateParam);
    if (!isNaN(parsedDate.getTime())) {
      formattedDate = format(parsedDate, 'dd MMMM yyyy'); // ou 'yyyy-MM-dd' selon ton besoin
    } else {
      console.warn('Date invalide dans l’URL :', startDateParam);
    }
  }


  useEffect(() => {
    loadProduct();
    loadMonthAvailability();
    loadClientColor();
    // Initialiser la date sélectionnée
    const initialDate = startDateParam ? new Date(startDateParam) : new Date();
    setSelectedDate(initialDate);
  }, [id]);

  const loadClientColor = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;
      if (settings?.clientButtonColor) {
        setClientColor(settings.clientButtonColor);
        // Sauvegarder dans localStorage pour éviter le flash au prochain chargement
        localStorage.setItem('clientThemeColor', settings.clientButtonColor);
      }
    } catch (error) {
      console.error('Erreur chargement couleur client:', error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadSessions();
    }
  }, [selectedDate]);

  const loadMonthAvailability = async () => {
    try {
      // Charger toutes les sessions des 60 prochains jours
      const today = new Date();
      const endDate = addDays(today, 60);

      const response = await sessionsAPI.getAll({
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });

      const allSessions = response.data.sessions || [];
      const availability = {};
      const info = {};

      // Convertir l'ID en string pour les comparaisons
      const currentProductId = String(id);
      const now = new Date();

      // Tracker les dates qui ont au moins une session (passée ou future)
      const datesWithSessions = new Set();

      // Analyser chaque session
      allSessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');

        // Vérifier si la session est passée
        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.startTime.split(':').map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);
        const isSessionPast = sessionDate <= now;

        // Vérifier si ce produit est dans la session
        const hasThisProduct = session.products.some(p => String(p.product.id) === currentProductId);

        // Marquer cette date comme ayant une session
        if (hasThisProduct) {
          datesWithSessions.add(dateKey);
        }

        // Ignorer les sessions passées pour le calcul de disponibilité
        if (isSessionPast) {
          return;
        }

        if (hasThisProduct) {
          // VÉRIFICATION IMPORTANTE : Le guide a-t-il déjà une réservation pour un AUTRE canyon ?
          const hasBookingForOtherProduct = session.bookings.some(
            b => String(b.productId) !== currentProductId && b.status !== 'cancelled'
          );

          if (hasBookingForOtherProduct) {
            // Le guide est déjà pris par un autre canyon → ce canyon n'est PAS disponible
            // On ne fait RIEN ici, on laisse la logique "else" ci-dessous gérer le marquage en jaune
          } else {
            // Calculer les places disponibles pour ce produit
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

        // Vérifier s'il y a d'autres canyons disponibles dans cette session
        if (!hasThisProduct || session.bookings.some(b => String(b.productId) !== currentProductId && b.status !== 'cancelled')) {
          // Trouver les canyons qui ont effectivement des réservations (donc qui prennent le guide)
          const bookedProductIds = session.bookings
            .filter(b => b.status !== 'cancelled')
            .map(b => String(b.productId));

          // Ne garder que les canyons qui ont des réservations ET qui ne sont pas le canyon actuel
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
            // Ce canyon n'est PAS disponible, mais d'autres le sont → TOUJOURS marquer en jaune
            // Ne pas marquer en jaune SEULEMENT si ce canyon est déjà disponible pour cette date
            if (!info[dateKey] || info[dateKey].type !== 'available') {
              if (!info[dateKey]) {
                availability[dateKey] = 'otherProduct';
                info[dateKey] = { type: 'otherProduct', sessions: [] };
              } else if (info[dateKey].type === 'otherProduct') {
                // Ajouter à la liste existante
              } else if (info[dateKey].type === 'full' || info[dateKey].type === 'closed') {
                // Si c'était marqué fermé/complet, le remplacer par otherProduct
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

      // Marquer les dates à venir sans session
      for (let i = 0; i < 60; i++) {
        const date = addDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!availability[dateKey]) {
          // Si cette date avait des sessions mais qu'elles sont toutes passées, marquer comme 'past'
          if (datesWithSessions.has(dateKey)) {
            availability[dateKey] = 'past';
            info[dateKey] = { type: 'past' };
          } else {
            // Sinon, marquer comme 'closed' (aucune session prévue)
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
      navigate('/client/search');
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

  const getDurationLabel = (minutes) => {
    const hours = minutes / 60;
    if (hours < 1) return `${minutes} min`;
    if (hours === Math.floor(hours)) return `${hours}h`;
    return `${Math.floor(hours)}h${(minutes % 60).toString().padStart(2, '0')}`;
  };

  const getLevelBadgeClass = (level) => {
    const levelMap = {
      'découverte': styles.badgeGreen,
      'aventure': styles.badgeOrange,
      'sportif': styles.badgeRed
    };
    return levelMap[level] || styles.badgeGray;
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
    const currentProduct = session.products.find(p => p.product.id === product.id);
    if (!currentProduct) return 0;

    const total = currentProduct.product.maxCapacity;

    const booked = session.bookings
      .filter(b => b.productId === product.id)
      .reduce((sum, b) => sum + b.numberOfPeople, 0);

    return total - booked;
  };

  const handleBookSession = (sessionId) => {
    const url = `/client/book/${sessionId}?productId=${product.id}${participantsParam ? `&participants=${participantsParam}` : ''}`;
    navigate(url);
  };

  const handleDateChange = (startDate, endDate) => {
    if (startDate) {
      setSelectedDate(new Date(startDate));
    } else {
      setSelectedDate(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('Chargement')}...</div>;
  }

  if (!product) {
    return <div className={styles.error}>{t('noProduct')}</div>;
  }
  const isSessionReservedByOtherProduct = (session) => {
    return session.bookings.some(b => b.productId !== product.id);
  };

  // Filtrer pour garder UNIQUEMENT les sessions qui contiennent ce canyon et qui ne sont pas passées
  const visibleSessions = sessions.filter(s => {
    // Vérifier si ce produit est dans la session (comparer en String)
    const hasThisProduct = s.products?.some(p => {
      return String(p.product?.id) === String(product.id);
    });

    if (!hasThisProduct) return false;

    // Vérifier si la session n'est pas passée
    const now = new Date();
    const sessionDate = new Date(s.date);

    // Extraire l'heure de début (format "09:00" ou "14:00")
    const [hours, minutes] = s.startTime.split(':').map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    // Ne garder que les sessions futures
    return sessionDate > now;
  });

  return (
    <div className={styles.clientContainer}>
      {/* Styles globaux pour les éléments avec effets bleus */}
      <style>
        {`
          .${styles.thumbnail}.active {
            border-color: ${clientColor} !important;
          }
          .${styles.dateBtn}:hover {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
          .${styles.dateBtn}.active {
            background: ${clientColor} !important;
            border-color: ${clientColor} !important;
          }
          .${styles.sessionCard}:hover:not(.${styles.disabled}) {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
          }
        `}
      </style>
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

      {/* Container 2 colonnes: Infos à gauche, Photos à droite */}
      <div className={styles.topDetailsContainer}>
        {/* Informations du canyon - Colonne gauche */}
        <div className={styles.detailsSection}>
        <div className={styles.detailsHeader}>
          <div>
            <h1>{product.name}</h1>
            {product.shortDescription && (
              <p className={styles.subtitle}>{product.shortDescription}</p>
            )}
          </div>
          <div className={styles.priceBox} style={{ backgroundColor: `${clientColor}15` }}>
            <span className={styles.priceAmount}>{product.priceIndividual}€</span>
            <span className={styles.priceUnit}>/pers</span>
            {product.priceGroup && (
              <span className={styles.groupPrice}>
                {product.priceGroup.price}€/pers pour {product.priceGroup.min}+ pers.
              </span>
            )}
          </div>
        </div>

        {/* Caractéristiques */}
        <div className={styles.characteristics}>
          <div className={styles.charItem}>
            <span className={styles.charIcon}>⏱️</span>
            <div>
              <strong>{t('Durée')}</strong>
              <p>{getDurationLabel(product.duration)}</p>
            </div>
          </div>
          <div className={styles.charItem}>
            <span className={styles.charIcon}>🎯</span>
            <div>
              <strong>{t('Niveau')}</strong>
              <p><span className={getLevelBadgeClass(product.level)}>{product.level}</span></p>
            </div>
          </div>
          <div className={styles.charItem}>
            <span className={styles.charIcon}>📍</span>
            <div>
              <strong>{t('Région')}</strong>
              <p>{product.region === 'annecy' ? 'Annecy' : 'Grenoble'}</p>
            </div>
          </div>
          <div className={styles.charItem}>
            <span className={styles.charIcon}>👥</span>
            <div>
              <strong>{t('Capacité')}</strong>
              <p>Jusqu'à {product.maxCapacity} personnes</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.longDescription && (
          <div className={styles.description}>
            <h2>Description</h2>
            <p>{product.longDescription}</p>
          </div>
        )}

        {/* Équipement fourni */}
        <div className={styles.equipment}>
          <h2>{t('equipment')}</h2>
          <ul>
            <li>{t('Combi')}</li>
            <li>{t('Casque')}</li>
            <li>{t('Baudrier')}</li>
          </ul>
          <p className={styles.equipmentNote}>
            {t('Prevoir')}
          </p>
        </div>

        {/* Liens utiles */}
        <div className={styles.links}>
          {product.websiteLink && (
            <a href={product.websiteLink} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
              🌐 {t('MoreInfo')}
            </a>
          )}
          {product.wazeLink && (
            <a href={product.wazeLink} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
              🗺️ {t('waze')}
            </a>
          )}
          {product.googleMapsLink && (
            <a href={product.googleMapsLink} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
              📍 {t('maps')}
            </a>
          )}
        </div>
      </div>

      {/* Galerie photos - Colonne droite */}
      <div className={styles.gallerySection}>
        <div className={styles.mainImage}>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[selectedImage].startsWith('http')
                ? product.images[selectedImage]
                : `http://localhost:5000${product.images[selectedImage]}`}
              alt={product.name}
            />
          ) : (
            <div style={{ backgroundColor: product.color, height: '100%' }} />
          )}
        </div>

        {product.images && product.images.length > 1 && (
          <div className={styles.thumbnails}>
            {product.images.map((img, index) => (
              <div
                key={index}
                className={`${styles.thumbnail} ${index === selectedImage ? styles.active : ''}`}
                onClick={() => setSelectedImage(index)}
                style={{
                  backgroundImage: `url(${img.startsWith('http') ? img : `http://localhost:5000${img}`})`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Sessions disponibles */}
      <div className={styles.sessionsSection}>
        <h2>{t('ResaSession')}</h2>

        {/* Layout 2 colonnes: Calendrier à gauche, Résultats à droite */}
        <div className={styles.calendarResultsContainer}>
          {/* Colonne gauche: Calendrier */}
          <div className={styles.calendarColumn}>
            {/* Légende des couleurs */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(40, 167, 69, 0.2)', border: '2px solid #28a745', borderRadius: '4px' }}></div>
                <span>Disponible</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(255, 193, 7, 0.2)', border: '2px solid #ffc107', borderRadius: '4px' }}></div>
                <span>Autre canyon</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(220, 53, 69, 0.2)', border: '2px solid #dc3545', borderRadius: '4px' }}></div>
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
            />
          </div>

          {/* Colonne droite: Résultats */}
          <div className={styles.resultsColumn}>
            {/* Afficher les infos des autres canyons si date jaune sélectionnée */}
            {selectedDate && dateInfo[format(selectedDate, 'yyyy-MM-dd')]?.type === 'otherProduct' && (
              <div style={{
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '2rem'
              }}>
                <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600', color: '#856404' }}>
                  ℹ️ {t('calendarEmbed.otherCanyonBooked')}
                </p>
                {dateInfo[format(selectedDate, 'yyyy-MM-dd')].sessions.map((session, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
                    <p style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#856404'
                    }}>
                      {getTimeSlotLabel(session.timeSlot)} - {session.startTime}
                    </p>
                    {session.products.map((otherProduct) => (
                      <div
                        key={otherProduct.id}
                        style={{
                          backgroundColor: 'white',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: '500' }}>{otherProduct.name}</span>
                        <button
                          onClick={() => navigate(`/client/canyon/${otherProduct.id}`)}
                          style={{
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}
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
            // Ne pas afficher le message "Aucune session" si c'est une date jaune (otherProduct)
            selectedDate && dateInfo[format(selectedDate, 'yyyy-MM-dd')]?.type === 'otherProduct' ? null : (
              <div className={styles.noSessions}>
                <p>{t('noSessionDispo')}</p>
                <p className={styles.hint}>{t('calendarEmbed.tryAnotherDate')}</p>

                {/* Informations de contact - uniquement si aucune session */}
                <div className={styles.contactInfo} style={{ marginTop: '1.5rem' }}>
                  <a href="tel:+33688788186" className={styles.contactButton} style={{ textDecoration: 'none', borderColor: clientColor }}>
                    <div>
                      <strong>📞 Appeler</strong>
                      <p style={{ margin: 0 }}>06 88 78 81 86</p>
                    </div>
                  </a>
                  <a href="mailto:contact@canyonlife.fr" className={styles.contactButton} style={{ textDecoration: 'none', borderColor: clientColor }}>
                    <div>
                      <strong>✉️ {t('SendEmail')}</strong>
                      <p style={{ margin: 0 }}>contact@canyonlife.fr</p>
                    </div>
                  </a>
                </div>
              </div>
            )
          ) : (
            visibleSessions.map((session) => {
              const availableSpots = getAvailableSpots(session);

              // Vérifier si le produit actuel est fermé automatiquement
              const currentProductInSession = session.products.find(p => p.product.id === product.id);
              const isAutoClosed = currentProductInSession?.product?.isAutoClosed || false;

              const isAvailable = session.status === 'open' && availableSpots > 0 && !isAutoClosed;

              if (isSessionReservedByOtherProduct(session)) {
                return null; // Ne pas afficher cette session
              }

              return (
                <div
                  key={session.id}
                  className={`${styles.sessionCard} ${(!isAvailable || isAutoClosed) ? styles.disabled : ''}`}
                  style={isAutoClosed ? {
                    border: '2px solid #ffc107',
                    background: 'linear-gradient(135deg, #fff3cd 0%, #ffffff 100%)'
                  } : {}}
                >
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionTime}>
                      <span className={styles.timeSlot}>{getTimeSlotLabel(session.timeSlot)}</span>
                      <span className={styles.startTime} style={{ color: clientColor }}>{session.startTime}</span>
                    </div>
                    <div className={styles.sessionDetails}>
                      <p>Guide: {session.guide.login}</p>
                      <p>
                        {t('placeDispo')} <strong>{availableSpots}</strong>
                      </p>
                      {session.shoeRentalAvailable && (
                        <p className={styles.shoeRental}>
                          {t('LocShoes')}: {session.shoeRentalPrice}€
                        </p>
                      )}
                      {isAutoClosed && (
                        <p style={{
                          color: '#856404',
                          fontWeight: '600',
                          marginTop: '0.5rem',
                          fontSize: '0.9rem'
                        }}>
                          ⚠️ {t('calendarEmbed.closedOnline')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.sessionActions}>
                    {isAutoClosed ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        background: '#fff3cd',
                        borderRadius: '6px',
                        border: '1px solid #ffc107'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#856404', fontWeight: '600', fontSize: '0.9rem' }}>
                          {t('calendarEmbed.bookingClosedOnline')}
                        </p>
                        <p style={{ margin: 0, color: '#856404', fontSize: '0.8rem', lineHeight: '1.3' }}>
                          📞 {t('calendarEmbed.callGuideToBook')}
                        </p>
                      </div>
                    ) : isAvailable ? (
                      <button
                        onClick={() => handleBookSession(session.id)}
                        className={styles.btnPrimary}
                        style={{ backgroundColor: clientColor, borderColor: clientColor }}
                      >
                        {t('Réserver')}
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
    </div>
  );
};

export default CanyonDetails;
