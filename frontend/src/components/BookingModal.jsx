import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingsAPI, emailAPI, stripeAPI } from '../services/api';
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
  const [showClientRequest, setShowClientRequest] = useState(false);
  const [clientRequestText, setClientRequestText] = useState('');
  const [showActivityEmail, setShowActivityEmail] = useState(false);
  const [activityEmailText, setActivityEmailText] = useState('');

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

  const handleDeleteBooking = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.')) return;

    try {
      await bookingsAPI.delete(bookingId);
      onUpdate?.();
      onClose();
      alert('Réservation supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Impossible de supprimer la réservation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendEmail = async () => {
    try {
      await emailAPI.sendBookingConfirmation(bookingId);
      alert('Email de confirmation envoyé avec succès !');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePayWithStripe = async () => {
    try {
      const remainingAmount = booking.totalPrice - booking.amountPaid;

      if (remainingAmount <= 0) {
        alert('Cette réservation est déjà entièrement payée !');
        return;
      }

      // Créer une session Stripe
      const response = await stripeAPI.createCheckoutSession({
        bookingId: booking.id,
        amount: remainingAmount
      });

      // Rediriger vers Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erreur création session Stripe:', error);
      alert('Impossible de créer la session de paiement: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendClientRequest = async () => {
    if (!clientRequestText.trim()) {
      alert('Veuillez entrer un message à envoyer au client');
      return;
    }

    try {
      await emailAPI.sendCustomEmail({
        bookingId: bookingId,
        to: booking.clientEmail,
        subject: 'Demande d\'information - Votre réservation',
        message: clientRequestText
      });
      alert('Email envoyé avec succès au client !');
      setShowClientRequest(false);
      setClientRequestText('');
    } catch (error) {
      console.error('Erreur envoi email client:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendActivityEmail = async () => {
    try {
      await emailAPI.sendCustomEmail({
        bookingId: bookingId,
        to: booking.clientEmail,
        subject: 'Informations sur votre activité',
        message: activityEmailText
      });
      alert('Email envoyé avec succès au client !');
      setShowActivityEmail(false);
    } catch (error) {
      console.error('Erreur envoi email activité:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateActivityEmailTemplate = () => {
    const unitPrice = booking.totalPrice / booking.numberOfPeople;
    return `Bonjour ${booking.clientFirstName} ${booking.clientLastName},

Voici les informations concernant votre activité :

Activité : ${booking.product?.name || 'N/A'}
Date : ${format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr })}
Horaire : ${session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} - ${session.startTime}
Nombre de personnes : ${booking.numberOfPeople}
Prix unitaire : ${unitPrice.toFixed(2)}€ par personne
Prix total : ${booking.totalPrice}€

Nous vous attendons avec plaisir !

Cordialement,
L'équipe`;
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
                <div className={styles.sectionHeader}>
                  <h3>👤 Informations Client</h3>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => setShowClientRequest(!showClientRequest)}
                  >
                    ✉️ Demande au client
                  </button>
                </div>
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

                {/* Formulaire demande client */}
                {showClientRequest && (
                  <div className={styles.emailForm}>
                    <label className={styles.label}>Message à envoyer au client</label>
                    <textarea
                      className={styles.textarea}
                      value={clientRequestText}
                      onChange={(e) => setClientRequestText(e.target.value)}
                      placeholder="Entrez votre message ici..."
                      rows={5}
                    />
                    <div className={styles.formActions}>
                      <button className={styles.btnPrimary} onClick={handleSendClientRequest}>
                        📧 Envoyer
                      </button>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => {
                          setShowClientRequest(false);
                          setClientRequestText('');
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Session & Activité */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>🏔️ Activité & Session</h3>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => {
                      setActivityEmailText(generateActivityEmailTemplate());
                      setShowActivityEmail(!showActivityEmail);
                    }}
                  >
                    📧 Envoyer au client
                  </button>
                </div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Activité</span>
                    <span className={styles.value}>{booking.product?.name || 'N/A'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Catégorie</span>
                    <span className={styles.value}>{booking.product?.category?.name || 'N/A'}</span>
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
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Prix unitaire</span>
                    <span className={styles.value}>
                      {(booking.totalPrice / booking.numberOfPeople).toFixed(2)}€ / pers.
                    </span>
                  </div>
                </div>

                {/* Formulaire email activité */}
                {showActivityEmail && (
                  <div className={styles.emailForm}>
                    <label className={styles.label}>Email à envoyer au client (modifiable)</label>
                    <textarea
                      className={styles.textarea}
                      value={activityEmailText}
                      onChange={(e) => setActivityEmailText(e.target.value)}
                      rows={12}
                    />
                    <div className={styles.formActions}>
                      <button className={styles.btnPrimary} onClick={handleSendActivityEmail}>
                        📧 Envoyer
                      </button>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => setShowActivityEmail(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
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
          <div className={styles.footerLeft}>
            <button className={styles.btnEmail} onClick={handleSendEmail}>
              📧 Envoyer email
            </button>
            {remainingAmount > 0 && booking.status !== 'cancelled' && (
              <button className={styles.btnPay} onClick={handlePayWithStripe}>
                💳 Payer {remainingAmount}€ avec Stripe
              </button>
            )}
          </div>
          <div className={styles.footerActions}>
            <button
              className={styles.btnDelete}
              onClick={handleDeleteBooking}
            >
              🗑️ Supprimer
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
