import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import WetsuitSummary from './WetsuitSummary';
import styles from './SessionDetailModal.module.css';

const SessionDetailModal = ({ session, onClose, onEdit, onBookingClick, onDuplicate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'clients', 'equipment', 'communication'
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  if (!session) return null;
console.log(session)
  const { bookings = [], startTime, date, guide, products } = session;

  // Calculer les statistiques
  const confirmedBookings = bookings.filter(b => b.status !== 'cancelled');
  const totalPeople = confirmedBookings.reduce((sum, b) => sum + (b.numberOfPeople || 0), 0);
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalPaid = confirmedBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const totalRemaining = totalRevenue - totalPaid;

  // Calculer la capacité
  const getMaxCapacity = () => {
    if (products?.length === 1) {
      return products[0]?.product?.maxCapacity || 10;
    }
    if (bookings?.length > 0) {
      return bookings[0]?.product?.maxCapacity || 10;
    }
    return 10;
  };

  const maxCapacity = getMaxCapacity();
  const occupancyRate = Math.round((totalPeople / maxCapacity) * 100);

  // Nom de la session
  const getSessionName = () => {
    if (products?.length === 1) {
      return products[0]?.product?.name;
    }
    if (bookings?.length > 0) {
      return bookings[0]?.product?.name || 'Session';
    }
    return 'Session';
  };

  // Couleur du produit
  const getProductColor = () => {
    if (products?.length === 1 && products[0]?.product?.color) {
      return products[0].product.color;
    }
    if (bookings?.length > 0 && bookings[0]?.product?.color) {
      return bookings[0].product.color;
    }
    return '#3498db';
  };

  // Grouper les réservations par statut de paiement
  const getPaymentStatus = (booking) => {
    if (booking.status === 'cancelled') return 'cancelled';
    const paidPercentage = (booking.amountPaid / booking.totalPrice) * 100;
    if (paidPercentage >= 100) return 'paid';
    if (paidPercentage > 0) return 'partial';
    return 'unpaid';
  };

  const handleDownloadPDF = () => {
              const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
              const token = localStorage.getItem('token');
              window.open(`${API_URL}/participants/session/${session.id}/print?token=${token}`, '_blank');
              };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'EEEE d MMMM yyyy', { locale: fr });
  };

  // Templates d'emails prédéfinis
  const emailTemplates = {
    rappel: {
      subject: `Rappel : ${getSessionName()} - ${formatDate(date)}`,
      message: `Bonjour,\n\nNous vous rappelons votre réservation pour l'activité ${getSessionName()}.\n\nDate : ${formatDate(date)}\nHeure : ${startTime}\nGuide : ${guide?.login || 'À confirmer'}\n\nPensez à arriver 15 minutes avant le début de l'activité.\n\nÀ bientôt !`
    },
    confirmation: {
      subject: `Confirmation : ${getSessionName()} - ${formatDate(date)}`,
      message: `Bonjour,\n\nVotre réservation pour ${getSessionName()} est confirmée !\n\nDate : ${formatDate(date)}\nHeure : ${startTime}\nGuide : ${guide?.login || 'À confirmer'}\n\nNous avons hâte de vous accueillir.\n\nCordialement`
    },
    annulation: {
      subject: `Annulation : ${getSessionName()} - ${formatDate(date)}`,
      message: `Bonjour,\n\nNous sommes au regret de vous informer que la session ${getSessionName()} prévue le ${formatDate(date)} à ${startTime} est annulée.\n\nNous vous recontacterons pour vous proposer une nouvelle date.\n\nToutes nos excuses pour ce désagrément.`
    },
    modification: {
      subject: `Modification : ${getSessionName()} - ${formatDate(date)}`,
      message: `Bonjour,\n\nNous vous informons d'une modification concernant votre réservation pour ${getSessionName()}.\n\nNouvelle date : ${formatDate(date)}\nNouvelle heure : ${startTime}\n\nMerci de bien noter ces changements.\n\nCordialement`
    },
    info: {
      subject: `Informations importantes : ${getSessionName()}`,
      message: `Bonjour,\n\nVoici quelques informations importantes concernant votre prochaine activité ${getSessionName()} prévue le ${formatDate(date)} à ${startTime}.\n\n[Insérez vos informations ici]\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nÀ bientôt !`
    }
  };

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    if (templateKey && emailTemplates[templateKey]) {
      setEmailSubject(emailTemplates[templateKey].subject);
      setEmailMessage(emailTemplates[templateKey].message);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      alert('Veuillez remplir le sujet et le message');
      return;
    }

    if (confirmedBookings.length === 0) {
      alert('Aucun participant à qui envoyer l\'email');
      return;
    }

    if (!window.confirm(`Envoyer cet email à ${confirmedBookings.length} participant(s) ?`)) {
      return;
    }

    setSendingEmail(true);
    try {
      // TODO: Implémenter l'envoi d'emails groupés via l'API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation
      alert(`Email envoyé avec succès à ${confirmedBookings.length} participant(s) !`);
      setEmailSubject('');
      setEmailMessage('');
      setSelectedTemplate('');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDuplicateSession = () => {
    onDuplicate?.(session);
  };

  const handleDeleteSession = async () => {
    if (confirmedBookings.length > 0) {
      alert('Impossible de supprimer une session avec des réservations confirmées');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      onDelete?.(session.id);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header avec couleur du produit */}
        <div className={styles.modalHeader} style={{ backgroundColor: getProductColor() }}>
          <div className={styles.headerContent}>
            <h2>{getSessionName()}</h2>
            <p className={styles.sessionDateTime}>
              {formatDate(date)} - {startTime}
            </p>
            <p className={styles.sessionGuide}>
              Guide : {guide?.login || 'Non assigné'}
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Onglets */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'clients' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            Clients ({confirmedBookings.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'equipment' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            🧥 Équipements
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'communication' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('communication')}
          >
            Communication
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className={styles.modalBody}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              {/* Statistiques rapides */}
              <div className={styles.quickStats}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Participants</div>
                  <div className={styles.statValue}>{totalPeople} / {maxCapacity}</div>
                  <div className={styles.statProgress}>
                    <div
                      className={styles.statProgressBar}
                      style={{ width: `${occupancyRate}%`, backgroundColor: getProductColor() }}
                    />
                  </div>
                  <div className={styles.statSubtext}>{occupancyRate}% de remplissage</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Réservations</div>
                  <div className={styles.statValue}>{confirmedBookings.length}</div>
                  <div className={styles.statSubtext}>
                    {bookings.filter(b => b.status === 'cancelled').length} annulée(s)
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Chiffre d'affaires</div>
                  <div className={styles.statValue}>{totalRevenue.toFixed(2)} €</div>
                  <div className={styles.statSubtext}>
                    {totalPaid.toFixed(2)} € encaissé
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Reste à encaisser</div>
                  <div className={styles.statValue} style={{ color: totalRemaining > 0 ? '#f59e0b' : '#72b416' }}>
                    {totalRemaining.toFixed(2)} €
                  </div>
                  <div className={styles.statSubtext}>
                    {totalRemaining > 0 ? 'Paiements en attente' : 'Tout encaissé'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button className={styles.btnPrimary} onClick={() => onEdit(session)}>
                  ✏️ Modifier
                </button>
                <button className={styles.btnSecondary} onClick={handleDuplicateSession}>
                  📋 Dupliquer
                </button>
                <button className={styles.btnSecondary} onClick={handleDownloadPDF}>
                  📄 PDF Info résa
                </button>
                <button className={styles.btnDanger} onClick={handleDeleteSession}>
                  🗑️ Supprimer
                </button>
              </div>

              {/* Aperçu des réservations */}
              <div className={styles.bookingsPreview}>
                <h3>Réservations confirmées</h3>
                {confirmedBookings.length === 0 ? (
                  <p className={styles.emptyState}>Aucune réservation pour cette session</p>
                ) : (
                  <div className={styles.bookingsList}>
                    {confirmedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={styles.bookingPreviewCard}
                        onClick={() => onBookingClick(booking.id)}
                      >
                        <div className={styles.bookingPreviewLeft}>
                          <div className={styles.bookingPreviewName}>
                            {booking.clientFirstName} {booking.clientLastName}
                          </div>
                          <div className={styles.bookingPreviewDetails}>
                            {booking.numberOfPeople} pers. • {booking.clientPhone}
                          </div>
                        </div>
                        <div className={styles.bookingPreviewRight}>
                          <div className={styles.bookingPreviewPrice}>{booking.totalPrice} €</div>
                          <div className={`${styles.bookingPreviewStatus} ${styles[getPaymentStatus(booking)]}`}>
                            {getPaymentStatus(booking) === 'paid' && '✓ Payé'}
                            {getPaymentStatus(booking) === 'partial' && '◐ Partiel'}
                            {getPaymentStatus(booking) === 'unpaid' && '○ Non payé'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className={styles.clientsTab}>
              <div className={styles.clientsHeader}>
                <h3>Détails des clients</h3>
              </div>

              {confirmedBookings.length === 0 ? (
                <p className={styles.emptyState}>Aucun client pour cette session</p>
              ) : (
                <div className={styles.clientsTable}>
                  {confirmedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={styles.clientCard}
                    >
                      <div className={styles.clientCardHeader}>
                        <div className={styles.clientName}>
                          {booking.clientFirstName} {booking.clientLastName}
                          {booking.clientNationality && (
                            <img
                              src={`https://flagcdn.com/16x12/${booking.clientNationality.toLowerCase()}.png`}
                              alt={booking.clientNationality}
                              className={styles.clientFlag}
                            />
                          )}
                        </div>
                        <div className={styles.clientCardActions}>
                          <div className={`${styles.clientPaymentBadge} ${styles[getPaymentStatus(booking)]}`}>
                            {getPaymentStatus(booking) === 'paid' && '✓ Payé'}
                            {getPaymentStatus(booking) === 'partial' && '◐ Partiel'}
                            {getPaymentStatus(booking) === 'unpaid' && '○ Non payé'}
                          </div>
                          <button
                            className={styles.btnEditClient}
                            onClick={() => onBookingClick(booking.id)}
                            title="Voir/Modifier la réservation"
                          >
                            ✏️ Modifier
                          </button>
                        </div>
                      </div>

                      <div className={styles.clientCardBody}>
                        <div className={styles.clientInfo}>
                          <span className={styles.clientInfoLabel}>📞 Téléphone :</span>
                          <span className={styles.clientInfoValue}>{booking.clientPhone || 'N/A'}</span>
                        </div>
                        <div className={styles.clientInfo}>
                          <span className={styles.clientInfoLabel}>👥 Participants :</span>
                          <span className={styles.clientInfoValue}>{booking.numberOfPeople} personne(s)</span>
                        </div>
                        <div className={styles.clientInfo}>
                          <span className={styles.clientInfoLabel}>💰 Prix :</span>
                          <span className={styles.clientInfoValue}>{booking.totalPrice} €</span>
                        </div>
                        <div className={styles.clientInfo}>
                          <span className={styles.clientInfoLabel}>✓ Encaissé :</span>
                          <span className={styles.clientInfoValue}>{booking.amountPaid} €</span>
                        </div>
                        {booking.totalPrice - booking.amountPaid > 0 && (
                          <div className={styles.clientInfo}>
                            <span className={styles.clientInfoLabel}>⚠️ Reste :</span>
                            <span className={styles.clientInfoValue} style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                              {(booking.totalPrice - booking.amountPaid).toFixed(2)} €
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Équipements */}
          {activeTab === 'equipment' && (
            <div className={styles.equipmentTab}>
              <WetsuitSummary sessionId={session.id} onClose={null} />
            </div>
          )}

          {activeTab === 'communication' && (
            <div className={styles.communicationTab}>
              <div className={styles.communicationHeader}>
                <h3>Envoyer un email à tous les participants</h3>
                <p className={styles.communicationSubtext}>
                  {confirmedBookings.length} destinataire(s)
                </p>
              </div>

              {/* Sélection de template */}
              <div className={styles.templateSection}>
                <label className={styles.label}>Template prédéfini (optionnel)</label>
                <select
                  className={styles.select}
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <option value="">-- Sélectionner un template --</option>
                  <option value="rappel">📅 Rappel de session</option>
                  <option value="confirmation">✓ Confirmation</option>
                  <option value="annulation">✕ Annulation</option>
                  <option value="modification">✏️ Modification</option>
                  <option value="info">ℹ️ Informations importantes</option>
                </select>
              </div>

              {/* Formulaire d'email */}
              <div className={styles.emailForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sujet de l'email</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Ex: Rappel - Session du 15 janvier"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Message</label>
                  <textarea
                    className={styles.textarea}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Tapez votre message ici..."
                    rows="12"
                  />
                </div>

                <div className={styles.emailActions}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailSubject || !emailMessage}
                  >
                    {sendingEmail ? '✉️ Envoi en cours...' : `✉️ Envoyer à ${confirmedBookings.length} participant(s)`}
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => {
                      setEmailSubject('');
                      setEmailMessage('');
                      setSelectedTemplate('');
                    }}
                  >
                    🗑️ Réinitialiser
                  </button>
                </div>
              </div>

              {/* Liste des destinataires */}
              <div className={styles.recipientsList}>
                <h4>Destinataires ({confirmedBookings.length})</h4>
                <div className={styles.recipientsGrid}>
                  {confirmedBookings.map((booking) => (
                    <div key={booking.id} className={styles.recipientCard}>
                      <div className={styles.recipientName}>
                        {booking.clientFirstName} {booking.clientLastName}
                      </div>
                      <div className={styles.recipientEmail}>
                        {booking.clientEmail || 'Email non renseigné'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
