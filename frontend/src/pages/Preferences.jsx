import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Common.module.css';

const Preferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Préférences personnelles
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('fr');

  // Préférences de thème
  const [themeColors, setThemeColors] = useState({
    primary: '#3498db',
    secondary: '#2c3e50',
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
      // TODO: Appeler l'API pour charger les préférences
      // const response = await preferencesAPI.get();
      // setPhone(response.data.phone || '');
      // setEmail(response.data.email || '');
      // etc.

      // Pour le moment, utiliser les données du user
      setEmail(user?.email || '');
      setPhone(user?.phone || '');
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaveMessage('');

      // TODO: Appeler l'API pour sauvegarder les préférences
      // await preferencesAPI.update({
      //   phone,
      //   email,
      //   language,
      //   themeColors,
      //   emailNotifications,
      //   smsNotifications,
      //   bookingReminders
      // });

      // Simuler la sauvegarde pour le moment
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaveMessage('✅ Préférences sauvegardées avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleResetTheme = () => {
    setThemeColors({
      primary: '#3498db',
      secondary: '#2c3e50',
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
          <h2 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            👤 Informations personnelles
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Mettez à jour vos coordonnées pour être contacté par vos clients
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                📧 Email
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
                📱 Téléphone
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

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
              🌍 Langue par défaut
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '300px',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
          </div>
        </div>

        {/* Thème et couleurs */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🎨 Personnalisation du thème
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Personnalisez les couleurs de votre interface
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Couleur principale
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
                Couleur secondaire
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

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Succès
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={themeColors.success}
                  onChange={(e) => setThemeColors({ ...themeColors, success: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.success}
                  onChange={(e) => setThemeColors({ ...themeColors, success: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Danger
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={themeColors.danger}
                  onChange={(e) => setThemeColors({ ...themeColors, danger: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.danger}
                  onChange={(e) => setThemeColors({ ...themeColors, danger: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Avertissement
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={themeColors.warning}
                  onChange={(e) => setThemeColors({ ...themeColors, warning: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.warning}
                  onChange={(e) => setThemeColors({ ...themeColors, warning: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleResetTheme}
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              🔄 Réinitialiser les couleurs
            </button>

            <div style={{
              padding: '10px 20px',
              background: '#f8f9fa',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#6c757d',
              display: 'flex',
              alignItems: 'center'
            }}>
              ℹ️ Les couleurs seront appliquées à l'ensemble de l'interface
            </div>
          </div>
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
