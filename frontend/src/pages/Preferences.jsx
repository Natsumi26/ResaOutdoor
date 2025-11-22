import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, settingsAPI, uploadAPI, categoriesAPI, getUploadUrl } from '../services/api';
import styles from './Common.module.css';
import ActivityFormConfig from '../components/ActivityFormConfig';
import ResellerManagement from '../components/ResellerManagement';
import PaymentPreferences from './PaymentPreferences';

const Preferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const activityFormConfigRef = useRef(null);

  // État pour les sections déroulantes (toutes fermées par défaut)
  const [openSections, setOpenSections] = useState({
    infos: false,
    activities: false,
    formConfig: false,
    resellers: false,
    payment: false,
    theme: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  // Activités pratiquées par le guide (pré-définies)
  const predefinedActivities = [
    { id: 'canyoning', name: 'Canyoning', description: 'Descente de canyons en eau' },
    { id: 'via-ferrata', name: 'Via Ferrata', description: 'Escalade équipée en montagne' },
    { id: 'escalade', name: 'Escalade', description: 'Escalade de bloc et falaise' },
    { id: 'speleologie', name: 'Spéléologie', description: 'Exploration de grottes' }
  ];

  const [practiceActivities, setPracticeActivities] = useState([]);

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

  // Charger les activités pratiquées du user
  useEffect(() => {
    if (user?.practiceActivities) {
      setPracticeActivities(user.practiceActivities);
    }
  }, [user]);

  const handleActivityToggle = (categoryId) => {
    setPracticeActivities(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
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

      // Sauvegarder les activités pratiquées du guide
      if (user?.id) {
        await usersAPI.update(user.id, {
          practiceActivities
        });
      }

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
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => toggleSection('infos')}
            style={{
              padding: '20px 25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: openSections.infos ? '1px solid #eee' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Informations personnelles</h2>
              <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Coordonnées pour être contacté par vos clients
              </p>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#6c757d', transition: 'transform 0.2s', transform: openSections.infos ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          <div style={{ padding: openSections.infos ? '25px' : '0 25px', maxHeight: openSections.infos ? '2000px' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Votre entreprise"
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
                placeholder="https://www.example.com"
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
                placeholder="Ex: Votre slogan ou accroche"
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
                    src={getUploadUrl(logo)}
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
                padding: '10px 24px',
                background: loading ? '#dee2e6' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 2px 6px rgba(40, 167, 69, 0.3)'
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = '#218838'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = '#28a745'; }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
          </div>
        </div>

        {/* Activités pratiquées */}
        <div className={styles.section} style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => toggleSection('activities')}
            style={{
              padding: '20px 25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: openSections.activities ? '1px solid #eee' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🏃 Activités pratiquées</h2>
              <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Sélectionnez les activités que vous pratiquez
              </p>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#6c757d', transition: 'transform 0.2s', transform: openSections.activities ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          <div style={{ padding: openSections.activities ? '25px' : '0 25px', maxHeight: openSections.activities ? '1000px' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {predefinedActivities.map((activity) => (
                <label
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: practiceActivities.includes(activity.id) ? 'rgba(52, 152, 219, 0.1)' : 'white',
                    borderColor: practiceActivities.includes(activity.id) ? '#3498db' : '#e5e7eb',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!practiceActivities.includes(activity.id)) {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!practiceActivities.includes(activity.id)) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={practiceActivities.includes(activity.id)}
                    onChange={() => handleActivityToggle(activity.id)}
                    style={{
                      marginRight: '10px',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#3498db'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                      {activity.name}
                    </div>
                    {activity.description && (
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '2px' }}>
                        {activity.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
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
                  padding: '10px 24px',
                  background: loading ? '#dee2e6' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 2px 6px rgba(40, 167, 69, 0.3)'
                }}
                onMouseEnter={(e) => { if (!loading) e.target.style.background = '#218838'; }}
                onMouseLeave={(e) => { if (!loading) e.target.style.background = '#28a745'; }}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>

        {/* Configuration des formulaires par activité */}
        {practiceActivities.length > 0 && (
          <div className={styles.section} style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div
              onClick={() => toggleSection('formConfig')}
              style={{
                padding: '20px 25px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: openSections.formConfig ? '1px solid #eee' : 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>⚙️ Configuration des formulaires</h2>
                <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                  Personnalisez les champs du formulaire participant
                </p>
              </div>
              <span style={{ fontSize: '1.2rem', color: '#6c757d', transition: 'transform 0.2s', transform: openSections.formConfig ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>
            <div style={{ padding: openSections.formConfig ? '25px' : '0 25px', maxHeight: openSections.formConfig ? '2000px' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
              <ActivityFormConfig ref={activityFormConfigRef} practiceActivities={practiceActivities} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => activityFormConfigRef.current?.reset()}
                  style={{
                    padding: '10px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Réinitialiser par défaut
                </button>
                <button
                  onClick={() => activityFormConfigRef.current?.save()}
                  style={{
                    padding: '10px 24px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#218838'}
                  onMouseLeave={(e) => e.target.style.background = '#28a745'}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revendeurs */}
        <div className={styles.section} style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => toggleSection('resellers')}
            style={{
              padding: '20px 25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: openSections.resellers ? '1px solid #eee' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🏪 Revendeurs</h2>
              <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Gérez vos partenaires revendeurs et leurs commissions
              </p>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#6c757d', transition: 'transform 0.2s', transform: openSections.resellers ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          <div style={{ padding: openSections.resellers ? '25px' : '0 25px', maxHeight: openSections.resellers ? '3000px' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
            <ResellerManagement />
          </div>
        </div>

        {/* Moyens de paiement */}
        <div className={styles.section} style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => toggleSection('payment')}
            style={{
              padding: '20px 25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: openSections.payment ? '1px solid #eee' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>💳 Moyens de paiement</h2>
              <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Configuration des préférences de paiement et Stripe
              </p>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#6c757d', transition: 'transform 0.2s', transform: openSections.payment ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          <div style={{ padding: openSections.payment ? '0px' : '0 25px', maxHeight: openSections.payment ? '4000px' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
            <PaymentPreferences embedded={true} />
          </div>
        </div>

        {/* Thèmes */}
        <div className={styles.section} style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => toggleSection('theme')}
            style={{
              padding: '20px 25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: openSections.theme ? '1px solid #eee' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🎨 Personnalisation des couleurs</h2>
              <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Couleurs de l'interface guide et client
              </p>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#6c757d', transition: 'transform 0.2s', transform: openSections.theme ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          <div style={{ padding: openSections.theme ? '25px' : '0 25px', maxHeight: openSections.theme ? '1000px' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Interface Guide - Dégradé début */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#495057', fontSize: '0.9rem' }}>
                Guide - Dégradé début
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                  style={{ width: '50px', height: '36px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Interface Guide - Dégradé fin */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#495057', fontSize: '0.9rem' }}>
                Guide - Dégradé fin
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })}
                  style={{ width: '50px', height: '36px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Interface Client */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#495057', fontSize: '0.9rem' }}>
                Client - Couleur principale
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={themeColors.clientButton}
                  onChange={(e) => setThemeColors({ ...themeColors, clientButton: e.target.value, clientAccent: e.target.value })}
                  style={{ width: '50px', height: '36px', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColors.clientButton}
                  onChange={(e) => setThemeColors({ ...themeColors, clientButton: e.target.value, clientAccent: e.target.value })}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
              ℹ️ Les couleurs "Guide" s'appliquent à la sidebar, les couleurs "Client" à l'interface de réservation
            </div>
            <button
              onClick={handleResetTheme}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              🔄 Réinitialiser
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
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
                padding: '10px 24px',
                background: loading ? '#dee2e6' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 2px 6px rgba(40, 167, 69, 0.3)'
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = '#218838'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = '#28a745'; }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Preferences;
