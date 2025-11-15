import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [userLogin, setUserLogin] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token manquant');
        setCheckingToken(false);
        return;
      }

      try {
        const response = await api.post('/auth/verify-reset-token', { token });

        if (response.data.success && response.data.valid) {
          setTokenValid(true);
          setUserLogin(response.data.login);
        } else {
          setError('Token invalide ou expiré');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Token invalide ou expiré');
      } finally {
        setCheckingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Vérifier la longueur minimale
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data.success) {
        setMessage('Mot de passe réinitialisé avec succès ! Redirection...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.logo}>
            <img src="/flags/logo.png" alt="Logo" />
            <p>Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.logo}>
            <img src="/flags/logo.png" alt="Logo" />
            <p>Lien invalide</p>
          </div>

          <div className={styles.form}>
            <div className={styles.error}>{error}</div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className={styles.submitBtn}
              >
                Demander un nouveau lien
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a5f7a',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logo}>
          <img src="/flags/logo.png" alt="Logo" />
          <p>Nouveau mot de passe pour {userLogin}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
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
                textDecoration: 'underline'
              }}
            >
              Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
