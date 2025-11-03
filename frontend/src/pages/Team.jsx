import React, { useState, useEffect } from 'react';
import { teamAPI, usersAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Common.module.css';

const Team = () => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [monCompte, setMonCompte] = useState([])
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    role: 'employee',
    stripeAccount: '',
    confidentialityPolicy: '',
    paymentMode: 'onsite_only',
    depositType: 'percentage',
    depositAmount: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [themeColors, setThemeColors] = useState({
    primary: '#667eea',
    secondary: '#764ba2'
  });

  useEffect(() => {
    loadData();
    loadThemeColors();
  }, [currentUser]);

  const loadThemeColors = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;
      if (settings?.primaryColor) {
        setThemeColors({
          primary: settings.primaryColor,
          secondary: settings.secondaryColor || settings.primaryColor
        });
      }
    } catch (error) {
      console.error('Erreur chargement couleurs thème:', error);
    }
  };

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
      if (currentUser?.role === 'leader'|| currentUser?.role === 'super_admin') {
        setMonCompte(currentUser);
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
        role: member.role,
        stripeAccount: member.stripeAccount || '',
        confidentialityPolicy: member.confidentialityPolicy || '',
        paymentMode: member.paymentMode || 'onsite_only',
        depositType: member.depositType || 'percentage',
        depositAmount: member.depositAmount || ''
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
    const leaders = allUsers.filter(u => u.role === 'leader'|| u.role === 'super_admin' );
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
                            <th>Action</th>
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
                              <td>
                                <button className={styles.btnEdit} onClick={() =>{ console.log('Ouverture modal pour', member); openModal(member);}}>
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
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersWithoutTeam.map((user) => (
                          <tr key={user.id}>
                            <td>{user.login}</td>
                            <td>{user.email || '-'}</td>
                            <td>{getRoleBadge(user.role)}</td>
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
                </div>
              </div>
            )}
          </>
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
                  <option value="leader">🌟 leader</option>
                  <option value="employee">👤 Employé</option>
                  <option value="trainee">🎓 Stagiaire</option>
                </select>
                <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                  {formData.role === 'employee' && '• Peut créer des sessions et des réservations'}
                  {formData.role === 'trainee' && '• Peut créer des réservations uniquement (pas de sessions)'}
                </small>
              </div>

              {/* Champs supplémentaires pour les stagiaires */}
              {formData.role === 'trainee' && (
                <>
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e40af' }}>
                      💳 Configuration du stagiaire
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
                      En tant que leader, vous gérez les paramètres de paiement et le compte Stripe pour vos stagiaires.
                    </p>

                    <div className={styles.formGroup}>
                      <label>Compte Stripe</label>
                      <input
                        type="text"
                        value={formData.stripeAccount}
                        onChange={(e) => setFormData({ ...formData, stripeAccount: e.target.value })}
                        placeholder="acct_xxxxxxxxxxxx"
                      />
                      <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                        ID du compte Stripe Connect du stagiaire
                      </small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Politique de confidentialité</label>
                      <input
                        type="url"
                        value={formData.confidentialityPolicy}
                        onChange={(e) => setFormData({ ...formData, confidentialityPolicy: e.target.value })}
                        placeholder="https://example.com/politique-confidentialite"
                      />
                      <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                        URL de la politique de confidentialité
                      </small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mode de paiement *</label>
                      <select
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        required
                      >
                        <option value="onsite_only">Paiement sur place uniquement</option>
                        <option value="deposit_only">Acompte obligatoire uniquement</option>
                        <option value="deposit_and_full">Acompte avec option paiement total</option>
                        <option value="full_or_later">Paiement total maintenant ou plus tard</option>
                        <option value="full_only">Paiement total obligatoire</option>
                      </select>
                    </div>

                    {(formData.paymentMode === 'deposit_only' || formData.paymentMode === 'deposit_and_full') && (
                      <>
                        <div className={styles.formGroup}>
                          <label>Type d'acompte *</label>
                          <select
                            value={formData.depositType}
                            onChange={(e) => setFormData({ ...formData, depositType: e.target.value })}
                            required
                          >
                            <option value="percentage">Pourcentage (%)</option>
                            <option value="fixed">Montant fixe (€)</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            {formData.depositType === 'percentage' ? 'Pourcentage de l\'acompte *' : 'Montant de l\'acompte (€) *'}
                          </label>
                          <input
                            type="number"
                            value={formData.depositAmount}
                            onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                            placeholder={formData.depositType === 'percentage' ? 'Ex: 30' : 'Ex: 50'}
                            step={formData.depositType === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={formData.depositType === 'percentage' ? '100' : undefined}
                            required
                          />
                          <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                            {formData.depositType === 'percentage'
                              ? 'Pourcentage du prix total (ex: 30 pour 30%)'
                              : 'Montant fixe en euros (ex: 50 pour 50€)'}
                          </small>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

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
      </div>

      {/* Mon compte */}
      {(currentUser.role === 'leader'|| currentUser.role === 'super_admin') && (
      <div className={styles.tableContainer}>
        <h3 style={{ margin: '8px' }}>Mon compte</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Login</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                <tr key={currentUser.id}>
                  <td>{currentUser.login}</td>
                  <td>{currentUser.email || '-'}</td>
                  <td>{getRoleBadge(currentUser.role)}</td>
                  <td>
                    <button className={styles.btnEdit} onClick={() => openModal(currentUser)}>
                      ✏️
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(currentUser.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
            </tbody>
          </table>
        </div>
      )}
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
          <h3 style={{ margin: '8px' }}>Mes membres</h3>
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
                  <option value="leader">🌟 leader</option>
                  <option value="employee">👤 Employé</option>
                  <option value="trainee">🎓 Stagiaire</option>
                </select>
                <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                  {formData.role === 'employee' && '• Peut créer des sessions et des réservations'}
                  {formData.role === 'trainee' && '• Peut créer des réservations uniquement (pas de sessions)'}
                </small>
              </div>

              {/* Champs supplémentaires pour les stagiaires */}
              {formData.role === 'trainee' && (
                <>
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e40af' }}>
                      💳 Configuration du stagiaire
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
                      En tant que leader, vous gérez les paramètres de paiement et le compte Stripe pour vos stagiaires.
                    </p>

                    <div className={styles.formGroup}>
                      <label>Compte Stripe</label>
                      <input
                        type="text"
                        value={formData.stripeAccount}
                        onChange={(e) => setFormData({ ...formData, stripeAccount: e.target.value })}
                        placeholder="acct_xxxxxxxxxxxx"
                      />
                      <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                        ID du compte Stripe Connect du stagiaire
                      </small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Politique de confidentialité</label>
                      <input
                        type="url"
                        value={formData.confidentialityPolicy}
                        onChange={(e) => setFormData({ ...formData, confidentialityPolicy: e.target.value })}
                        placeholder="https://example.com/politique-confidentialite"
                      />
                      <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                        URL de la politique de confidentialité
                      </small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mode de paiement *</label>
                      <select
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        required
                      >
                        <option value="onsite_only">Paiement sur place uniquement</option>
                        <option value="deposit_only">Acompte obligatoire uniquement</option>
                        <option value="deposit_and_full">Acompte avec option paiement total</option>
                        <option value="full_or_later">Paiement total maintenant ou plus tard</option>
                        <option value="full_only">Paiement total obligatoire</option>
                      </select>
                    </div>

                    {(formData.paymentMode === 'deposit_only' || formData.paymentMode === 'deposit_and_full') && (
                      <>
                        <div className={styles.formGroup}>
                          <label>Type d'acompte *</label>
                          <select
                            value={formData.depositType}
                            onChange={(e) => setFormData({ ...formData, depositType: e.target.value })}
                            required
                          >
                            <option value="percentage">Pourcentage (%)</option>
                            <option value="fixed">Montant fixe (€)</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            {formData.depositType === 'percentage' ? 'Pourcentage de l\'acompte *' : 'Montant de l\'acompte (€) *'}
                          </label>
                          <input
                            type="number"
                            value={formData.depositAmount}
                            onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                            placeholder={formData.depositType === 'percentage' ? 'Ex: 30' : 'Ex: 50'}
                            step={formData.depositType === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={formData.depositType === 'percentage' ? '100' : undefined}
                            required
                          />
                          <small style={{ display: 'block', marginTop: '5px', color: '#6b7280' }}>
                            {formData.depositType === 'percentage'
                              ? 'Pourcentage du prix total (ex: 30 pour 30%)'
                              : 'Montant fixe en euros (ex: 50 pour 50€)'}
                          </small>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

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
