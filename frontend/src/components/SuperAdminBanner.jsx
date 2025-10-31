import React from 'react';
import styles from './SuperAdminBanner.module.css'; // à créer juste après
import { useAuth } from '../context/AuthContext';

const SuperAdminBanner = () => {
  const { user } = useAuth();
  const isImpersonated = localStorage.getItem('impersonated') === 'true';

  if (!user || !isImpersonated) return null;

  return (
    <div className={styles.banner}>
      🕵️‍♀️ Vous êtes connectée en mode super admin sur le compte <strong>{user.login}</strong>
    </div>
  );
};


export default SuperAdminBanner;