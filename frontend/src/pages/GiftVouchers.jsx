import React, { useState, useEffect } from 'react';
import { giftVouchersAPI } from '../services/api';
import styles from './Common.module.css';

const GiftVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    expiresAt: '',
    type: 'voucher',
    maxUsages: '',
    code: ''
  });
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [showVerifySection, setShowVerifySection] = useState(false);

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

  const handleVerifyCode = async () => {
    if (!verifyCode.trim()) {
      alert('Veuillez entrer un code');
      return;
    }

    try {
      const response = await giftVouchersAPI.verifyCode(verifyCode);
      setVerifyResult(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setVerifyResult({ success: false, valid: false, message: 'Erreur lors de la vérification' });
    }
  };

  const openModal = () => {
    setFormData({
      amount: '',
      expiresAt: '',
      type: 'voucher',
      maxUsages: '',
      code: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎁 Gestion des Bons Cadeaux & Codes Promos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={styles.btnSecondary} onClick={() => setShowVerifySection(!showVerifySection)}>
            🔍 Vérifier un code
          </button>
          <button className={styles.btnPrimary} onClick={openModal}>
            + Nouveau Code
          </button>
        </div>
      </div>

      {/* Section de vérification de code */}
      {showVerifySection && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0 }}>Vérifier un code promo</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Entrez le code..."
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <button className={styles.btnPrimary} onClick={handleVerifyCode}>
              Vérifier
            </button>
          </div>

          {verifyResult && (
            <div style={{
              padding: '15px',
              borderRadius: '6px',
              background: verifyResult.valid ? '#d4edda' : '#f8d7da',
              border: `1px solid ${verifyResult.valid ? '#c3e6cb' : '#f5c6cb'}`,
              color: verifyResult.valid ? '#155724' : '#721c24'
            }}>
              <strong>{verifyResult.message}</strong>
              {verifyResult.voucher && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <p><strong>Code:</strong> {verifyResult.voucher.code}</p>
                  <p><strong>Montant:</strong> {verifyResult.voucher.amount}€</p>
                  <p><strong>Type:</strong> {verifyResult.voucher.type === 'voucher' ? 'Bon cadeau (usage unique)' : 'Code promo (utilisations multiples)'}</p>
                  <p><strong>Utilisations:</strong> {verifyResult.voucher.usageCount}
                    {verifyResult.voucher.maxUsages ? ` / ${verifyResult.voucher.maxUsages}` : ' (illimité)'}
                  </p>
                  {verifyResult.voucher.remainingUses !== null && (
                    <p><strong>Utilisations restantes:</strong> {verifyResult.voucher.remainingUses}</p>
                  )}
                  {verifyResult.voucher.usages && verifyResult.voucher.usages.length > 0 && (
                    <div>
                      <strong>Dernières utilisations:</strong>
                      <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                        {verifyResult.voucher.usages.slice(0, 5).map((usage) => (
                          <li key={usage.id}>
                            {new Date(usage.usedAt).toLocaleDateString('fr-FR')} - {usage.usedBy || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Utilisations</th>
              <th>Statut</th>
              <th>Date création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => {
              const isAvailable = voucher.type === 'promo'
                ? (voucher.maxUsages === null || voucher.usageCount < voucher.maxUsages)
                : voucher.usageCount === 0;

              return (
                <tr key={voucher.id}>
                  <td>
                    <strong>{voucher.code}</strong>
                  </td>
                  <td>
                    {voucher.type === 'voucher' ? (
                      <span style={{ color: '#6c757d' }}>🎁 Bon cadeau</span>
                    ) : (
                      <span style={{ color: '#0d6efd' }}>🏷️ Code promo</span>
                    )}
                  </td>
                  <td>{voucher.amount}€</td>
                  <td>
                    {voucher.usageCount}
                    {voucher.maxUsages ? ` / ${voucher.maxUsages}` : ' (∞)'}
                  </td>
                  <td>
                    {isAvailable ? (
                      <span className={styles.badgeAvailable}>Disponible</span>
                    ) : (
                      <span className={styles.badgeUsed}>Épuisé</span>
                    )}
                  </td>
                  <td>{new Date(voucher.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <button className={styles.btnDelete} onClick={() => handleDelete(voucher.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
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
            <h2>Créer un bon cadeau ou code promo</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="voucher">🎁 Bon cadeau (usage unique)</option>
                  <option value="promo">🏷️ Code promo (utilisations multiples)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Code personnalisé (optionnel)</label>
                <input
                  type="text"
                  placeholder="Laissez vide pour générer automatiquement"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  Si vide, un code sera généré automatiquement
                </small>
              </div>

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

              {formData.type === 'promo' && (
                <div className={styles.formGroup}>
                  <label>Nombre maximum d'utilisations</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Laissez vide pour illimité"
                    value={formData.maxUsages}
                    onChange={(e) => setFormData({ ...formData, maxUsages: e.target.value })}
                  />
                  <small style={{ color: '#6c757d', fontSize: '12px' }}>
                    Laissez vide pour un nombre d'utilisations illimité
                  </small>
                </div>
              )}

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
