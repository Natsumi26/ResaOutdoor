import React, { useState, useEffect } from 'react';
import { giftVouchersAPI } from '../services/api';
import styles from './Common.module.css';

const GiftVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ amount: '', expiresAt: '' });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const response = await giftVouchersAPI.getAll();
      setVouchers(response.data.vouchers);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await giftVouchersAPI.create(formData);
      loadVouchers();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce bon cadeau ?')) {
      try {
        await giftVouchersAPI.delete(id);
        loadVouchers();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur');
      }
    }
  };

  const openModal = () => {
    setFormData({ amount: '', expiresAt: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎁 Gestion des Bons Cadeaux</h1>
        <button className={styles.btnPrimary} onClick={openModal}>
          + Nouveau Bon Cadeau
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date création</th>
              <th>Utilisé par</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => (
              <tr key={voucher.id}>
                <td>
                  <strong>{voucher.code}</strong>
                </td>
                <td>{voucher.amount}€</td>
                <td>
                  {voucher.isUsed ? (
                    <span className={styles.badgeUsed}>Utilisé</span>
                  ) : (
                    <span className={styles.badgeAvailable}>Disponible</span>
                  )}
                </td>
                <td>{new Date(voucher.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>{voucher.usedBy || '-'}</td>
                <td>
                  <button className={styles.btnDelete} onClick={() => handleDelete(voucher.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vouchers.length === 0 && (
          <div className={styles.emptyState}>
            <p>Aucun bon cadeau créé</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Créer un bon cadeau</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Montant (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date d'expiration (optionnel)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftVouchers;
