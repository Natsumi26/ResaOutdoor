import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import api from '../services/api';

const ForgotPassword = () => {
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/request-password-reset', { login, email });

      if (response.data.success) {
        setMessage(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la demande de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logo}>
          <img src="/flags/logo.png" alt="Logo" />
          <p>Mot de passe oublié</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
            Pour des raisons de sécurité, veuillez fournir votre identifiant et votre adresse email.
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="login">Identifiant</label>
            <input
              type="text"
              id="login"
              name="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              autoFocus
              placeholder="Votre identifiant"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
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

export default ForgotPassword;
