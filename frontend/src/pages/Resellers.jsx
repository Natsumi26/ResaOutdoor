import React from 'react';
import ResellerManagement from '../components/ResellerManagement';
import styles from './Common.module.css';

const Resellers = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🏪 Gestion des Revendeurs</h1>
        <p>Gérez vos partenaires revendeurs et leurs commissions</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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

export default Resellers;
