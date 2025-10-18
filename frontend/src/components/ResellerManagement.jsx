import { useState, useEffect } from 'react';
import { resellersAPI } from '../services/api';
import styles from './ResellerManagement.module.css';

const ResellerManagement = () => {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReseller, setEditingReseller] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    commission: '',
    notes: ''
  });

  useEffect(() => {
    loadResellers();
  }, []);

  const loadResellers = async () => {
    try {
      setLoading(true);
      const response = await resellersAPI.getAll();
      setResellers(response.data.resellers || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement revendeurs:', err);
      setError('Impossible de charger les revendeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Le nom du revendeur est requis');
      return;
    }

    try {
      if (editingReseller) {
        await resellersAPI.update(editingReseller.id, formData);
      } else {
        await resellersAPI.create(formData);
      }

      resetForm();
      loadResellers();
    } catch (err) {
      console.error('Erreur sauvegarde revendeur:', err);
      alert('Erreur lors de la sauvegarde du revendeur');
    }
  };

  const handleEdit = (reseller) => {
    setEditingReseller(reseller);
    setFormData({
      name: reseller.name,
      email: reseller.email || '',
      phone: reseller.phone || '',
      website: reseller.website || '',
      commission: reseller.commission || '',
      notes: reseller.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce revendeur ?')) {
      return;
    }

    try {
      await resellersAPI.delete(id);
      loadResellers();
    } catch (err) {
      console.error('Erreur suppression revendeur:', err);
      alert('Erreur lors de la suppression du revendeur');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      commission: '',
      notes: ''
    });
    setEditingReseller(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestion des Revendeurs</h2>
        {!showForm && (
          <button
            className={styles.addBtn}
            onClick={() => setShowForm(true)}
          >
            + Ajouter un revendeur
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <h3>{editingReseller ? 'Modifier' : 'Nouveau'} revendeur</h3>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={resetForm}
            >
              ✕
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du revendeur"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Site web</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Commission (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
              rows="3"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={resetForm} className={styles.cancelBtn}>
              Annuler
            </button>
            <button type="submit" className={styles.saveBtn}>
              {editingReseller ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {resellers.length === 0 ? (
        <div className={styles.emptyState}>
          Aucun revendeur enregistré
        </div>
      ) : (
        <div className={styles.list}>
          {resellers.map(reseller => (
            <div key={reseller.id} className={styles.resellerCard}>
              <div className={styles.resellerInfo}>
                <div className={styles.resellerName}>{reseller.name}</div>
                {reseller.email && (
                  <div className={styles.resellerDetail}>
                    <span className={styles.icon}>📧</span>
                    {reseller.email}
                  </div>
                )}
                {reseller.phone && (
                  <div className={styles.resellerDetail}>
                    <span className={styles.icon}>📱</span>
                    {reseller.phone}
                  </div>
                )}
                {reseller.website && (
                  <div className={styles.resellerDetail}>
                    <span className={styles.icon}>🌐</span>
                    <a href={reseller.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      Lien vers le site
                    </a>
                  </div>
                )}
                {reseller.commission && (
                  <div className={styles.resellerDetail}>
                    <span className={styles.icon}>💰</span>
                    Commission: {reseller.commission}%
                  </div>
                )}
                {reseller.notes && (
                  <div className={styles.resellerNotes}>{reseller.notes}</div>
                )}
                <div className={styles.resellerStats}>
                  {reseller._count?.bookings || 0} réservation(s)
                </div>
              </div>
              <div className={styles.resellerActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEdit(reseller)}
                >
                  ✏️ Modifier
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(reseller.id)}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResellerManagement;
