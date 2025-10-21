import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, sessionsAPI } from '../../services/api';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';

const CanyonDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    loadProduct();
    generateWeekDates();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      loadSessions();
    }
  }, [selectedDate]);

  const generateWeekDates = () => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(today, i));
    }
    setWeekDates(dates);
    setSelectedDate(today);
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

  if (loading) {
    return <div className={styles.loading}>{t('Chargement')}...</div>;
  }

  if (!product) {
    return <div className={styles.error}>{t('noProduct')}</div>;
  }

  return (
    <div className={styles.clientContainer}>
      {/* Galerie photos */}
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

      {/* Informations du canyon */}
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

      {/* Sessions disponibles */}
      <div className={styles.sessionsSection}>
        <h2>{t('ResaSession')}</h2>

        {/* Sélecteur de date */}
        <div className={styles.dateSelector}>
          {weekDates.map((date, index) => (
            <button
              key={index}
              className={`${styles.dateBtn} ${
                selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  ? styles.active
                  : ''
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className={styles.dateDay}>{format(date, 'EEE', { locale: fr })}</div>
              <div className={styles.dateNumber}>{format(date, 'd', { locale: fr })}</div>
              <div className={styles.dateMonth}>{format(date, 'MMM', { locale: fr })}</div>
            </button>
          ))}
        </div>

        {/* Liste des sessions */}
        <div className={styles.sessionsList}>
          {sessions.length === 0 ? (
            <div className={styles.noSessions}>
              <p>{t('noSessionDispo')}</p>
              <p className={styles.hint}>{t('MoreDate')}</p>
            </div>
          ) : (
            sessions.map((session) => {
              const availableSpots = getAvailableSpots(session);
              const isAvailable = session.status === 'open' && availableSpots > 0;

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
  );
};

export default CanyonDetails;
