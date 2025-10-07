import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingsAPI } from '../services/api';
import styles from './BookingModal.module.css';

const BookingModal = ({ bookingId, onClose, onUpdate }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'payments', 'history'
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CB',
    notes: ''
  });

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getById(bookingId);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Erreur chargement réservation:', error);
      alert('Impossible de charger la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await bookingsAPI.addPayment(bookingId, paymentData);
      setShowPaymentForm(false);
      setPaymentData({ amount: '', method: 'CB', notes: '' });
      loadBooking();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur ajout paiement:', error);
      alert('Impossible d\'ajouter le paiement: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      await bookingsAPI.cancel(bookingId);
      loadBooking();
      onUpdate?.();
      alert('Réservation annulée avec succès');
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert('Impossible d\'annuler la réservation');
    }
  };

  const handleSendEmail = () => {
    alert('Fonctionnalité envoi email à implémenter');
    // TODO: Intégrer l'envoi d'email
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const { session, payments = [], history = [] } = booking;
  const remainingAmount = booking.totalPrice - booking.amountPaid;
  const paymentPercentage = (booking.amountPaid / booking.totalPrice) * 100;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2>Réservation #{booking.id.slice(0, 8)}</h2>
            <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
              {booking.status === 'pending' ? 'En attente' :
               booking.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 Informations
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'payments' ? styles.active : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            💳 Paiements
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Historique
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Onglet Informations */}
          {activeTab === 'info' && (
            <div className={styles.infoTab}>
              {/* Client */}
              <div className={styles.section}>
                <h3>👤 Informations Client</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Nom complet</span>
                    <span className={styles.value}>
                      {booking.clientFirstName} {booking.clientLastName}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email</span>
                    <span className={styles.value}>{booking.clientEmail}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Téléphone</span>
                    <span className={styles.value}>{booking.clientPhone}</span>
                  </div>
                  {booking.clientNationality && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Nationalité</span>
                      <span className={styles.value}>{booking.clientNationality}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Session & Activité */}
              <div className={styles.section}>
                <h3>🏔️ Activité & Session</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Activité</span>
                    <span className={styles.value}>{session.product?.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Date</span>
                    <span className={styles.value}>
                      {format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Créneau</span>
                    <span className={styles.value}>
                      {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} - {session.startTime}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Guide</span>
                    <span className={styles.value}>{session.guide?.login}</span>
                  </div>
                </div>
              </div>

              {/* Détails réservation */}
              <div className={styles.section}>
                <h3>📊 Détails Réservation</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Nombre de personnes</span>
                    <span className={styles.value}>{booking.numberOfPeople} pers.</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Prix total</span>
                    <span className={styles.value}>{booking.totalPrice}€</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Montant payé</span>
                    <span className={styles.value} style={{ color: '#10b981' }}>
                      {booking.amountPaid}€
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Reste à payer</span>
                    <span className={styles.value} style={{ color: remainingAmount > 0 ? '#ef4444' : '#10b981' }}>
                      {remainingAmount}€
                    </span>
                  </div>
                </div>

                {/* Barre de progression paiement */}
                <div className={styles.paymentProgress}>
                  <div className={styles.progressLabel}>
                    <span>Paiement</span>
                    <span>{paymentPercentage.toFixed(0)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${paymentPercentage}%`,
                        backgroundColor: paymentPercentage >= 100 ? '#10b981' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Paiements */}
          {activeTab === 'payments' && (
            <div className={styles.paymentsTab}>
              <div className={styles.sectionHeader}>
                <h3>💳 Paiements ({payments.length})</h3>
                {!showPaymentForm && (
                  <button
                    className={styles.btnAdd}
                    onClick={() => setShowPaymentForm(true)}
                  >
                    + Ajouter un paiement
                  </button>
                )}
              </div>

              {/* Formulaire ajout paiement */}
              {showPaymentForm && (
                <form className={styles.paymentForm} onSubmit={handleAddPayment}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Montant (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                        required
                        placeholder={`Reste: ${remainingAmount}€`}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Méthode</label>
                      <select
                        value={paymentData.method}
                        onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                      >
                        <option value="CB">Carte Bancaire</option>
                        <option value="espèces">Espèces</option>
                        <option value="virement">Virement</option>
                        <option value="stripe">Stripe</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Notes (optionnel)</label>
                    <input
                      type="text"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                      placeholder="Commentaire..."
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.btnPrimary}>
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setShowPaymentForm(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* Liste des paiements */}
              <div className={styles.paymentsList}>
                {payments.length === 0 ? (
                  <div className={styles.emptyState}>Aucun paiement enregistré</div>
                ) : (
                  payments.map(payment => (
                    <div key={payment.id} className={styles.paymentItem}>
                      <div className={styles.paymentIcon}>💰</div>
                      <div className={styles.paymentDetails}>
                        <div className={styles.paymentAmount}>{payment.amount}€</div>
                        <div className={styles.paymentMethod}>{payment.method}</div>
                        {payment.notes && (
                          <div className={styles.paymentNotes}>{payment.notes}</div>
                        )}
                      </div>
                      <div className={styles.paymentDate}>
                        {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Onglet Historique */}
          {activeTab === 'history' && (
            <div className={styles.historyTab}>
              <h3>📜 Historique des modifications</h3>
              <div className={styles.timeline}>
                {history.length === 0 ? (
                  <div className={styles.emptyState}>Aucun historique</div>
                ) : (
                  history.map((item, index) => (
                    <div key={item.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot}></div>
                      {index < history.length - 1 && <div className={styles.timelineLine}></div>}
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineAction}>{item.action}</div>
                        <div className={styles.timelineDetails}>{item.details}</div>
                        <div className={styles.timelineDate}>
                          {format(new Date(item.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button className={styles.btnEmail} onClick={handleSendEmail}>
            📧 Envoyer email
          </button>
          <div className={styles.footerActions}>
            <button
              className={styles.btnCancel}
              onClick={handleCancelBooking}
              disabled={booking.status === 'cancelled'}
            >
              ❌ Annuler réservation
            </button>
            <button className={styles.btnSecondary} onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
