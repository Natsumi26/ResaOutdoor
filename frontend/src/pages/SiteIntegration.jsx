import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import styles from './SiteIntegration.module.css';

const SiteIntegration = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuration de l'iframe
  const [iframeType, setIframeType] = useState('search'); // search, canyon-details, calendar-only, booking
  const [selectedProduct, setSelectedProduct] = useState('');
  const [iframeWidth, setIframeWidth] = useState('100%');
  const [iframeHeight, setIframeHeight] = useState('800');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  // Options prédéfinies de dimensions
  const dimensionPresets = [
    { label: 'Pleine largeur (800px hauteur)', width: '100%', height: '800' },
    { label: 'Pleine largeur (600px hauteur)', width: '100%', height: '600' },
    { label: 'Pleine largeur (1000px hauteur)', width: '100%', height: '1000' },
    { label: 'Desktop standard (1200x800)', width: '1200', height: '800' },
    { label: 'Tablette (768x600)', width: '768', height: '600' },
    { label: 'Calendrier compact (100% x 500)', width: '100%', height: '500' },
    { label: 'Personnalisé', width: 'custom', height: 'custom' }
  ];

  useEffect(() => {
    loadProducts();
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

  const getIframeUrl = () => {
    const baseUrl = window.location.origin;

    switch (iframeType) {
      case 'search':
        if (selectedProduct) {
          return `${baseUrl}/client/search?productId=${selectedProduct}`;
        }
        return `${baseUrl}/client/search`;

      case 'canyon-details':
        if (!selectedProduct) return `${baseUrl}/client/search`;
        return `${baseUrl}/client/canyon/${selectedProduct}`;

      case 'calendar-only':
        if (!selectedProduct) return `${baseUrl}/client/search`;
        return `${baseUrl}/client/embed/calendar/${selectedProduct}`;

      case 'booking':
        return `${baseUrl}/client/book/SESSION_ID`;

      default:
        return `${baseUrl}/client/search`;
    }
  };

  const getIframeCode = () => {
    const url = getIframeUrl();
    const width = iframeWidth === 'custom' ? customWidth : iframeWidth;
    const height = iframeHeight === 'custom' ? customHeight : iframeHeight;

    return `<iframe
  src="${url}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  allowfullscreen>
</iframe>`;
  };

  const handleDimensionPresetChange = (e) => {
    const preset = dimensionPresets.find(p => p.label === e.target.value);
    if (preset) {
      setIframeWidth(preset.width);
      setIframeHeight(preset.height);
    }
  };

  const getActualWidth = () => {
    if (iframeWidth === 'custom') return customWidth || '100%';
    return iframeWidth;
  };

  const getActualHeight = () => {
    if (iframeHeight === 'custom') return customHeight || '600';
    return iframeHeight;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getIframeCode());
    alert('Code copié dans le presse-papiers !');
  };

  const getDescription = () => {
    switch (iframeType) {
      case 'search':
        return 'Page de recherche complète avec filtres. Vous pouvez pré-filtrer par un canyon spécifique.';
      case 'canyon-details':
        return 'Page détails d\'un canyon avec calendrier et réservation. Parfait pour intégrer dans une page WordPress dédiée à un canyon.';
      case 'calendar-only':
        return 'Uniquement le calendrier de disponibilités. Cliquable pour rediriger vers le formulaire de réservation.';
      case 'booking':
        return 'Formulaire de réservation (nécessite un ID de session). Sera automatiquement redirigé depuis le calendrier.';
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
      </div>

      <div className={styles.content}>
        {/* Configuration */}
        <div className={styles.configSection}>
          <h2>⚙️ Configuration de l'iframe</h2>

          {/* Type d'iframe */}
          <div className={styles.formGroup}>
            <label>Type de page à intégrer</label>
            <select
              value={iframeType}
              onChange={(e) => setIframeType(e.target.value)}
              className={styles.select}
            >
              <option value="search">🔍 Page de recherche</option>
              <option value="canyon-details">🏔️ Détails d'un canyon</option>
              <option value="calendar-only">📅 Calendrier uniquement</option>
              <option value="booking">📝 Formulaire de réservation</option>
            </select>
            <small className={styles.description}>{getDescription()}</small>
          </div>

          {/* Sélection du produit */}
          {(iframeType === 'search' || iframeType === 'canyon-details' || iframeType === 'calendar-only') && (
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

          {/* Dimensions */}
          <div className={styles.formGroup}>
            <label>Dimensions de l'iframe</label>
            <select
              onChange={handleDimensionPresetChange}
              className={styles.select}
              defaultValue={dimensionPresets[0].label}
            >
              {dimensionPresets.map(preset => (
                <option key={preset.label} value={preset.label}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom dimensions */}
          {(iframeWidth === 'custom' || iframeHeight === 'custom') && (
            <div className={styles.customDimensions}>
              <div className={styles.formGroup}>
                <label>Largeur personnalisée</label>
                <input
                  type="text"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  placeholder="Ex: 100%, 800px, 800"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hauteur personnalisée</label>
                <input
                  type="text"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  placeholder="Ex: 600px, 600"
                  className={styles.input}
                />
              </div>
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

          {/* Note pour booking */}
          {iframeType === 'booking' && (
            <div className={styles.warningBox}>
              ⚠️ <strong>Note :</strong> Le formulaire de réservation nécessite un ID de session spécifique.
              Les utilisateurs seront automatiquement redirigés vers cette page depuis le calendrier.
            </div>
          )}
        </div>

        {/* Preview */}
        <div className={styles.previewSection}>
          <h2>👁️ Aperçu</h2>
          <div className={styles.previewContainer}>
            {(iframeType !== 'canyon-details' && iframeType !== 'calendar-only') || selectedProduct ? (
              <iframe
                src={getIframeUrl()}
                width={getActualWidth()}
                height={getActualHeight()}
                frameBorder="0"
                style={{ border: 'none', borderRadius: '8px', maxWidth: '100%' }}
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
  );
};

export default SiteIntegration;