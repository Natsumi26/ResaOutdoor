import React, { useState, useEffect } from 'react';
import { usersAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Common.module.css';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    stripeAccount: '',
    role: 'employee',
    confidentialityPolicy: '',
    teamName: '', // Pour les leaders : nom de la team
    teamLeaderId: '' // Pour les employees/trainees : ID du leader
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadUsers();
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'leader') {
      loadTeamMembers();
    }
  }, [currentUser]);

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

  const loadTeamMembers = async () => {
    try {
      const response = await teamAPI.getMembers();
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error('Erreur chargement team:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Préparer les données
      const userData = {
        login: formData.login,
        email: formData.email,
        stripeAccount: formData.stripeAccount,
        role: formData.role,
        confidentialityPolicy: formData.confidentialityPolicy
      };

      // Ajouter le mot de passe seulement si fourni
      if (formData.password) {
        userData.password = formData.password;
      }

      // Ajouter teamName pour les leaders
      if ((formData.role === 'leader' || formData.role === 'super_admin') && formData.teamName) {
        userData.teamName = formData.teamName;
      }

      // Ajouter teamLeaderId pour employees et trainees
      if ((formData.role === 'employee' || formData.role === 'trainee') && formData.teamLeaderId && formData.teamName) {
        userData.teamLeaderId = formData.teamLeaderId;
        userData.teamName = formData.teamName
      }

      if (editingId) {
        await usersAPI.update(editingId, userData);
      } else {
        // Pour création : utiliser teamAPI si c'est un membre d'équipe
        if (formData.role === 'employee' || formData.role === 'trainee') {
          await teamAPI.addMember(userData);
        } else {
          await usersAPI.create(userData);
        }
      }

      loadUsers();
      if (currentUser?.role === 'super_admin' || currentUser?.role === 'leader') {
        loadTeamMembers();
      }
      closeModal();
      alert('Utilisateur ' + (editingId ? 'modifié' : 'créé') + ' avec succès');
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      try {
        await usersAPI.delete(id);
        loadUsers();
        if (currentUser?.role === 'super_admin' || currentUser?.role === 'leader') {
          loadTeamMembers();
        }
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
        role: user.role,
        confidentialityPolicy: user.confidentialityPolicy,
        teamName: '',
        teamLeaderId: user.teamLeaderId || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        login: '',
        password: '',
        email: '',
        stripeAccount: '',
        role: 'employee',
        confidentialityPolicy: '',
        teamName: '',
        teamLeaderId: currentUser?.role === 'leader' ? currentUser.userId : ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', className: styles.badgeSuperAdmin, emoji: '👑' },
      leader: { label: 'Leader', className: styles.badgeLeader, emoji: '🌟' },
      employee: { label: 'Employé', className: styles.badgeEmployee, emoji: '👤' },
      trainee: { label: 'Stagiaire', className: styles.badgeTrainee, emoji: '🎓' },
      // Anciens rôles (compatibilité)
      admin: { label: 'Admin', className: styles.badgeAdmin, emoji: '👑' },
      guide: { label: 'Guide', className: styles.badgeGuide, emoji: '👤' }
    };

    const config = roleConfig[role] || roleConfig.employee;
    return (
      <span className={config.className}>
        {config.emoji} {config.label}
      </span>
    );
  };

  // Filtrer les leaders disponibles (pour le select de teamLeaderId)
  const availableLeaders = users.filter(u => u.role === 'leader' || u.role === 'super_admin');
console.log(availableLeaders)
  if (loading) return <div className={styles.loading}>Chargement...</div>;
console.log(users)
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
              <th>Équipe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.login}</td>
                <td>{user.email || '-'}</td>
                <td>{getRoleBadge(user.role)}</td>
                <td>
                  {user.teamLeaderId ? (
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      👥 Membre d'équipe {user.teamName}
                    </span>
                  ) : (user.role === 'leader' || user.role === 'super_admin') ? (
                    <span style={{ fontSize: '0.9rem', color: '#3b82f6' }}>
                      🌟 Chef d'équipe {user.teamName}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
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
                <label>Lien vers la page politiques de confidentialité</label>
                <input
                  type="text"
                  value={formData.confidentialityPolicy}
                  onChange={(e) => setFormData({ ...formData, confidentialityPolicy: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  {currentUser?.role === 'super_admin' && (
                    <option value="super_admin">👑 Super Admin</option>
                  )}
                  <option value="leader">🌟 Leader (Chef d'équipe)</option>
                  <option value="employee">👤 Employé</option>
                  <option value="trainee">🎓 Stagiaire</option>
                </select>
                <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                  {formData.role === 'leader' && '• Peut créer des sessions et gérer une équipe'}
                  {formData.role === 'employee' && '• Peut créer des sessions et des réservations'}
                  {formData.role === 'trainee' && '• Peut créer des réservations uniquement'}
                </small>
              </div>

              {/* Champ Team Name pour les leaders */}
              {formData.role === 'leader' && !editingId && (
                <div className={styles.formGroup}>
                  <label>Nom de l'équipe (optionnel)</label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="Ex: Équipe Canyon Life"
                  />
                  <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                    Ce nom sera affiché pour identifier l'équipe
                  </small> 
                </div>
              )}

              {/* Champ Team Name pour les SuperAdmin */}
              {formData.role === 'super_admin' && (
                <div className={styles.formGroup}>
                  <label>Nom de l'équipe (optionnel)</label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="Ex: Équipe Canyon Life"
                  />
                  <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                    Ce nom sera affiché pour identifier l'équipe
                  </small> 
                </div>
              )}

              {/* Select Team Leader pour les employees et trainees */}
              {(formData.role === 'employee' || formData.role === 'trainee') && (
                <div className={styles.formGroup}>
                  <label>Chef d'équipe *</label>
                  <select
                    value={formData.teamLeaderId}
                    onChange={(e) => {
                      const selectedOption = e.target.selectedOptions[0];
                      const teamName = selectedOption.dataset.team;
                      console.log(selectedOption.dataset.team) 

                      setFormData({ ...formData, teamLeaderId: e.target.value, teamName: teamName })}}
                    required
                  >
                    <option value="">Sélectionner un leader</option>
                    {availableLeaders.map(leader => (
                      <option key={leader.id} value={leader.id} data-team={leader.teamName}>
                        {leader.login} {leader.email ? `(${leader.email})` : ''}
                      </option>
                    ))}
                  </select>

                  <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                    Cet utilisateur fera partie de l'équipe du leader sélectionné
                  </small>
                </div>
              )}

              {currentUser?.role === 'super_admin' && (
                <div className={styles.formGroup}>
                  <label>Compte Stripe</label>
                  <input
                    type="text"
                    value={formData.stripeAccount}
                    onChange={(e) => setFormData({ ...formData, stripeAccount: e.target.value })}
                    placeholder="acct_..."
                  />
                </div>
              )}

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
