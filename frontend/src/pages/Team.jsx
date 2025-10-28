import React, { useState, useEffect } from 'react';
import { teamAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Common.module.css';

const Team = () => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    role: 'employee'
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Charger les membres de l'équipe
      const response = await teamAPI.getMembers();
      setMembers(response.data.members || []);

      // Si super_admin, charger tous les utilisateurs pour voir toutes les équipes
      if (currentUser?.role === 'super_admin') {
        const usersResponse = await usersAPI.getAll();
        setAllUsers(usersResponse.data.users || []);
      }
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
        await teamAPI.updateMember(editingId, formData);
      } else {
        await teamAPI.addMember(formData);
      }
      loadData();
      closeModal();
      alert('Membre ' + (editingId ? 'modifié' : 'ajouté') + ' avec succès');
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce membre de l\'équipe ?')) {
      try {
        await teamAPI.deleteMember(id);
        loadData();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur');
      }
    }
  };

  const openModal = (member = null) => {
    if (member) {
      setEditingId(member.id);
      setFormData({
        login: member.login,
        password: '',
        email: member.email || '',
        role: member.role
      });
    } else {
      setEditingId(null);
      setFormData({
        login: '',
        password: '',
        email: '',
        role: 'employee'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: <span className={styles.badgeSuperAdmin}>👑 Super Admin</span>,
      leader: <span className={styles.badgeLeader}>🌟 Leader</span>,
      employee: <span className={styles.badgeEmployee}>👤 Employé</span>,
      trainee: <span className={styles.badgeTrainee}>🎓 Stagiaire</span>
    };
    return badges[role] || <span className={styles.badgeInfo}>{role}</span>;
  };

  // Grouper les utilisateurs par équipe (pour super_admin)
  const getTeamsByLeader = () => {
    const leaders = allUsers.filter(u => u.role === 'leader');
    return leaders.map(leader => ({
      leader,
      members: allUsers.filter(u => u.teamLeaderId === leader.id)
    }));
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

  // Vérifier que l'utilisateur est bien leader ou super_admin
  if (currentUser?.role !== 'leader' && currentUser?.role !== 'super_admin') {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>⚠️ Accès refusé</h2>
          <p>Seuls les leaders peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Vue Super Admin : Toutes les équipes
  if (currentUser?.role === 'super_admin') {
    const teams = getTeamsByLeader();
    const usersWithoutTeam = allUsers.filter(u =>
      !u.teamLeaderId && u.role !== 'leader' && u.role !== 'super_admin'
    );

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>👑 Vue d'ensemble des équipes</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>
              Toutes les équipes et leurs membres
            </p>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>🌟 Aucune équipe créée</h2>
            <p>Créez des leaders dans la page Utilisateurs pour commencer.</p>
          </div>
        ) : (
          <>
            {teams.map((team) => (
              <div key={team.leader.id} style={{ marginBottom: '30px' }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>
                        🌟 {team.leader.teamName || `Équipe de ${team.leader.login}`}
                      </h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                        Leader: {team.leader.login}
                        {team.leader.email && ` • ${team.leader.email}`}
                      </p>
                    </div>
                    <div>
                      {getRoleBadge(team.leader.role)}
                    </div>
                  </div>

                  {team.members.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: '10px 0' }}>
                      Aucun membre dans cette équipe
                    </p>
                  ) : (
                    <div className={styles.tableContainer} style={{ marginTop: '15px' }}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Login</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Date d'ajout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.members.map((member) => (
                            <tr key={member.id}>
                              <td>{member.login}</td>
                              <td>{member.email || '-'}</td>
                              <td>{getRoleBadge(member.role)}</td>
                              <td>
                                {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Utilisateurs sans équipe */}
            {usersWithoutTeam.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <div style={{
                  background: '#fef3c7',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid #fbbf24'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#92400e' }}>
                    ⚠️ Utilisateurs sans équipe
                  </h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Login</th>
                          <th>Email</th>
                          <th>Rôle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersWithoutTeam.map((user) => (
                          <tr key={user.id}>
                            <td>{user.login}</td>
                            <td>{user.email || '-'}</td>
                            <td>{getRoleBadge(user.role)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Vue Leader : Mon équipe uniquement
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>🌟 Mon Équipe</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Gérez les membres de votre équipe
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => openModal()}>
          + Ajouter un membre
        </button>
      </div>

      {members.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>👥 Aucun membre dans votre équipe</h2>
          <p>Commencez par ajouter des employés ou stagiaires à votre équipe.</p>
          <button className={styles.btnPrimary} onClick={() => openModal()}>
            + Ajouter un membre
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Login</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Date d'ajout</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.login}</td>
                  <td>{member.email || '-'}</td>
                  <td>{getRoleBadge(member.role)}</td>
                  <td>
                    {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <button className={styles.btnEdit} onClick={() => openModal(member)}>
                      ✏️
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(member.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingId ? 'Modifier' : 'Ajouter'} un membre</h2>
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
                <label>Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="employee">👤 Employé</option>
                  <option value="trainee">🎓 Stagiaire</option>
                </select>
                <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                  {formData.role === 'employee' && '• Peut créer des sessions et des réservations'}
                  {formData.role === 'trainee' && '• Peut créer des réservations uniquement (pas de sessions)'}
                </small>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
