import React, { useState } from 'react';
import { useAuth} from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, superLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isSuper = credentials.password === import.meta.env.VITE_SUPER_ADMIN_PASSWORD;
    const result = isSuper
      ? await superLogin(credentials)
      : await login(credentials);

    if (result.success) {
      // Si le 2FA est requis, rediriger vers la page de vérification
      if (result.requiresTwoFactor) {
        navigate('/verify-2fa', {
          state: {
            tempToken: result.tempToken,
            message: result.message
          }
        });
      } else {
        navigate('/');
      }
    } else {
      setError(result.error || 'Erreur de connexion');
    }

    setLoading(false);
  };


  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logo}>
          <img src="/flags/logo.png" alt="Logo" />
          <p>Logiciel de réservation en ligne</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Connexion</h2>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="login">Identifiant</label>
            <input
              type="text"
              id="login"
              name="login"
              value={credentials.login}
              onChange={handleChange}
              required
              autoFocus
              placeholder="canyonlife"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a5f7a',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
