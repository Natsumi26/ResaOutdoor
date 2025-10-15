import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productsAPI, sessionsAPI } from '../../services/api';
import styles from './ClientPages.module.css';

const CanyonSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    region: searchParams.get('region') || '',
    level: searchParams.get('level') || '',
    minDuration: searchParams.get('minDuration') || '',
    maxDuration: searchParams.get('maxDuration') || '',
    date: searchParams.get('date') || ''
  });

  useEffect(() => {
    loadProducts();
  }, [filters.region, filters.level, filters.minDuration, filters.maxDuration, filters.date]);


  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.region) params.region = filters.region;
      if (filters.level) params.level = filters.level;

      const response = await productsAPI.getAll(params);
      let filteredProducts = response.data.products;

      // Filtrer par durée
      if (filters.minDuration) {
        filteredProducts = filteredProducts.filter(p => p.duration >= parseInt(filters.minDuration) * 60);
      }
      if (filters.maxDuration) {
        filteredProducts = filteredProducts.filter(p => p.duration <= parseInt(filters.maxDuration) * 60);
      }

      // Si une date est sélectionnée, vérifier la disponibilité
      if (filters.date) {
        const productsWithAvailability = await Promise.all(
          filteredProducts.map(async (product) => {
            try {
              const sessionsResponse = await sessionsAPI.getAll({
                date: filters.date,
                productId: product.id
              });
              const availableSessions = sessionsResponse.data.sessions.filter(
                s => s.status === 'open' || s.status === 'full'
              );
              return { ...product, availableSessions: availableSessions.length };
            } catch {
              return { ...product, availableSessions: 0 };
            }
          })
        );
        filteredProducts = productsWithAvailability.filter(p => p.availableSessions > 0);
      }
      console.log('Filtres actifs:', filters);
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
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
      region: '',
      level: '',
      minDuration: '',
      maxDuration: '',
      date: ''
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
    <div className={styles.clientContainer}>
      <div className={styles.searchHeader}>
        <h1>Trouvez votre canyon idéal</h1>
        <p>Découvrez nos canyons en Haute-Savoie et Isère</p>
      </div>

      {/* Filtres */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label>Région</label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="">Toutes les régions</option>
              <option value="annecy">Annecy</option>
              <option value="grenoble">Grenoble</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Niveau</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">Tous les niveaux</option>
              <option value="découverte">Découverte</option>
              <option value="aventure">Aventure</option>
              <option value="sportif">Sportif</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Durée minimale</label>
            <select
              value={filters.minDuration}
              onChange={(e) => handleFilterChange('minDuration', e.target.value)}
            >
              <option value="">Aucune</option>
              <option value="2">2h</option>
              <option value="3">3h</option>
              <option value="4">4h</option>
              <option value="5">5h</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Durée maximale</label>
            <select
              value={filters.maxDuration}
              onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
            >
              <option value="">Aucune</option>
              <option value="3">3h</option>
              <option value="4">4h</option>
              <option value="5">5h</option>
              <option value="6">6h</option>
              <option value="8">8h</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Date souhaitée</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
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
  );
};

export default CanyonSearch;
