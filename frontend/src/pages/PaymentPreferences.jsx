import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import styles from './Common.module.css';

const PaymentPreferences = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // État pour les préférences de paiement
  const [paymentMode, setPaymentMode] = useState('onsite_only');
  const [depositType, setDepositType] = useState('percentage');
  const [depositAmount, setDepositAmount] = useState('');
  const [confidentialityPolicy, setConfidentialityPolicy] = useState('');

  useEffect(() => {
    loadPaymentPreferences();
  }, [user]);

  const loadPaymentPreferences = () => {
    if (user) {
      setPaymentMode(user.paymentMode || 'onsite_only');
      setDepositType(user.depositType || 'percentage');
      setDepositAmount(user.depositAmount || '');
      setConfidentialityPolicy(user.confidentialityPolicy || '');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaveMessage('');

      // Validation
      if (paymentMode === 'onsite_only' && (depositAmount && parseFloat(depositAmount) > 0)) {
        setSaveMessage('❌ Impossible de combiner paiement sur place avec acompte');
        setLoading(false);
        return;
      }

      if ((paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full')) {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
          setSaveMessage('❌ Le montant de l\'acompte est requis pour ce mode de paiement');
          setLoading(false);
          return;
        }

        if (depositType === 'percentage' && parseFloat(depositAmount) > 100) {
          setSaveMessage('❌ Le pourcentage ne peut pas dépasser 100%');
          setLoading(false);
          return;
        }
      }

      // Préparer les données à envoyer
      const updateData = {
        paymentMode,
        confidentialityPolicy
      };

      // Ajouter les données d'acompte seulement si nécessaire
      if (paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full') {
        updateData.depositType = depositType;
        updateData.depositAmount = parseFloat(depositAmount);
      } else {
        updateData.depositType = null;
        updateData.depositAmount = null;
      }

      // Envoyer la mise à jour au backend
      const response = await usersAPI.update(user.id, updateData);

      // Mettre à jour le contexte utilisateur
      if (updateUser) {
        updateUser(response.data.user);
      }

      setSaveMessage('✅ Préférences de paiement sauvegardées avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde préférences paiement:', error);
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const paymentModeOptions = [
    {
      value: 'onsite_only',
      label: 'Paiement sur place uniquement',
      description: 'Les clients peuvent réserver sans payer en ligne. Paiement sur place uniquement.'
    },
    {
      value: 'deposit_only',
      label: 'Acompte obligatoire uniquement',
      description: 'Les clients doivent payer un acompte obligatoire en ligne. Le solde sera payé sur place.'
    },
    {
      value: 'deposit_and_full',
      label: 'Acompte avec option paiement total',
      description: 'Les clients peuvent choisir de payer l\'acompte ou la totalité en ligne.'
    },
    {
      value: 'full_or_later',
      label: 'Paiement total maintenant ou plus tard',
      description: 'Les clients peuvent choisir de payer la totalité en ligne ou de payer plus tard (sur place).'
    },
    {
      value: 'full_only',
      label: 'Paiement total obligatoire',
      description: 'Les clients doivent obligatoirement payer la totalité en ligne lors de la réservation.'
    }
  ];

  const requiresDeposit = paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💳 Moyens de paiement</h1>
        <p>Configurez vos préférences de paiement pour les réservations en ligne</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Mode de paiement */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px' }}>
            Mode de paiement
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            Choisissez comment vos clients pourront payer leurs réservations
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {paymentModeOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  padding: '20px',
                  border: paymentMode === option.value ? '2px solid #3498db' : '2px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: paymentMode === option.value ? '#f0f8ff' : 'white'
                }}
                onMouseEnter={(e) => {
                  if (paymentMode !== option.value) {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (paymentMode !== option.value) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={option.value}
                  checked={paymentMode === option.value}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{
                    marginTop: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#3498db'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px', color: '#2c3e50' }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d', lineHeight: '1.5' }}>
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Configuration de l'acompte si nécessaire */}
          {requiresDeposit && (
            <div style={{
              marginTop: '30px',
              padding: '25px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#856404' }}>
                Configuration de l'acompte
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                    Type d'acompte
                  </label>
                  <select
                    value={depositType}
                    onChange={(e) => setDepositType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                    {depositType === 'percentage' ? 'Pourcentage de l\'acompte' : 'Montant de l\'acompte (€)'}
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={depositType === 'percentage' ? 'Ex: 30' : 'Ex: 50'}
                    step={depositType === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={depositType === 'percentage' ? '100' : undefined}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <small style={{ display: 'block', marginTop: '6px', color: '#6c757d' }}>
                    {depositType === 'percentage'
                      ? 'Pourcentage du prix total (ex: 30 pour 30%)'
                      : 'Montant fixe en euros (ex: 50 pour 50€)'}
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Avertissement incompatibilité */}
          {paymentMode === 'onsite_only' && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              color: '#0c5460'
            }}>
              ℹ️ En mode "Paiement sur place uniquement", les acomptes ne sont pas disponibles. Les clients ne pourront pas payer en ligne.
            </div>
          )}
        </div>

        {/* Politique de confidentialité */}
        <div className={styles.section} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px' }}>
            Politique de confidentialité
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Lien vers votre politique de confidentialité (affiché lors de l'inscription à la newsletter)
          </p>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
              URL de la politique de confidentialité
            </label>
            <input
              type="url"
              value={confidentialityPolicy}
              onChange={(e) => setConfidentialityPolicy(e.target.value)}
              placeholder="https://www.example.com/politique-confidentialite"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#6c757d' }}>
              Cette URL sera utilisée dans les formulaires d'inscription à la newsletter
            </small>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '15px',
          alignItems: 'center'
        }}>
          {saveMessage && (
            <div style={{
              padding: '12px 20px',
              background: saveMessage.includes('✅') ? '#d4edda' : '#f8d7da',
              color: saveMessage.includes('✅') ? '#155724' : '#721c24',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: '500',
              border: `1px solid ${saveMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {saveMessage}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '14px 35px',
              background: loading ? '#dee2e6' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(40, 167, 69, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#218838';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = '#28a745';
            }}
          >
            {loading ? '⏳ Enregistrement...' : '💾 Enregistrer les préférences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPreferences;
