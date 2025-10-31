import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonated');
    setUser(null);
  };

  const superLogin = async ({ login, password }) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/super-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, superPassword: password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('impersonated', 'true');
      setUser(data.user);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    superLogin,
    isAuthenticated: !!user,
    // Helpers pour vérifier les rôles
    isSuperAdmin: user?.role === 'super_admin',
    isLeader: user?.role === 'leader',
    isEmployee: user?.role === 'employee',
    isTrainee: user?.role === 'trainee',
    // isAdmin = super_admin ou leader (ancienne logique)
    isAdmin: user?.role === 'super_admin' || user?.role === 'leader' || user?.role === 'admin',
    // Peut créer des sessions (pas trainee)
    canCreateSessions: user?.role !== 'trainee'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
