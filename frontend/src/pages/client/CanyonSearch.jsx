import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sessionsAPI } from '../../services/api';
import DateRangePicker from '../../components/DateRangePicker';
import styles from './ClientPages.module.css';


const CanyonSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Retirer le chargement automatique au démarrage
  useEffect(() => {
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
    } else if (startDate && endDate) {
      // Période
      newFilters.date = '';
      newFilters.startDate = startDate;
      newFilters.endDate = endDate;
    } else {
      // Réinitialisation
      newFilters.date = '';
      newFilters.startDate = '';
      newFilters.endDate = '';
    }

    setFilters(newFilters);

    // Mettre à jour les paramètres URL
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
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

  return (
    <>
  <div className={styles.clientContainer}>
      <div className={styles.searchHeader}>
        <h1>Trouvez votre canyon idéal</h1>
        <p>Découvrez nos canyons en Haute-Savoie et Isère</p>

        {/* Bouton Bon Cadeau */}
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => navigate('/client/gift-voucher')}
            className={styles.btnGiftVoucher}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🎁 Offrir un bon cadeau
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filtersCard}>
        <h2 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Recherchez votre sortie canyon</h2>

        <div className={styles.filterGroup} style={{ marginBottom: '1.5rem' }}>
          <label>Nombre de participants *</label>
          <input
            type="number"
            min="1"
            placeholder="Ex: 4"
            value={filters.participants}
            onChange={(e) => handleParticipantsChange(e.target.value)}
            style={{ maxWidth: '200px' }}
          />
        </div>

        {/* Calendrier personnalisé */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#495057' }}>
            Date ou période souhaitée *
          </label>
          <DateRangePicker
            onDateChange={handleDateChange}
            initialStartDate={filters.startDate || filters.date}
            initialEndDate={filters.endDate}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={handleResetFilters} className={styles.btnReset}>
            Réinitialiser
          </button>
          <button
            onClick={handleSearch}
            className={styles.btnPrimary}
            disabled={!canSearch}
            style={{
              opacity: canSearch ? 1 : 0.5,
              cursor: canSearch ? 'pointer' : 'not-allowed'
            }}
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className={styles.loading}>
          <p>Recherche en cours...</p>
        </div>
      ) : hasSearched ? (
        <div className={styles.resultsSection}>
          {products.length > 0 ? (
            <>
              <div className={styles.resultsHeader}>
                <h2>{products.length} canyon{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}</h2>
              </div>

              <div className={styles.productsGrid}>
                {products.map((product) => (
                  <div key={product.id} className={styles.productCard}>
                    {product.images && product.images.length > 0 ? (
                      <div
                        className={styles.productImage}
                        style={{
                          backgroundImage: `url(${product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`})`
                        }}
                      >
                        <div className={styles.productBadges}>
                          <span className={getLevelBadgeClass(product.level)}>
                            {product.level}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.productImage} style={{ backgroundColor: product.color }}>
                        <div className={styles.productBadges}>
                          <span className={getLevelBadgeClass(product.level)}>
                            {product.level}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={styles.productContent}>
                      <h3>{product.name}</h3>
                      {product.shortDescription && (
                        <p className={styles.productDescription}>{product.shortDescription}</p>
                      )}

                      <div className={styles.productInfo}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoIcon}>⏱️</span>
                          <span>{getDurationLabel(product.duration)}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoIcon}>📍</span>
                          <span>{product.region === 'annecy' ? 'Annecy' : 'Grenoble'}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoIcon}>👥</span>
                          <span>Max {product.maxCapacity} pers.</span>
                        </div>
                      </div>

                      <div className={styles.productFooter}>
                        <div className={styles.productPrice}>
                          <span className={styles.priceLabel}>À partir de</span>
                          <span className={styles.priceAmount}>{product.priceIndividual}€</span>
                          <span className={styles.priceUnit}>/pers</span>
                        </div>
                        <button
                          onClick={() => navigate(`/client/canyon/${product.id}`)}
                          className={styles.btnPrimary}
                        >
                          Réserver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.noResults}>
              <h2>Désolé !</h2>
              <p>Aucun résultat ne semble correspondre à vos critères.</p>

              {/* Afficher les 2 prochaines dates disponibles */}
              {nextAvailableDates.length > 0 && (
                <div className={styles.alternativeDatesSection}>
                  <h3>Vous êtes flexibles ?</h3>
                  <p>Ces dates sont disponibles pour vous.</p>
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
                <h3>Contactez-nous directement</h3>
                <p>Notre équipe se fera un plaisir de vous aider à trouver la sortie canyon qui vous convient !</p>
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <span className={styles.contactIcon}>📞</span>
                    <div>
                      <strong>Téléphone</strong>
                      <p><a href="tel:+33123456789">01 23 45 67 89</a></p>
                    </div>
                  </div>
                  <div className={styles.contactItem}>
                    <span className={styles.contactIcon}>📧</span>
                    <div>
                      <strong>Email</strong>
                      <p><a href="mailto:contact@canyon-aventure.fr">contact@canyon-aventure.fr</a></p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleResetFilters} className={styles.btnSecondary}>
                Modifier ma recherche
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.welcomeMessage}>
          <h2>Prêt pour l'aventure ?</h2>
          <p>Remplissez les critères ci-dessus pour découvrir nos canyons disponibles !</p>
        </div>
      )}
    </div>
    </>
  );
};

export default CanyonSearch;
