import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Login.module.css';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TwoFactorVerify = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const tempToken = location.state?.tempToken;
  const message = location.state?.message;

  // Si pas de tempToken, rediriger vers la page de connexion
  React.useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Récupérer le user agent pour le deviceName
      const deviceName = navigator.userAgent;

      const response = await api.post('/auth/verify-2fa', {
        tempToken,
        code,
        trustDevice,
        deviceName
      });

      if (response.data.success) {
        // Sauvegarder le token et les données utilisateur
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Si un deviceToken est retourné, le sauvegarder
        if (response.data.deviceToken) {
          localStorage.setItem('deviceToken', response.data.deviceToken);
        }

        // Mettre à jour le contexte d'authentification directement
        setUser(response.data.user);

        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    // Permettre uniquement les chiffres et limiter à 6 caractères
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logo}>
          <img src="/flags/logo.png" alt="Logo" />
          <p>Vérification en deux étapes</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {message && <div className={styles.success}>{message}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <p style={{ marginBottom: '1.5rem', color: '#6b7280', textAlign: 'center' }}>
            Un code de vérification à 6 chiffres a été envoyé à votre adresse email.
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="code">Code de vérification</label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={handleCodeChange}
              required
              autoFocus
              placeholder="000000"
              maxLength={6}
              style={{
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                fontFamily: "'Courier New', monospace"
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Faire confiance à cet appareil pendant 2 mois
              </span>
            </label>
            <p style={{ margin: '8px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
              Vous ne serez plus invité à saisir un code de vérification sur cet appareil pendant 60 jours.
            </p>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading || code.length !== 6}>
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a5f7a',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              Retour à la connexion
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Le code est valide pendant 10 minutes.<br />
              Vous avez 3 tentatives maximum.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
