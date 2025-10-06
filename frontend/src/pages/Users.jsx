import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import styles from './Common.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    stripeAccount: '',
    role: 'guide'
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await usersAPI.update(editingId, formData);
      } else {
        await usersAPI.create(formData);
      }
      loadUsers();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      try {
        await usersAPI.delete(id);
        loadUsers();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur');
      }
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        login: user.login,
        password: '',
        email: user.email || '',
        stripeAccount: user.stripeAccount || '',
        role: user.role
      });
    } else {
      setEditingId(null);
      setFormData({
        login: '',
        password: '',
        email: '',
        stripeAccount: '',
        role: 'guide'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>👥 Gestion des Utilisateurs</h1>
        <button className={styles.btnPrimary} onClick={() => openModal()}>
          + Nouvel Utilisateur
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Login</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Compte Stripe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.login}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={user.role === 'admin' ? styles.badgeAdmin : styles.badgeGuide}>
                    {user.role === 'admin' ? 'Admin' : 'Guide'}
                  </span>
                </td>
                <td>{user.stripeAccount || '-'}</td>
                <td>
                  <button className={styles.btnEdit} onClick={() => openModal(user)}>
                    ✏️
                  </button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(user.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingId ? 'Modifier' : 'Créer'} un utilisateur</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Login *</label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Mot de passe {!editingId && '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingId}
                  placeholder={editingId ? 'Laisser vide pour ne pas changer' : ''}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Compte Stripe</label>
                <input
                  type="text"
                  value={formData.stripeAccount}
                  onChange={(e) => setFormData({ ...formData, stripeAccount: e.target.value })}
                  placeholder="acct_..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="guide">Guide</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
