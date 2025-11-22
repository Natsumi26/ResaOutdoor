import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <img src="flags/logo.png" alt="Logo" className={styles.logo} />
          </div>
          <h1 className={styles.title}>Système de Réservation Professionnel</h1>
          <p className={styles.subtitle}>
            Gérez vos activités outdoor, vos réservations et vos clients en toute simplicité
          </p>
          <div className={styles.ctaButtons}>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate('/login')}
            >
              Espace professionnel
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.sectionTitle}>Fonctionnalités principales</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📅</div>
              <h3>Calendrier intelligent</h3>
              <p>Visualisez et gérez vos sessions en temps réel avec un calendrier intuitif</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👥</div>
              <h3>Gestion des participants</h3>
              <p>Suivez les informations de vos clients et leurs équipements</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💳</div>
              <h3>Paiements en ligne</h3>
              <p>Acceptez les paiements sécurisés via Stripe</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📧</div>
              <h3>Emails automatisés</h3>
              <p>Confirmations et rappels envoyés automatiquement</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎫</div>
              <h3>Bons cadeaux</h3>
              <p>Vendez et gérez des bons cadeaux personnalisés</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌐</div>
              <h3>Intégration site web</h3>
              <p>Intégrez le système de réservation sur votre site WordPress</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Prêt à simplifier votre gestion ?</h2>
          <p>Commencez à utiliser notre plateforme dès maintenant</p>
          <button
            className={styles.ctaPrimaryBtn}
            onClick={() => navigate('/login')}
          >
            Accéder à l'espace pro
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} - Tous droits réservés</p>
      </footer>
    </div>
  );
};

export default Landing;
