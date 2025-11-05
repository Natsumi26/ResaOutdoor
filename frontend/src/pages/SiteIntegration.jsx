import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import styles from './SiteIntegration.module.css';

const SiteIntegration = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Configuration de l'iframe
  const [iframeType, setIframeType] = useState('search'); // search, calendar-only
  const [selectedProduct, setSelectedProduct] = useState('');
  const [filterMode, setFilterMode] = useState('individual'); // 'individual' ou 'team'

  useEffect(() => {
    loadProducts();
    loadUser();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      console.log(response)
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const getIframeUrl = () => {
    const baseUrl = window.location.origin;

    // Construire les paramètres de filtrage
    const filterParams = [];
    if (filterMode === 'team' && user?.teamName) {
      filterParams.push(`teamName=${encodeURIComponent(user.teamName)}`);
    } else if (filterMode === 'individual' && user?.id) {
      filterParams.push(`guideId=${user.id}`);
    }

    // Ajouter le produit sélectionné si nécessaire
    if (selectedProduct && iframeType === 'search') {
      filterParams.push(`productId=${selectedProduct}`);
    }

    const queryString = filterParams.length > 0 ? `?${filterParams.join('&')}` : '';

    switch (iframeType) {
      case 'search':
        return `${baseUrl}/client/search${queryString}`;

      case 'calendar-only':
        if (!selectedProduct) return `${baseUrl}/client/search${queryString}`;
        return `${baseUrl}/client/embed/calendar/${selectedProduct}${queryString}`;

      default:
        return `${baseUrl}/client/search${queryString}`;
    }
  };

  const getIframeCode = () => {
    const url = getIframeUrl();

    return `<iframe
  src="${url}"
  style="width: 100%; min-height: 800px; border: none; border-radius: 8px;"
  allow="payment"
  allowfullscreen>
</iframe>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getIframeCode());
    alert('Code copié dans le presse-papiers !');
  };

  const getDescription = () => {
    switch (iframeType) {
      case 'search':
        return 'Page de recherche complète avec filtres. Vous pouvez pré-filtrer par un canyon spécifique.';
      case 'calendar-only':
        return 'Uniquement le calendrier de disponibilités. Cliquable pour rediriger vers le formulaire de réservation.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔗 Intégration à mon site</h1>
        <p>Générez des iframes pour intégrer vos pages de réservation dans votre site WordPress</p>
        <div style={{
          background: '#e3f2fd',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#1976d2',
          marginTop: '1rem'
        }}>
          ℹ️ <strong>Tout le parcours de réservation se fait dans l'iframe</strong> : recherche, formulaire, participants, paiement et confirmation.
          Vos clients restent sur votre site WordPress tout au long de leur réservation.
        </div>
      </div>

      <div className={styles.content}>
        {/* Configuration */}
        <div className={styles.configSection}>
          <h2>⚙️ Configuration de l'iframe</h2>

          {/* Mode de filtrage : Individuel ou Équipe */}
          {user?.teamName && (
            <div className={styles.formGroup}>
              <label>Filtrer les produits et sessions par</label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className={styles.select}
              >
                <option value="individual">👤 Individuel (seulement mes produits/sessions)</option>
                <option value="team">👥 Équipe ({user.teamName})</option>
              </select>
              <small className={styles.description}>
                {filterMode === 'team'
                  ? `Affichera tous les produits et sessions de l'équipe "${user.teamName}"`
                  : 'Affichera uniquement vos propres produits et sessions'}
              </small>
            </div>
          )}

          {/* Type d'iframe */}
          <div className={styles.formGroup}>
            <label>Type de page à intégrer</label>
            <select
              value={iframeType}
              onChange={(e) => setIframeType(e.target.value)}
              className={styles.select}
            >
              <option value="search">🔍 Page de recherche</option>
              <option value="calendar-only">📅 Calendrier uniquement</option>
            </select>
            <small className={styles.description}>{getDescription()}</small>
          </div>

          {/* Sélection du produit */}
          {(iframeType === 'search' || iframeType === 'calendar-only') && (
            <div className={styles.formGroup}>
              <label>
                {iframeType === 'search' ? 'Filtrer par canyon (optionnel)' : 'Sélectionner un canyon'}
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className={styles.select}
              >
                {iframeType === 'search' && <option value="">Tous les canyons</option>}
                {iframeType !== 'search' && <option value="">-- Sélectionner un canyon --</option>}
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Code généré */}
          <div className={styles.formGroup}>
            <label>Code HTML à copier</label>
            <div className={styles.codeBlock}>
              <pre>{getIframeCode()}</pre>
              <button onClick={copyToClipboard} className={styles.copyButton}>
                📋 Copier
              </button>
            </div>
          </div>

        {/* Preview */}
        <div className={styles.previewSection}>
          <h2>👁️ Aperçu</h2>
          <div className={styles.previewContainer}>
            {iframeType !== 'calendar-only' || selectedProduct ? (
              <iframe
                src={getIframeUrl()}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                allow="payment"
                allowFullScreen
                title="Preview"
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                Veuillez sélectionner un canyon pour voir l'aperçu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SiteIntegration;