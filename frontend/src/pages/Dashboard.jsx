import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationToast from '../components/NotificationToast';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.closed : ''} ${isMobile ? styles.mobile : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>🏔️ CanyonLife</h2>
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
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

                {(user?.role === 'leader' || user?.role === 'super_admin') && (
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
                  to="/settings/online-sales"
                  className={({ isActive }) =>
                    `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.icon}>💳</span>
                  <span>Vente en ligne</span>
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

                {user?.role !== 'trainee' && (
                <NavLink
                  to="/settings/newsletter"
                  className={({ isActive }) =>
                    `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.icon}>📧</span>
                  <span>Newsletter</span>
                </NavLink>
                )}

                <NavLink
                  to="/settings/preferences"
                  className={({ isActive }) =>
                    `${styles.subMenuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.icon}>⚙️</span>
                  <span>Préférences</span>
                </NavLink>
              </div>
            )}
          </div>
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
        <Outlet />
      </main>

      {/* Toast pour les notifications en temps réel */}
      <NotificationToast />
    </div>
  );
};

export default Dashboard;
