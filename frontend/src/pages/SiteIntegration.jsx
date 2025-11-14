import React, { useState, useEffect } from 'react';
import { productsAPI, settingsAPI } from '../services/api';
import styles from './SiteIntegration.module.css';

const SiteIntegration = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [clientColor, setClientColor] = useState('#3498db');

  // Configuration de l'iframe
  const [iframeType, setIframeType] = useState('search'); // search, calendar-only
  const [selectedProduct, setSelectedProduct] = useState('');
  const [filterMode, setFilterMode] = useState('individual'); // 'individual' ou 'team'

  // Modal preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalSize, setModalSize] = useState({ width: 90, height: 90 }); // en pourcentage
  const [devicePreset, setDevicePreset] = useState('desktop');

  // Préréglages pour différents appareils
  const devicePresets = {
    desktop: { width: 90, height: 90, label: '💻 Desktop' },
    tablet: { width: 768, height: 1024, label: '📱 Tablette', fixed: true },
    mobile: { width: 375, height: 667, label: '📱 Mobile', fixed: true }
  };

  const applyDevicePreset = (preset) => {
    setDevicePreset(preset);
    if (devicePresets[preset].fixed) {
      // Pour mobile et tablette, on utilise des pixels fixes
      setModalSize({
        width: devicePresets[preset].width,
        height: devicePresets[preset].height,
        fixed: true
      });
    } else {
      // Pour desktop, on utilise des pourcentages
      setModalSize({
        width: devicePresets[preset].width,
        height: devicePresets[preset].height,
        fixed: false
      });
    }
  };

  useEffect(() => {
    loadProducts();
    loadUser();
    loadSettings();
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

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;
      if (settings?.clientButtonColor) {
        setClientColor(settings.clientButtonColor);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
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

    // Ajouter la couleur client si elle est différente de la valeur par défaut
    if (clientColor && clientColor !== '#3498db') {
      filterParams.push(`color=${encodeURIComponent(clientColor)}`);
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
        </div>

        {/* Bouton pour ouvrir l'aperçu */}
        <div className={styles.previewSection}>
          <h2>👁️ Aperçu</h2>
          <button
            onClick={() => {
              setShowPreviewModal(true);
              applyDevicePreset('desktop');
            }}
            className={styles.openPreviewButton}
            disabled={iframeType === 'calendar-only' && !selectedProduct}
          >
            Ouvrir l'aperçu
          </button>
          {iframeType === 'calendar-only' && !selectedProduct && (
            <small className={styles.description}>
              Veuillez sélectionner un canyon pour voir l'aperçu
            </small>
          )}
        </div>
      </div>

      {/* Modal d'aperçu redimensionnable */}
      {showPreviewModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPreviewModal(false)}>
          <div
            className={styles.modalContainer}
            style={{
              width: modalSize.fixed ? `${modalSize.width}px` : `${modalSize.width}vw`,
              height: modalSize.fixed ? `${modalSize.height}px` : `${modalSize.height}vh`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <h3>👁️ Aperçu de l'intégration</h3>
                {modalSize.fixed && (
                  <span className={styles.dimensions}>
                    {modalSize.width} × {modalSize.height} px
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.devicePresets}>
              <button
                onClick={() => applyDevicePreset('desktop')}
                className={`${styles.presetButton} ${devicePreset === 'desktop' ? styles.active : ''}`}
              >
                💻 Desktop
              </button>
              <button
                onClick={() => applyDevicePreset('tablet')}
                className={`${styles.presetButton} ${devicePreset === 'tablet' ? styles.active : ''}`}
              >
                📱 Tablette
              </button>
              <button
                onClick={() => applyDevicePreset('mobile')}
                className={`${styles.presetButton} ${devicePreset === 'mobile' ? styles.active : ''}`}
              >
                📱 Mobile
              </button>
            </div>
            <div className={styles.modalBody}>
              <iframe
                src={getIframeUrl()}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
                allow="payment"
                allowFullScreen
                title="Preview Modal"
              />
            </div>
            <div
              className={styles.resizeHandle}
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = modalSize.width;
                const startHeight = modalSize.height;
                const isFixedSize = modalSize.fixed;

                const handleMouseMove = (moveEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const deltaY = moveEvent.clientY - startY;

                  if (isFixedSize) {
                    // Redimensionnement en pixels
                    const newWidth = startWidth + deltaX;
                    const newHeight = startHeight + deltaY;

                    setModalSize({
                      width: Math.max(300, Math.min(window.innerWidth - 40, newWidth)),
                      height: Math.max(300, Math.min(window.innerHeight - 40, newHeight)),
                      fixed: true
                    });
                  } else {
                    // Redimensionnement en pourcentage
                    const newWidth = startWidth + (deltaX / window.innerWidth) * 100;
                    const newHeight = startHeight + (deltaY / window.innerHeight) * 100;

                    setModalSize({
                      width: Math.max(30, Math.min(95, newWidth)),
                      height: Math.max(30, Math.min(95, newHeight)),
                      fixed: false
                    });
                  }

                  // Passer en mode custom lors du redimensionnement manuel
                  setDevicePreset('custom');
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteIntegration;