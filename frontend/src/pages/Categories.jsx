import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import styles from './Common.module.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
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
        await categoriesAPI.update(editingId, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      loadCategories();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette catégorie ?')) {
      try {
        await categoriesAPI.delete(id);
        loadCategories();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur');
      }
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
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
        <h1>📁 Gestion des Catégories</h1>
        <button className={styles.btnPrimary} onClick={() => openModal()}>
          + Nouvelle Catégorie
        </button>
      </div>

      <div className={styles.grid}>
        {categories.map((category) => (
          <div key={category.id} className={styles.card}>
            <h3>{category.name}</h3>
            <p>{category.description || 'Aucune description'}</p>
            <div className={styles.cardFooter}>
              <span className={styles.badgeInfo}>
                {category._count.products} produit(s)
              </span>
              <div>
                <button className={styles.btnEdit} onClick={() => openModal(category)}>
                  ✏️
                </button>
                <button className={styles.btnDelete} onClick={() => handleDelete(category.id)}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className={styles.emptyState}>
            <p>Aucune catégorie créée</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingId ? 'Modifier' : 'Créer'} une catégorie</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
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

export default Categories;
