import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sessionsAPI } from '../../services/api';
import DateRangePicker from '../../components/DateRangePicker';
import styles from './ClientPages.module.css';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { format, addDays} from 'date-fns';
import { useLocation } from 'react-router-dom';


const CanyonSearch = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const startDateParam = queryParams.get('startDate'); // format attendu : yyyy-MM-dd
  const [selectedDate, setSelectedDate] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextAvailableDates, setNextAvailableDates] = useState([]);
  const [filters, setFilters] = useState({
    participants: searchParams.get('participants') || '',
    date: searchParams.get('date') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // Retirer le chargement automatique au démarrage
  useEffect(() => {
    if (startDateParam) {
      const parsedDate = new Date(startDateParam);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }

    // Ne charger que si les paramètres URL sont présents
    const hasParams = searchParams.get('participants') || searchParams.get('date') || searchParams.get('startDate');
    if (hasParams && filters.participants && (filters.date || (filters.startDate && filters.endDate))) {
      loadProducts();
    }
  }, []);

  const loadProducts = async (customFilters = null) => {
    const currentFilters = customFilters || filters;

    // Vérifier que les champs requis sont remplis
    if (!currentFilters.participants) {
      return;
    }

    if (!currentFilters.date && !(currentFilters.startDate && currentFilters.endDate)) {
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      // Construire les paramètres de recherche
      const params = {};

      if (currentFilters.participants) {
        params.participants = currentFilters.participants;
      }

      // Utiliser soit la date spécifique, soit la période
      if (currentFilters.date) {
        params.date = currentFilters.date;
      } else if (currentFilters.startDate && currentFilters.endDate) {
        params.startDate = currentFilters.startDate;
        params.endDate = currentFilters.endDate;
      }

      // Utiliser la nouvelle API de recherche
      const response = await sessionsAPI.searchAvailable(params);
      console.log(response)
      setProducts(response.data.products || []);

      // Si aucun produit trouvé, chercher les 2 prochaines dates disponibles
      if (!response.data.products || response.data.products.length === 0) {
        try {
          const nextDatesResponse = await sessionsAPI.getNextAvailableDates(currentFilters.participants);
          setNextAvailableDates(nextDatesResponse.data.dates || []);
        } catch (err) {
          console.error('Erreur récupération prochaines dates:', err);
          setNextAvailableDates([]);
        }
      } else {
        setNextAvailableDates([]);
      }

      console.log('Filtres actifs:', currentFilters);
      console.log('Produits trouvés:', response.data.count);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
      setNextAvailableDates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (startDate, endDate) => {
    const newFilters = { ...filters };

    if (startDate && !endDate) {
      // Date unique
      newFilters.date = startDate;
      newFilters.startDate = '';
      newFilters.endDate = '';
      setSelectedDate(new Date(startDate));
    } else if (startDate && endDate) {
      // Période
      newFilters.date = '';
      newFilters.startDate = startDate;
      newFilters.endDate = endDate;
      setSelectedDate(new Date(startDate));
    } else {
      // Réinitialisation
      newFilters.date = '';
      newFilters.startDate = '';
      newFilters.endDate = '';
      setSelectedDate(null);
    }

    setFilters(newFilters);

    // Mettre à jour les paramètres URL
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);

    // Lancer automatiquement la recherche si les critères sont remplis
    if (newFilters.participants && (newFilters.date || (newFilters.startDate && newFilters.endDate))) {
      loadProducts(newFilters);
    } else if (!startDate && !endDate) {
      // Si réinitialisation, effacer les résultats
      setProducts([]);
      setHasSearched(false);
      setNextAvailableDates([]);
    }
  };

  const handleParticipantsChange = (value) => {
    const newFilters = { ...filters, participants: value };
    setFilters(newFilters);

    // Mettre à jour les paramètres URL
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const handleSearch = () => {
    loadProducts();
    // Scroll automatique vers les résultats après un court délai
    setTimeout(() => {
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleResetFilters = () => {
    setFilters({
      participants: '',
      date: '',
      startDate: '',
      endDate: ''
    });
    setSearchParams({});
    setHasSearched(false);
    setProducts([]);
    setNextAvailableDates([]);
    setShowCalendar(false);
  };

  const canSearch = filters.participants && (filters.date || (filters.startDate && filters.endDate));

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

  const getLevelColor = (level) => {
    const colorMap = {
      'découverte': '#28a745',
      'aventure': '#fd7e14',
      'sportif': '#dc3545'
    };
    return colorMap[level?.toLowerCase()] || '#6c757d';
  };

  // Afficher l'interface de recherche (toujours visible maintenant)
  return (
    <div className={styles.searchPageContainer}>
      <div className={styles.searchBox} style={{ marginTop: '2rem' }}>
        {/* Header avec traduction */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem', fontWeight: 700 }}>
              Trouvez et réservez votre sortie
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Informations de contact */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#495057', lineHeight: 1.5, textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            Pour les réservations de groupe : <a href="tel:+33688788186" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 600 }}>06 88 78 81 86</a> - <a href="mailto:contact@canyonlife.fr" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 600 }}>contact@canyonlife.fr</a>
          </p>
        </div>

        {/* Bouton Bon Cadeau */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/client/gift-voucher')}
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s',
              opacity: '0.9'
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = '1';
              e.target.style.background = '#5a6268';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '0.9';
              e.target.style.background = '#6c757d';
            }}
          >
            🎁 {t('achatGift') || 'Acheter un bon cadeau'}
          </button>
        </div>

          {/* Section Date */}
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#495057' }}>
              Date
            </label>
            <input
              type="text"
              readOnly
              value={
                filters.date
                  ? new Date(filters.date).toLocaleDateString('fr-FR')
                  : filters.startDate && filters.endDate
                  ? `${new Date(filters.startDate).toLocaleDateString('fr-FR')} - ${new Date(filters.endDate).toLocaleDateString('fr-FR')}`
                  : 'vendredi 24 oct.'
              }
              onClick={() => setShowCalendar(!showCalendar)}
              placeholder="Sélectionner une date"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: 'white'
              }}
            />
            {showCalendar && (
              <div style={{ marginTop: '0.75rem' }}>
                <DateRangePicker
                  onDateChange={(start, end) => {
                    handleDateChange(start, end);
                    if (start) setShowCalendar(false);
                  }}
                  initialStartDate={filters.startDate || filters.date}
                  initialEndDate={filters.endDate}
                />
              </div>
            )}
          </div>

          {/* Nombre de participants */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#495057' }}>
              {t('NbrParticipants')} *
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 4"
              value={filters.participants}
              onChange={(e) => handleParticipantsChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

        {/* Bouton de recherche */}
        <button
          onClick={handleSearch}
          className={styles.searchButton}
          disabled={!canSearch || loading}
        >
          {loading ? t('RechercheLoading') || 'Recherche en cours...' : t('Rechercher')}
        </button>
      </div>

      {/* Résultats en dessous */}
      {hasSearched && (
        <div id="results" style={{ marginTop: '2rem', width: '100%', maxWidth: '1200px', background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {products.length > 0 ? (
            <>
              <div className={styles.resultsHeader}>
                <h2 style={{ fontSize: '1rem', color: '#6c757d', fontWeight: '500' }}>
                  {products.length} canyon{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {products.map((product) => {
                  // Grouper les sessions par date
                  const sessionsByDate = {};
                  if (product.availableSessions && product.availableSessions.length > 0) {
                    product.availableSessions.forEach(session => {
                      const dateKey = session.date.split('T')[0]; // Extraire juste la date YYYY-MM-DD
                      if (!sessionsByDate[dateKey]) {
                        sessionsByDate[dateKey] = [];
                      }
                      sessionsByDate[dateKey].push({
                        ...session,
                        id: session.sessionId,
                        availablePlaces: session.availableCapacity
                      });
                    });
                  }

                  const hasSessions = Object.keys(sessionsByDate).length > 0;

                  return (
                    <div key={product.id} className={styles.canyonCard}>
                      {/* Image à gauche/haut */}
                      <div className={styles.canyonCardImage}>
                        {product.images && product.images.length > 0 ? (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(${product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <button
                              onClick={() => navigate(`/client/canyon/${product.id}?startDate=${filters.date || filters.startDate}`)}
                              style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'white',
                                color: '#3498db',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#3498db';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.color = '#3498db';
                              }}
                            >
                              Plus d'infos
                            </button>
                          </div>
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: product.color || '#dee2e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => navigate(`/client/canyon/${product.id}?startDate=${filters.date || filters.startDate}`)}
                              style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'white',
                                color: '#3498db',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                              }}
                            >
                              Plus d'infos
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Contenu à droite/bas */}
                      <div className={styles.canyonCardContent}>
                        {/* Titre avec prix */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3rem' }}>
                              {product.name.toUpperCase()}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>À partir de</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', lineHeight: 1 }}>
                                {product.priceIndividual},00 €
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#495057', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '14px', height: '14px', background: '#2c3e50', borderRadius: '50%', display: 'inline-block' }}></span>
                              <span>Durée : {getDurationLabel(product.duration)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '14px', height: '14px', background: getLevelColor(product.level), borderRadius: '50%', display: 'inline-block' }}></span>
                              <span>Difficulté : {product.level}</span>
                            </div>
                          </div>
                        </div>

                        {/* Lieu de départ */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '0.25rem' }}>
                            Lieu de départ
                          </div>
                          <div style={{ color: '#3498db', fontSize: '0.95rem' }}>
                            {product.meetingPoint || (product.region === 'annecy' ? 'Devant la mairie de Thônes' : 'Parking canyon')}
                          </div>
                        </div>

                        {/* Créneaux disponibles groupés par date */}
                        {hasSessions ? (
                          <div style={{ marginBottom: '1rem', flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '0.75rem' }}>
                              Créneaux disponibles :
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {Object.entries(sessionsByDate).map(([date, sessions]) => (
                                <div key={date} style={{
                                  background: '#f8f9fa',
                                  padding: '1rem',
                                  borderRadius: '8px',
                                  border: '1px solid #e9ecef'
                                }}>
                                  {/* Date */}
                                  <div style={{
                                    fontWeight: '600',
                                    color: '#2c3e50',
                                    marginBottom: '0.75rem',
                                    fontSize: '0.95rem'
                                  }}>
                                    📅 {new Date(date).toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long'
                                    })}
                                  </div>

                                  {/* Créneaux horaires pour cette date */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {sessions.map((session) => (
                                      <button
                                        key={session.sessionId || session.id}
                                        className={styles.timeSlotButton}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const sessionId = session.sessionId || session.id;
                                          navigate(`/client/book/${sessionId}?productId=${product.id}`);
                                        }}
                                      >
                                        <span style={{ fontSize: '1.1rem' }}>🕐 {session.startTime}</span>
                                        <span style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
                                          {session.availablePlaces} places
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            padding: '1rem',
                            background: '#fff3cd',
                            borderRadius: '6px',
                            color: '#856404',
                            fontSize: '0.9rem',
                            marginBottom: '1rem'
                          }}>
                            ⚠️ Aucun créneau disponible pour cette période
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.noResults}>
              <h2>{t('Désolé')} !</h2>
              <p>{t('NoResult')}</p>

              {/* Afficher les 2 prochaines dates disponibles */}
              {nextAvailableDates.length > 0 && (
                <div className={styles.alternativeDatesSection}>
                  <h3>{t('Flexible')}</h3>
                  <p>{t('dateDispo')}</p>
                  <div className={styles.alternativeDateButtons}>
                    {nextAvailableDates.slice(0, 2).map((dateInfo, index) => (
                      <button
                        key={index}
                        className={styles.alternativeDateButton}
                        onClick={() => {
                          // Mettre à jour les filtres avec cette date et rechercher
                          const newFilters = {
                            ...filters,
                            date: dateInfo.date,
                            startDate: '',
                            endDate: ''
                          };
                          setFilters(newFilters);

                          // Mettre à jour l'URL
                          const params = new URLSearchParams();
                          Object.keys(newFilters).forEach(key => {
                            if (newFilters[key]) params.set(key, newFilters[key]);
                          });
                          setSearchParams(params);

                          // Lancer la recherche immédiatement avec les nouveaux filtres
                          loadProducts(newFilters);
                        }}
                      >
                        {new Date(dateInfo.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations de contact */}
              <div className={styles.contactCard}>
                <h3>Sinon</h3>
                <p>Téléphonez-nous, il est possible d'ouvrir de nouveaux créneaux sur demande !</p>
                <div className={styles.contactInfo}>
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

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CanyonSearch;
