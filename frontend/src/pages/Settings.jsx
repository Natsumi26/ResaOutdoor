import React, { useState, useEffect } from 'react';
import { stripeAPI } from '../services/api';
import ResellerManagement from '../components/ResellerManagement';
import styles from './Common.module.css';

const Settings = () => {
  const [stripeAccount, setStripeAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStripeAccount();
  }, []);

  const loadStripeAccount = async () => {
    try {
      setLoading(true);
      const response = await stripeAPI.getConnectAccount();
      setStripeAccount(response.data);
      console.log(stripeAccount)
    } catch (error) {
      console.error('Erreur chargement compte Stripe:', error);
      // Si c'est une erreur d'authentification Stripe, afficher un message clair
      if (error.response?.status === 401) {
        alert('⚠️ Erreur de configuration Stripe\n\nVotre clé API Stripe est invalide ou a expiré.\n\nVeuillez vérifier votre configuration dans le fichier .env du backend :\n- STRIPE_SECRET_KEY\n- STRIPE_PUBLISHABLE_KEY');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const response = await stripeAPI.connectOnboard();
      // Rediriger vers Stripe pour l'onboarding
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erreur connexion Stripe:', error);
      alert('Impossible de se connecter à Stripe: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const response = await stripeAPI.getDashboardLink();
      // Ouvrir le dashboard dans un nouvel onglet
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

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>⚙️ Paramètres</h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

          {!stripeAccount || !stripeAccount.connected ? (
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
                style={{ width: '100%', padding: '15px', fontSize: '16px' }}
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
                  style={{ flex: 1 }}
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
            background: '#e7f3ff',
            borderRadius: '8px',
            border: '1px solid #b3d9ff',
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

        {/* Section Revendeurs */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <ResellerManagement />
        </div>
      </div>
    </div>
  );
};

export default Settings;
