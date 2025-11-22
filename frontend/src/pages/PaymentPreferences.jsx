import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { usersAPI, settingsAPI, stripeAPI } from '../services/api';
import styles from './Common.module.css';

const PaymentPreferences = ({ embedded = false }) => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'online-sales' ? 'online-sales' : 'payment-methods');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // État pour Stripe (Vente en ligne)
  const [stripeAccount, setStripeAccount] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [confirmationRedirectUrl, setConfirmationRedirectUrl] = useState('');
  const [themeColors, setThemeColors] = useState({
    primary: '#667eea',
    secondary: '#764ba2'
  });

  // État pour les préférences de paiement
  const [paymentMode, setPaymentMode] = useState(user?.paymentMode || 'onsite_only');
  const [depositType, setDepositType] = useState('percentage');
  const [depositAmount, setDepositAmount] = useState('');
  const [confidentialityPolicy, setConfidentialityPolicy] = useState('');

  console.log(user)
  useEffect(() => {
    loadPaymentPreferences();
    loadThemeColor();
    loadStripeAccount();
  }, [user]);

  const loadStripeAccount = async () => {
    try {
      setStripeLoading(true);
      const response = await stripeAPI.getConnectAccount();
      setStripeAccount(response.data);
    } catch (error) {
      console.error('Erreur chargement compte Stripe:', error);
      if (error.response?.status === 401) {
        alert('⚠️ Erreur de configuration Stripe\n\nVotre clé API Stripe est invalide ou a expiré.\n\nVeuillez vérifier votre configuration dans le fichier .env du backend :\n- STRIPE_SECRET_KEY\n- STRIPE_PUBLISHABLE_KEY');
      }
    } finally {
      setStripeLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const response = await stripeAPI.connectOnboard();
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erreur connexion Stripe:', error);
      alert('Impossible de se connecter à Stripe: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const response = await stripeAPI.getDashboardLink();
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Erreur ouverture dashboard:', error);
      alert('Impossible d\'ouvrir le dashboard: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter votre compte Stripe ? Vous ne pourrez plus recevoir de paiements.')) {
      return;
    }

    try {
      await stripeAPI.disconnectAccount();
      alert('Compte Stripe déconnecté avec succès');
      loadStripeAccount();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      alert('Impossible de déconnecter le compte: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadThemeColor = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;

      // Charger l'URL de redirection
      setConfirmationRedirectUrl(settings?.confirmationRedirectUrl || '');

      if (settings?.primaryColor) {
        const primaryColor = settings.primaryColor;
        const secondaryColor = settings.secondaryColor || settings.primaryColor;

        // Mettre à jour les CSS variables
        document.documentElement.style.setProperty('--guide-primary', primaryColor);
        document.documentElement.style.setProperty('--guide-secondary', secondaryColor);

        // Extraire les composants RGB
        const extractRGB = (hex) => {
          const h = hex.replace('#', '');
          const r = parseInt(h.substring(0, 2), 16);
          const g = parseInt(h.substring(2, 4), 16);
          const b = parseInt(h.substring(4, 6), 16);
          return `${r}, ${g}, ${b}`;
        };
        document.documentElement.style.setProperty('--guide-primary-rgb', extractRGB(primaryColor));
        document.documentElement.style.setProperty('--guide-secondary-rgb', extractRGB(secondaryColor));

        // Sauvegarder dans localStorage
        localStorage.setItem('guidePrimaryColor', primaryColor);
        localStorage.setItem('guideSecondaryColor', secondaryColor);
      }
    } catch (error) {
      console.error('Erreur chargement couleur thème:', error);
    }
  };

  const loadPaymentPreferences = () => {
    if (user) {
      setPaymentMode(user.paymentMode || 'onsite_only');
      setDepositType(user.depositType || 'percentage');
      setDepositAmount(user.depositAmount || '');
      setConfidentialityPolicy(user.confidentialityPolicy || '');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaveMessage('');

      // Validation
      if (paymentMode === 'onsite_only' && (depositAmount && parseFloat(depositAmount) > 0)) {
        setDepositType('');
        setDepositAmount('');
        setLoading(false);
        return;
      }

      if ((paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full')) {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
          setSaveMessage('❌ Le montant de l\'acompte est requis pour ce mode de paiement');
          setLoading(false);
          return;
        }

        if (depositType === 'percentage' && parseFloat(depositAmount) > 100) {
          setSaveMessage('❌ Le pourcentage ne peut pas dépasser 100%');
          setLoading(false);
          return;
        }
      }

      // Préparer les données à envoyer
      const updateData = {
        paymentMode,
        confidentialityPolicy
      };

      // Ajouter les données d'acompte seulement si nécessaire
      if (paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full') {
        updateData.depositType = depositType;
        updateData.depositAmount = parseFloat(depositAmount);
      } else {
        updateData.depositType = null;
        updateData.depositAmount = null;
      }

      // Envoyer la mise à jour au backend
      const response = await usersAPI.update(user.id, updateData);

      // Mettre à jour le contexte utilisateur
      if (updateUser) {
        updateUser(response.data.user);
      }

      setSaveMessage('✅ Préférences de paiement sauvegardées avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde préférences paiement:', error);
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const paymentModeOptions = [
    {
      value: 'onsite_only',
      label: 'Paiement sur place uniquement',
      description: 'Les clients peuvent réserver sans payer en ligne. Paiement sur place uniquement.'
    },
    {
      value: 'deposit_only',
      label: 'Acompte obligatoire uniquement',
      description: 'Les clients doivent payer un acompte obligatoire en ligne. Le solde sera payé sur place.'
    },
    {
      value: 'deposit_and_full',
      label: 'Acompte avec option paiement total',
      description: 'Les clients peuvent choisir de payer l\'acompte ou la totalité en ligne.'
    },
    {
      value: 'full_or_later',
      label: 'Paiement total maintenant ou plus tard',
      description: 'Les clients peuvent choisir de payer la totalité en ligne ou de payer plus tard (sur place).'
    },
    {
      value: 'full_only',
      label: 'Paiement total obligatoire',
      description: 'Les clients doivent obligatoirement payer la totalité en ligne lors de la réservation.'
    }
  ];

  const requiresDeposit = paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full';

  const getTabColor = (tabName) => {
    return activeTab === tabName ? 'var(--guide-primary)' : '#6c757d';
  };

  return (
    <div className={embedded ? '' : styles.container}>
      {!embedded && (
        <div className={styles.header}>
          <h1>💳 Moyens de paiement</h1>
          <p>Configurez vos préférences de paiement pour les réservations en ligne</p>
        </div>
      )}

      <div style={{ maxWidth: embedded ? '100%' : '900px', margin: '0 auto' }}>
        {/* Onglets */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => setActiveTab('payment-methods')}
            style={{
              padding: '15px 30px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'payment-methods' ? '3px solid var(--guide-primary)' : 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              color: getTabColor('payment-methods'),
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'payment-methods') {
                e.currentTarget.style.color = 'var(--guide-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'payment-methods') {
                e.currentTarget.style.color = '#6c757d';
              }
            }}
          >
            💳 Préférences de paiement
          </button>

          <button
            onClick={() => setActiveTab('online-sales')}
            style={{
              padding: '15px 30px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'online-sales' ? '3px solid var(--guide-primary)' : 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              color: getTabColor('online-sales'),
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'online-sales') {
                e.currentTarget.style.color = 'var(--guide-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'online-sales') {
                e.currentTarget.style.color = '#6c757d';
              }
            }}
          >
            🛒 Vente en ligne
          </button>
        </div>

        {/* ONGLET: Préférences de paiement */}
        {activeTab === 'payment-methods' && (
        <div>
          {/* Mode de paiement */}
          <div className={styles.section} style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '10px' }}>
              Mode de paiement
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '30px' }}>
              Choisissez comment vos clients pourront payer leurs réservations
            </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {paymentModeOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  padding: '20px',
                  border: paymentMode === option.value ? 'var(--guide-primary)' : '2px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: paymentMode === option.value ? 'rgba(var(--guide-primary-rgb), 0.1)' : 'white'
                }}
                onMouseEnter={(e) => {
                  if (paymentMode !== option.value) {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (paymentMode !== option.value) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={option.value}
                  checked={paymentMode === option.value}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{
                    marginTop: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: 'var(--guide-primary)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px', color: '#2c3e50' }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d', lineHeight: '1.5' }}>
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Configuration de l'acompte si nécessaire */}
          {requiresDeposit && (
            <div style={{
              marginTop: '30px',
              padding: '25px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#856404' }}>
                Configuration de l'acompte
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                    Type d'acompte
                  </label>
                  <select
                    value={depositType}
                    onChange={(e) => setDepositType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                    {depositType === 'percentage' ? 'Pourcentage de l\'acompte' : 'Montant de l\'acompte (€)'}
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={depositType === 'percentage' ? 'Ex: 30' : 'Ex: 50'}
                    step={depositType === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={depositType === 'percentage' ? '100' : undefined}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <small style={{ display: 'block', marginTop: '6px', color: '#6c757d' }}>
                    {depositType === 'percentage'
                      ? 'Pourcentage du prix total (ex: 30 pour 30%)'
                      : 'Montant fixe en euros (ex: 50 pour 50€)'}
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Avertissement incompatibilité */}
          {paymentMode === 'onsite_only' && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              color: '#0c5460'
            }}>
              ℹ️ En mode "Paiement sur place uniquement", les acomptes ne sont pas disponibles. Les clients ne pourront pas payer en ligne.
            </div>
          )}
        </div>

        {/* Politique de confidentialité */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px' }}>
            Politique de confidentialité
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Lien vers votre politique de confidentialité (affiché lors de l'inscription à la newsletter)
          </p>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
              URL de la politique de confidentialité
            </label>
            <input
              type="url"
              value={confidentialityPolicy}
              onChange={(e) => setConfidentialityPolicy(e.target.value)}
              placeholder="https://www.example.com/politique-confidentialite"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#6c757d' }}>
              Cette URL sera utilisée dans les formulaires d'inscription à la newsletter
            </small>
          </div>
        </div>

          {/* Boutons d'action */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            alignItems: 'center'
          }}>
            {saveMessage && (
              <div style={{
                padding: '12px 20px',
                background: saveMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: saveMessage.includes('✅') ? '#155724' : '#721c24',
                borderRadius: '6px',
                fontSize: '0.95rem',
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
        )}

        {/* ONGLET: Vente en ligne */}
        {activeTab === 'online-sales' && (
        <div>
          {/* Section Stripe */}
          <div className={styles.section} style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '10px' }}>💳 Paiements Stripe</h2>
            <p style={{ color: '#6c757d', marginBottom: '30px' }}>
              Connectez votre compte Stripe pour recevoir les paiements de vos clients directement sur votre compte.
            </p>

            {stripeLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
                ⏳ Chargement des informations Stripe...
              </div>
            ) : !stripeAccount || !stripeAccount.connected ? (
              // Pas de compte connecté
              <div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6'
                }}>
                  <h3 style={{ marginTop: 0, fontSize: '16px' }}>Pourquoi connecter Stripe ?</h3>
                  <ul style={{ paddingLeft: '20px', color: '#495057' }}>
                    <li>Recevez les paiements directement sur votre compte</li>
                    <li>Gérez vos transactions depuis le dashboard Stripe</li>
                    <li>Sécurité bancaire maximale</li>
                    <li>Virements automatiques sur votre compte bancaire</li>
                  </ul>
                </div>

                <button
                  className={styles.btnPrimary}
                  onClick={handleConnectStripe}
                  style={{ width: '100%', padding: '15px', fontSize: '16px', background: 'var(--guide-primary)' }}
                >
                  🔗 Connecter mon compte Stripe
                </button>
              </div>
            ) : (
              // Compte connecté
              <div>
                <div style={{
                  background: stripeAccount.account.charges_enabled ? '#d4edda' : '#fff3cd',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: `1px solid ${stripeAccount.account.charges_enabled ? '#c3e6cb' : '#ffeeba'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '24px' }}>
                      {stripeAccount.account.charges_enabled ? '✅' : '⚠️'}
                    </span>
                    <strong style={{ fontSize: '18px' }}>
                      {stripeAccount.account.charges_enabled ? 'Compte actif' : 'Configuration en attente'}
                    </strong>
                  </div>

                  <div style={{ fontSize: '14px', color: '#495057' }}>
                    <p><strong>Email:</strong> {stripeAccount.account.email || 'N/A'}</p>
                    <p><strong>Pays:</strong> {stripeAccount.account.country || 'N/A'}</p>
                    <p>
                      <strong>Paiements:</strong>{' '}
                      {stripeAccount.account.charges_enabled ? '✓ Activés' : '✗ Désactivés'}
                    </p>
                    <p>
                      <strong>Virements:</strong>{' '}
                      {stripeAccount.account.payouts_enabled ? '✓ Activés' : '✗ Désactivés'}
                    </p>
                  </div>

                  {!stripeAccount.account.details_submitted && (
                    <div style={{
                      marginTop: '15px',
                      padding: '10px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #ffc107'
                    }}>
                      ℹ️ Complétez votre profil Stripe pour activer tous les paiements
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleOpenDashboard}
                    style={{ flex: 1, background: 'var(--guide-primary)' }}
                  >
                    📊 Ouvrir mon dashboard Stripe
                  </button>

                  {!stripeAccount.account.details_submitted && (
                    <button
                      className={styles.btnSecondary}
                      onClick={handleConnectStripe}
                      style={{ flex: 1 }}
                    >
                      ✏️ Compléter mon profil
                    </button>
                  )}

                  <button
                    className={styles.btnDelete}
                    onClick={handleDisconnect}
                    style={{ flex: 1 }}
                  >
                    🔌 Déconnecter
                  </button>
                </div>
              </div>
            )}

            {/* Informations supplémentaires */}
            <div style={{
              marginTop: '30px',
              padding: '15px',
              background: 'rgba(var(--guide-primary-rgb), 0.1)',
              borderRadius: '8px',
              border: `1px solid rgba(var(--guide-primary-rgb), 0.25)`,
              fontSize: '14px'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>ℹ️ Comment ça marche ?</h4>
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li>Cliquez sur "Connecter mon compte Stripe"</li>
                <li>Créez un compte Stripe ou connectez-vous</li>
                <li>Remplissez les informations demandées (bancaires, identité)</li>
                <li>Une fois validé, vous recevrez les paiements directement</li>
                <li>100% des paiements vont directement sur votre compte</li>
              </ol>
            </div>
          </div>

          {/* Section URL de redirection */}
          <div className={styles.section} style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '10px' }}>🔗 Redirection après paiement</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Configurez une URL de redirection personnalisée après la confirmation de paiement (utile pour le tracking Google Ads)
            </p>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                URL de redirection après confirmation
              </label>
              <input
                type="url"
                value={confirmationRedirectUrl}
                onChange={(e) => setConfirmationRedirectUrl(e.target.value)}
                placeholder="https://votre-site.com/merci"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
              <small style={{ display: 'block', marginTop: '6px', color: '#6c757d' }}>
                Après un paiement réussi, le client sera redirigé vers cette URL après 3 secondes. Laissez vide pour utiliser la page de confirmation par défaut.
              </small>
            </div>

            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await settingsAPI.update({ confirmationRedirectUrl });
                  setSaveMessage('✅ URL de redirection sauvegardée !');
                  setTimeout(() => setSaveMessage(''), 3000);
                } catch (error) {
                  console.error('Erreur sauvegarde URL:', error);
                  setSaveMessage('❌ Erreur lors de la sauvegarde');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: loading ? '#dee2e6' : 'var(--guide-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {loading ? '⏳ Enregistrement...' : '💾 Sauvegarder'}
            </button>

            {saveMessage && (
              <div style={{
                marginTop: '15px',
                padding: '12px 20px',
                background: saveMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: saveMessage.includes('✅') ? '#155724' : '#721c24',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: '500',
                border: `1px solid ${saveMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPreferences;
