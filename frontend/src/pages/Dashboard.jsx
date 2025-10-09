import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.closed : ''}`}>
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

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>👥</span>
              {sidebarOpen && <span>Utilisateurs</span>}
            </NavLink>
          )}

          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>📁</span>
            {sidebarOpen && <span>Catégories</span>}
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>🏞️</span>
            {sidebarOpen && <span>Produits</span>}
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
                  {user?.role === 'admin' ? 'Administrateur' : 'Guide'}
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
    </div>
  );
};

export default Dashboard;
