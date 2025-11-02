import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI, uploadAPI } from '../services/api';
import styles from './Common.module.css';

const Preferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Préférences personnelles
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [slogan, setSlogan] = useState('');

  // Préférences de thème
  const [themeColors, setThemeColors] = useState({
    primary: '#3498db',
    secondary: '#2c3e50',
    clientButton: '#3498db',
    clientAccent: '#3498db',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
  });

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [bookingReminders, setBookingReminders] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);

      // Charger les settings depuis l'API
      const response = await settingsAPI.get();
      const settings = response.data.settings;

      if (settings) {
        setCompanyName(settings.companyName || '');
        setPhone(settings.companyPhone || '');
        setEmail(settings.companyEmail || '');
        setWebsite(settings.website || '');
        setLogo(settings.logo || '');
        setSlogan(settings.slogan || '');

        if (settings.primaryColor) {
          setThemeColors(prev => ({
            ...prev,
            primary: settings.primaryColor,
            secondary: settings.secondaryColor || prev.secondary,
            clientButton: settings.clientButtonColor || prev.clientButton,
            clientAccent: settings.clientAccentColor || prev.clientAccent
          }));
        }
      }

      // Fallback sur les données du user si settings vides
      if (!settings?.companyEmail && user?.email) {
        setEmail(user.email);
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
      // Fallback sur les données du user en cas d'erreur
      setEmail(user?.email || '');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaveMessage('');

      // Sauvegarder les settings via l'API
      await settingsAPI.update({
        companyName,
        companyPhone: phone,
        companyEmail: email,
        website,
        logo,
        slogan,
        primaryColor: themeColors.primary,
        secondaryColor: themeColors.secondary,
        clientButtonColor: themeColors.clientButton,
        clientAccentColor: themeColors.clientAccent
      });

      // Sauvegarder les couleurs dans localStorage pour éviter le flash au chargement
      localStorage.setItem('clientThemeColor', themeColors.clientButton);
      localStorage.setItem('guidePrimaryColor', themeColors.primary);
      localStorage.setItem('guideSecondaryColor', themeColors.secondary);

      // Mettre à jour les CSS variables pour changement immédiat
      document.documentElement.style.setProperty('--guide-primary', themeColors.primary);
      document.documentElement.style.setProperty('--guide-secondary', themeColors.secondary);
      const extractRGB = (hex) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      };
      document.documentElement.style.setProperty('--guide-primary-rgb', extractRGB(themeColors.primary));
      document.documentElement.style.setProperty('--guide-secondary-rgb', extractRGB(themeColors.secondary));

      setSaveMessage('✅ Préférences sauvegardées avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2MB');
      return;
    }

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append('logo', file);

      const response = await uploadAPI.logo(formData);
      const logoUrl = response.data.url;

      setLogo(logoUrl);

      // Sauvegarder automatiquement le logo dans les settings
      await settingsAPI.updateLogo({ logo: logoUrl });

      alert('Logo uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload logo:', error);
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleResetTheme = () => {
    setThemeColors({
      primary: '#3498db',
      secondary: '#2c3e50',
      clientButton: '#3498db',
      clientAccent: '#3498db',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
    });
  };

  if (loading && !phone && !email) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>⚙️ Préférences</h1>
        <p>Personnalisez votre expérience et gérez vos paramètres</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Informations personnelles */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px' }}>
            Informations personnelles
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Mettez à jour vos coordonnées pour être contacté par vos clients
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Canyon Life"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Site internet
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.canyon-life.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Pour une sortie exceptionnelle"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Utilisé dans les bons cadeaux (en dessous du logo)
              </small>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Logo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {logo && (
                  <img
                    src={`http://localhost:5000${logo}`}
                    alt="Logo"
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'contain',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '5px',
                      background: 'white'
                    }}
                  />
                )}
                <label style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px dashed #dee2e6',
                  borderRadius: '6px',
                  textAlign: 'center',
                  cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                  background: uploadingLogo ? '#f8f9fa' : 'white',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem',
                  color: '#6c757d'
                }}>
                  {uploadingLogo ? 'Upload en cours...' : 'Cliquez pour uploader'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Image PNG, JPG ou WEBP (max 2MB). Sera utilisé dans les emails.
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            {saveMessage && (
              <div style={{
                padding: '10px 16px',
                background: saveMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: saveMessage.includes('✅') ? '#155724' : '#721c24',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '500',
                border: `1px solid ${saveMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {saveMessage}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '12px 28px',
                background: loading ? '#dee2e6' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 2px 6px rgba(40, 167, 69, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = '#218838';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = '#28a745';
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Thème Guide */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            👨‍💼 Thème Guide
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Personnalisez le dégradé de l'interface guide (sidebar et bouton Session)
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Dégradé - Début
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Dégradé - Fin
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            background: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#6c757d',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ℹ️ Ces couleurs s'appliquent uniquement à l'interface guide (sidebar et bouton Session)
          </div>
        </div>

        {/* Thème Client */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            👥 Thème Client
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Personnalisez la couleur de l'interface client
          </p>

          <div style={{ marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Couleur du thème
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '400px' }}>
                <input
                  type="color"
                  value={themeColors.clientButton}
                  onChange={(e) => setThemeColors({ ...themeColors, clientButton: e.target.value, clientAccent: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.clientButton}
                  onChange={(e) => setThemeColors({ ...themeColors, clientButton: e.target.value, clientAccent: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            background: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#6c757d',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ℹ️ Cette couleur s'applique à tous les éléments de l'interface client
          </div>
        </div>

        {/* Bouton Reset */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <button
            onClick={handleResetTheme}
            style={{
              padding: '12px 24px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            🔄 Réinitialiser toutes les couleurs
          </button>
        </div>

        {/* Notifications */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🔔 Notifications
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Choisissez comment vous souhaitez être informé
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>📧 Notifications par email</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Recevoir des emails pour les nouvelles réservations et modifications
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>📱 Notifications par SMS</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Recevoir des SMS pour les réservations urgentes (nécessite un numéro de téléphone)
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <input
                type="checkbox"
                checked={bookingReminders}
                onChange={(e) => setBookingReminders(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>⏰ Rappels de réservation</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Recevoir un rappel 24h avant chaque session
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '15px',
          marginTop: '30px',
          alignItems: 'center'
        }}>
          {saveMessage && (
            <div style={{
              padding: '12px 20px',
              background: saveMessage.includes('✅') ? '#d4edda' : '#f8d7da',
              color: saveMessage.includes('✅') ? '#155724' : '#721c24',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
              {saveMessage}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '14px 35px',
              background: loading ? '#dee2e6' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(40, 167, 69, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#218838';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = '#28a745';
            }}
          >
            {loading ? '⏳ Enregistrement...' : '💾 Enregistrer les préférences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
