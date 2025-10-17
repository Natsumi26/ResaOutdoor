import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sessionsAPI } from '../../services/api';
import styles from './ClientPages.module.css';


const CanyonSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    participants: searchParams.get('participants') || '',
    date: searchParams.get('date') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Construire les paramètres de recherche
      const params = {};

      if (filters.participants) {
        params.participants = filters.participants;
      }

      // Utiliser soit la date spécifique, soit la période
      if (filters.date) {
        params.date = filters.date;
      } else if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      }

      // Utiliser la nouvelle API de recherche
      const response = await sessionsAPI.searchAvailable(params);
      setProducts(response.data.products || []);

      console.log('Filtres actifs:', filters);
      console.log('Produits trouvés:', response.data.count);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };

    // Si on change la date spécifique, réinitialiser la période
    if (name === 'date' && value) {
      newFilters.startDate = '';
      newFilters.endDate = '';
    }

    // Si on change la période, réinitialiser la date spécifique
    if ((name === 'startDate' || name === 'endDate') && value) {
      newFilters.date = '';
    }

    setFilters(newFilters);

    // Mettre à jour les paramètres URL
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      participants: '',
      date: '',
      startDate: '',
      endDate: ''
    });
    setSearchParams({});
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

  if (loading) {
    return <div className={styles.loading}>Chargement des canyons...</div>;
  }

  return (
    <> 
  <div className={styles.clientContainer}>
      <div className={styles.searchHeader}>
        <h1>Trouvez votre canyon idéal</h1>
        <p>Découvrez nos canyons en Haute-Savoie et Isère</p>
      </div>

      {/* Filtres */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label>Nombre de participants</label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 4"
              value={filters.participants}
              onChange={(e) => handleFilterChange('participants', e.target.value)}
            />
          </div>
          {/* Periode */}
          <div className={styles.periode}>
            Période Souhaitée :
            <div className={styles.filterGroup}>
              <label>Date de début</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={!!filters.date}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Date de fin</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate || new Date().toISOString().split('T')[0]}
                disabled={!!filters.date}
              />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label>OU Date spécifique</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={!!(filters.startDate || filters.endDate)}
            />
          </div>

          <div className={styles.filterGroup}>
            <button onClick={handleResetFilters} className={styles.btnReset}>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <h2>{products.length} canyon{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}</h2>
        </div>

        {products.length === 0 ? (
          <div className={styles.noResults}>
            <p>Aucun canyon ne correspond à vos critères.</p>
            <button onClick={handleResetFilters} className={styles.btnPrimary}>
              Voir tous les canyons
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
    </>
  );
};

export default CanyonSearch;
