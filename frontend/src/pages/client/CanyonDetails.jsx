import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, sessionsAPI } from '../../services/api';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';


const CanyonDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startDateParam = searchParams.get('startDate');
  const [product, setProduct] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateAvailability, setDateAvailability] = useState({});
  const [dateInfo, setDateInfo] = useState({}); // Stocke les infos détaillées par date

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
    // Initialiser la date sélectionnée
    const initialDate = startDateParam ? new Date(startDateParam) : new Date();
    setSelectedDate(initialDate);
  }, [id]);

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

      console.log('=== DÉBUT ANALYSE DISPONIBILITÉS ===');
      console.log('Canyon actuel ID:', currentProductId);
      console.log('Nombre de sessions:', allSessions.length);

      // Analyser chaque session
      allSessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        console.log(`\n--- Session du ${dateKey} ---`);
        console.log('Produits dans la session:', session.products.map(p => ({ id: p.product.id, name: p.product.name })));

        // Vérifier si ce produit est dans la session
        const hasThisProduct = session.products.some(p => String(p.product.id) === currentProductId);
        console.log('Ce canyon est dans la session?', hasThisProduct);

        if (hasThisProduct) {
          // Calculer les places disponibles pour ce produit
          const productInSession = session.products.find(p => String(p.product.id) === currentProductId);
          if (productInSession) {
            const maxCapacity = productInSession.product.maxCapacity;
            const booked = session.bookings
              .filter(b => String(b.productId) === currentProductId && b.status !== 'cancelled')
              .reduce((sum, b) => sum + b.numberOfPeople, 0);
            const availablePlaces = maxCapacity - booked;

            console.log(`Places: ${availablePlaces}/${maxCapacity}, statut: ${session.status}`);

            if (session.status === 'open' && availablePlaces > 0) {
              availability[dateKey] = 'available';
              info[dateKey] = { type: 'available', places: availablePlaces };
              console.log('→ VERT (disponible)');
            } else {
              availability[dateKey] = 'full';
              info[dateKey] = { type: 'full' };
              console.log('→ ROUGE (plein/fermé)');
            }
          }
        } else {
          // Ce canyon n'est pas dans la session, vérifier s'il y a d'autres canyons
          const otherProducts = session.products
            .filter(sp => String(sp.product.id) !== currentProductId)
            .map(sp => ({
              id: sp.product.id,
              name: sp.product.name
            }));

          console.log('Autres canyons dans la session:', otherProducts);

          if (otherProducts.length > 0) {
            // Accumuler les sessions et produits pour cette date
            if (!info[dateKey] || info[dateKey].type !== 'available') {
              if (!info[dateKey]) {
                availability[dateKey] = 'otherProduct';
                info[dateKey] = { type: 'otherProduct', sessions: [] };
              } else if (info[dateKey].type === 'otherProduct') {
                // Ajouter à la liste existante
              }

              info[dateKey].sessions.push({
                timeSlot: session.timeSlot,
                startTime: session.startTime,
                products: otherProducts
              });
              console.log('→ JAUNE (autre canyon disponible)');
            }
          }
        }
      });

      // Marquer les dates à venir sans session en rouge
      for (let i = 0; i < 60; i++) {
        const date = addDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!availability[dateKey]) {
          availability[dateKey] = 'closed';
          info[dateKey] = { type: 'closed' };
        }
      }

      console.log('\n=== RÉSULTAT FINAL ===');
      console.log('Disponibilités:', availability);
      console.log('Infos détaillées:', info);

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
        date: formattedDate,
        productId: id
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
    navigate(`/client/book/${sessionId}?productId=${product.id}`);
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
  const visibleSessions = sessions.filter(s => {
    return !s.bookings.some(b => b.productId !== product.id);
  });

  return (
    <div className={styles.clientContainer}>
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
          <div className={styles.priceBox}>
            <span className={styles.priceLabel}>{t('aPartir')}</span>
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
                <span>Complet/Fermé</span>
              </div>
            </div>

            <DateRangePicker
              onDateChange={handleDateChange}
              initialStartDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null}
              initialEndDate={null}
              hideRangeMode={true}
              dateAvailability={dateAvailability}
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
                  ℹ️ Cette date est déjà réservée pour d'autres canyons :
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
            <div className={styles.noSessions}>
              <p>{t('noSessionDispo')}</p>
              <p className={styles.hint}>Essayer une autre date ou contactez-nous pour ouvrir un créneau</p>

              {/* Informations de contact - uniquement si aucune session */}
              <div className={styles.contactInfo} style={{ marginTop: '1.5rem' }}>
                <a href="tel:+33688788186" className={styles.contactButton} style={{ textDecoration: 'none' }}>
                  <div>
                    <strong>📞 Appeler</strong>
                    <p style={{ margin: 0 }}>06 88 78 81 86</p>
                  </div>
                </a>
                <a href="mailto:contact@canyonlife.fr" className={styles.contactButton} style={{ textDecoration: 'none' }}>
                  <div>
                    <strong>✉️ Envoyer un email</strong>
                    <p style={{ margin: 0 }}>contact@canyonlife.fr</p>
                  </div>
                </a>
              </div>
            </div>
          ) : (
            visibleSessions.map((session) => {
              const availableSpots = getAvailableSpots(session);
              const isAvailable = session.status === 'open' && availableSpots > 0;
              if (isSessionReservedByOtherProduct(session)) {
                return null; // Ne pas afficher cette session
              }
              return (
                <div
                  key={session.id}
                  className={`${styles.sessionCard} ${!isAvailable ? styles.disabled : ''}`}
                >
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionTime}>
                      <span className={styles.timeSlot}>{getTimeSlotLabel(session.timeSlot)}</span>
                      <span className={styles.startTime}>{session.startTime}</span>
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
                    </div>
                  </div>
                  <div className={styles.sessionActions}>
                    {isAvailable ? (
                      <button
                        onClick={() => handleBookSession(session.id)}
                        className={styles.btnPrimary}
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
