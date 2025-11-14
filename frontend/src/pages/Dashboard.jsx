import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';
import NotificationToast from '../components/NotificationToast';
import styles from './Dashboard.module.css';
import SuperAdminBanner from '../components/SuperAdminBanner';

const Dashboard = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Charger les couleurs du thème depuis les settings et mettre à jour les CSS variables
  useEffect(() => {
    const loadThemeColors = async () => {
      try {
        const response = await settingsAPI.get();
        const settings = response.data.settings;
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
        console.error('Erreur chargement couleurs thème:', error);
      }
    };
    loadThemeColors();
  }, []);

  // Détecter si on est sur mobile et gérer l'état du sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Sur mobile, la sidebar est fermée par défaut
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Vérifier à l'initialisation
    handleResize();

    // Écouter les changements de taille
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.dashboard}>
      {/* Overlay pour fermer le sidebar sur mobile */}
      {isMobile && sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${!sidebarOpen ? styles.closed : ''} ${isMobile ? styles.mobile : ''}`}
        style={{ background: 'linear-gradient(180deg, var(--guide-primary) 0%, var(--guide-secondary) 100%)' }}
      >
        <div className={styles.sidebarHeader}>
          <img
            src="/flags/logo.png"
            alt="RésaOutdoor"
            className={styles.logo}
            style={{ height: '120px', objectFit: 'contain' }}
          />
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={isMobile ? { background: 'linear-gradient(180deg, var(--guide-primary) 0%, var(--guide-secondary) 100%)' } : {}}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>📅</span>
            {sidebarOpen && <span>Calendrier</span>}
          </NavLink>

          <NavLink
            to="/reservations"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>📋</span>
            {sidebarOpen && <span>Réservations</span>}
          </NavLink>

          {(user?.role !== 'trainee') && (
            <>
            <NavLink
              to="/gift-vouchers"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>🎁</span>
              {sidebarOpen && <span>Bons cadeaux</span>}
            </NavLink>
          {/* Menu déroulant Paramètres */}
          <div className={styles.navDropdown}>
            <div
              className={`${styles.navItem} ${styles.navDropdownToggle} ${location.pathname.startsWith('/settings') ? styles.active : ''}`}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <span className={styles.icon}>⚙️</span>
              {sidebarOpen && (
                <>
                  <span>Paramètres</span>
                  <span className={`${styles.dropdownArrow} ${settingsOpen ? styles.open : ''}`}>
                    ▼
                  </span>
                </>
              )}
            </div>

            {settingsOpen && sidebarOpen && (
              <div className={styles.subMenu}>
                {isSuperAdmin && (
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>👥</span>
                    {sidebarOpen && <span>Utilisateurs</span>}
                  </NavLink>
                )}

                  <NavLink
                    to="/products"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>🏞️</span>
                    {sidebarOpen && <span>Produits</span>}
                  </NavLink>

                  <NavLink
                    to="/settings/emails"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>📧</span>
                    <span>Emails</span>
                  </NavLink>

                  <NavLink
                    to="/settings/resellers"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>🏪</span>
                    <span>Revendeurs</span>
                  </NavLink>

                  <NavLink
                    to="/settings/preferences/personalization"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>🎨</span>
                    {sidebarOpen && <span>Personnalisation</span>}
                  </NavLink>

                  <NavLink
                    to="/settings/preferences/payment-preferences"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>💳</span>
                    {sidebarOpen && <span>Moyens de paiement</span>}
                  </NavLink>

                  <NavLink
                    to="/settings/site-integration"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>🔗</span>
                    {sidebarOpen && <span>Intégration à mon site</span>}
                  </NavLink>

                  {(user?.role === 'leader' || isSuperAdmin) && (
                  <NavLink
                    to="/team"
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                    }
                  >
                    <span className={styles.icon}>🌟</span>
                    {sidebarOpen && <span>Mon Équipe</span>}
                  </NavLink>
                )}
            </div>
          )}
          </div>
          </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.login?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className={styles.userDetails}>
                <p className={styles.userName}>{user?.login}</p>
                <p className={styles.userRole}>
                  {user?.role === 'trainee'
                    ? 'Stagiaire'
                    : user?.role === 'employee'
                      ? 'Employé'
                      : user?.role === 'leader'
                        ? 'Chef d\'équipe'
                        : user?.role === 'super_admin'
                          ? 'Super Admin'
                          : 'Utilisateur'}
                </p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            {sidebarOpen ? '🚪 Déconnexion' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <SuperAdminBanner />
        <Outlet />
      </main>

      {/* Toast pour les notifications en temps réel */}
      <NotificationToast />
    </div>
  );
};

export default Dashboard;
