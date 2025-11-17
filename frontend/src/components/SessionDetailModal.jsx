import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import WetsuitSummary from './WetsuitSummary';
import { bookingsAPI } from '../services/api';
import styles from './SessionDetailModal.module.css';

const SessionDetailModal = ({ session, onClose, onEdit, onBookingClick, onDuplicate, onDelete, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'clients', 'equipment', 'communication'
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);
  const [alternativeSessions, setAlternativeSessions] = useState([]);
  const [selectedTargetSession, setSelectedTargetSession] = useState(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showProductEditModal, setShowProductEditModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState({}); // État pour stocker les notes de chaque réservation

  if (!session) return null;
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
    return 'var(--guide-primary)';
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

  // Récupérer les sessions alternatives pour le déplacement
  const fetchAlternativeSessions = async () => {
    setLoadingAlternatives(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}/alternatives`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sessions alternatives:', data);
        setAlternativeSessions(data.alternativeSessions || []);
      } else {
        console.error('Erreur lors de la récupération des sessions alternatives');
        setAlternativeSessions([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setAlternativeSessions([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Charger les alternatives lorsqu'on choisit "move"
  useEffect(() => {
    if (deleteAction === 'move') {
      fetchAlternativeSessions();
    }
  }, [deleteAction]);

  // Charger les notes pour toutes les réservations confirmées
  const loadAllNotes = async () => {
    if (!confirmedBookings || confirmedBookings.length === 0) {
      setBookingNotes({});
      return;
    }

    try {
      // Charger les notes pour chaque réservation
      const notesPromises = confirmedBookings.map(async (booking) => {
        try {
          const response = await bookingsAPI.getNotes(booking.id);
          return {
            bookingId: booking.id,
            notes: response.data.notes || []
          };
        } catch (error) {
          console.error(`Erreur chargement notes pour réservation ${booking.id}:`, error);
          return {
            bookingId: booking.id,
            notes: []
          };
        }
      });

      const notesResults = await Promise.all(notesPromises);

      // Créer un objet avec bookingId comme clé
      const notesMap = {};
      notesResults.forEach(({ bookingId, notes }) => {
        notesMap[bookingId] = notes;
      });

      setBookingNotes(notesMap);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
    }
  };

  // Charger les notes quand le modal s'ouvre ou quand les réservations changent
  useEffect(() => {
    loadAllNotes();
  }, [session?.id, confirmedBookings.length]);

  const handleDeleteSession = async () => {
    // Si la session a des réservations confirmées, ouvrir le dialogue de choix
    if (confirmedBookings.length > 0) {
      setShowDeleteDialog(true);
      setDeleteAction(null);
      setSelectedTargetSession(null);
      setAlternativeSessions([]);
      return;
    }

    // Sinon, suppression simple
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          alert('Session supprimée avec succès');
          onDelete?.(session.id);
          onClose();
        } else {
          const data = await response.json();
          alert(`Erreur: ${data.error || 'Impossible de supprimer la session'}`);
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression de la session');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteAction) {
      alert('Veuillez choisir une action (déplacer ou supprimer)');
      return;
    }

    if (deleteAction === 'move' && !selectedTargetSession) {
      alert('Veuillez sélectionner une session de destination');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const body = {
        action: deleteAction
      };

      if (deleteAction === 'move') {
        body.targetSessionId = selectedTargetSession;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Opération réussie');
        setShowDeleteDialog(false);
        onDelete?.(session.id);
        onClose();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible de supprimer la session'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  // Gestion de la sélection multiple
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedBookings([]);
  };

  const toggleBookingSelection = (bookingId) => {
    setSelectedBookings(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  const selectAllBookings = () => {
    if (selectedBookings.length === confirmedBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(confirmedBookings.map(b => b.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      alert('Aucune réservation sélectionnée');
      return;
    }

    if (!window.confirm(`Voulez-vous vraiment supprimer ${selectedBookings.length} réservation(s) ?`)) {
      return;
    }

    try {
      // Supprimer chaque réservation sélectionnée
      await Promise.all(
        selectedBookings.map(bookingId => bookingsAPI.delete(bookingId))
      );

      alert(`${selectedBookings.length} réservation(s) supprimée(s) avec succès !`);
      setSelectedBookings([]);
      setSelectionMode(false);
      onUpdate?.();
    } catch (error) {
      console.error('Erreur lors de la suppression groupée:', error);
      alert('Erreur lors de la suppression des réservations: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBulkMove = () => {
    if (selectedBookings.length === 0) {
      alert('Aucune réservation sélectionnée');
      return;
    }
    setShowBulkMoveModal(true);
  };

  const handleBulkMoveSuccess = () => {
    setSelectedBookings([]);
    setSelectionMode(false);
    setShowBulkMoveModal(false);
    onUpdate?.();
  };

  // Déterminer si on utilise le nouveau mode d'édition produit
  // Condition: session NON magic rotation OU session magic rotation avec réservations
  const shouldUseProductEditMode = () => {
    const hasConfirmedBookings = confirmedBookings.length > 0;
    const isMagicRotation = session.isMagicRotation;

    // Si ce n'est pas une rotation magique, ou si c'est une rotation magique avec réservations
    return !isMagicRotation || hasConfirmedBookings;
  };

  // Handler pour le bouton Modifier
  const handleModifyClick = () => {
    if (shouldUseProductEditMode()) {
      // Nouveau mode: édition des paramètres du produit pour cette session
      setShowProductEditModal(true);
    } else {
      // Mode classique: édition de la session (pour rotation magique sans réservations)
      onEdit(session);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header avec couleur du produit - Compact */}
        <div className={styles.modalHeader} style={{ backgroundColor: getProductColor() }}>
          <div className={styles.headerContentCompact}>
            <span className={styles.headerProductName}>{getSessionName()}</span>
            <span className={styles.headerDivider}>•</span>
            <span className={styles.headerDate}>{format(new Date(date), 'EEEE dd/MM', { locale: fr })}</span>
            <span className={styles.headerDivider}>•</span>
            <span className={styles.headerTime}>{startTime}</span>
            <span className={styles.headerDivider}>•</span>
            <span className={styles.headerGuide}>{guide?.login || 'Non assigné'}</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Onglets */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
            style={activeTab === 'overview' ? {
              color: 'var(--guide-primary)',
              borderBottomColor: 'var(--guide-primary)'
            } : {}}
          >
            Vue d'ensemble
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'equipment' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('equipment')}
            style={activeTab === 'equipment' ? {
              color: 'var(--guide-primary)',
              borderBottomColor: 'var(--guide-primary)'
            } : {}}
          >
            🧥 Équipements
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'communication' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('communication')}
            style={activeTab === 'communication' ? {
              color: 'var(--guide-primary)',
              borderBottomColor: 'var(--guide-primary)'
            } : {}}
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

              {/* Aperçu des réservations */}
              <div className={styles.bookingsPreview}>
                <div className={styles.bookingsPreviewHeader}>
                  <h3>Réservations confirmées</h3>
                  <div className={styles.bookingsHeaderActions}>
                    {!selectionMode ? (
                      <button
                        className={styles.btnSelect}
                        onClick={toggleSelectionMode}
                        disabled={confirmedBookings.length === 0}
                        style={{ backgroundColor: 'var(--guide-primary)' }}
                      >
                        ☑ Sélectionner
                      </button>
                    ) : (
                      <>
                        <button
                          className={styles.btnSelectAll}
                          onClick={selectAllBookings}
                        >
                          {selectedBookings.length === confirmedBookings.length ? '☐ Tout désélectionner' : '☑ Tout sélectionner'}
                        </button>
                        <button
                          className={styles.btnCancelSelection}
                          onClick={toggleSelectionMode}
                        >
                          ✕ Annuler
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {confirmedBookings.length === 0 ? (
                  <p className={styles.emptyState}>Aucune réservation pour cette session</p>
                ) : (
                  <>
                    <div className={styles.bookingsList}>
                      {confirmedBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`${styles.bookingPreviewCard} ${
                            selectionMode ? styles.bookingPreviewCardSelectable : ''
                          } ${
                            selectedBookings.includes(booking.id) ? styles.bookingPreviewCardSelected : ''
                          }`}
                          onClick={() => {
                            if (selectionMode) {
                              toggleBookingSelection(booking.id);
                            } else {
                              onBookingClick(booking.id);
                            }
                          }}
                        >
                          {selectionMode && (
                            <div className={styles.bookingCheckbox}>
                              <input
                                type="checkbox"
                                checked={selectedBookings.includes(booking.id)}
                                onChange={() => toggleBookingSelection(booking.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          <div className={styles.bookingPreviewLeft}>
                            <div className={styles.bookingPreviewName}>
                              {booking.clientFirstName} {booking.clientLastName}
                              {/* Afficher l'indicateur de note si des notes existent */}
                              {bookingNotes[booking.id] && bookingNotes[booking.id].length > 0 && (
                                <span
                                  style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.85rem',
                                    color: '#f59e0b',
                                    fontWeight: 'bold'
                                  }}
                                  title={`${bookingNotes[booking.id].length} note(s)`}
                                >
                                  📝
                                </span>
                              )}
                            </div>
                            <div className={styles.bookingPreviewDetails}>
                              {booking.numberOfPeople} pers. • {booking.clientPhone}
                            </div>
                            {/* Afficher les notes si elles existent */}
                            {bookingNotes[booking.id] && bookingNotes[booking.id].length > 0 && (
                              <div style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                              }}>
                                {bookingNotes[booking.id].map((note, index) => (
                                  <div
                                    key={note.id}
                                    style={{
                                      marginBottom: index < bookingNotes[booking.id].length - 1 ? '0.25rem' : '0',
                                      color: '#78350f'
                                    }}
                                  >
                                    <strong>📝 Note {bookingNotes[booking.id].length > 1 ? `${index + 1}` : ''}:</strong> {note.content}
                                  </div>
                                ))}
                              </div>
                            )}
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

                    {/* Barre d'actions groupées */}
                    {selectionMode && selectedBookings.length > 0 && (
                      <div className={styles.bulkActionsBar}>
                        <div className={styles.bulkActionsInfo}>
                          {selectedBookings.length} réservation(s) sélectionnée(s)
                        </div>
                        <div className={styles.bulkActionsButtons}>
                          <button
                            className={styles.btnBulkMove}
                            onClick={handleBulkMove}
                          >
                            🔄 Déplacer
                          </button>
                          <button
                            className={styles.btnBulkDelete}
                            onClick={handleBulkDelete}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
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

        {/* Footer fixe avec actions */}
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={handleDownloadPDF}>
            📄 PDF Info résa
          </button>
          <button className={styles.btnSecondary} onClick={handleDuplicateSession}>
            📋 Dupliquer
          </button>
          <span className={styles.textLink} onClick={handleModifyClick}>
            Modifier
          </span>
          <span className={styles.textLinkDanger} onClick={handleDeleteSession}>
            Supprimer
          </span>
        </div>

        {/* Modal de déplacement groupé */}
        {showBulkMoveModal && selectedBookings.length > 0 && (
          <BulkMoveModal
            bookingIds={selectedBookings}
            currentSession={session}
            onClose={() => setShowBulkMoveModal(false)}
            onSuccess={handleBulkMoveSuccess}
          />
        )}

        {/* Modal de suppression avec gestion des réservations */}
        {showDeleteDialog && (
          <DeleteSessionDialog
            session={session}
            confirmedBookings={confirmedBookings}
            deleteAction={deleteAction}
            setDeleteAction={setDeleteAction}
            alternativeSessions={alternativeSessions}
            selectedTargetSession={selectedTargetSession}
            setSelectedTargetSession={setSelectedTargetSession}
            loadingAlternatives={loadingAlternatives}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteDialog(false);
              setDeleteAction(null);
              setSelectedTargetSession(null);
              setAlternativeSessions([]);
            }}
          />
        )}

        {/* Modal d'édition des paramètres du produit pour cette session */}
        {showProductEditModal && (
          <ProductEditModal
            session={session}
            confirmedBookings={confirmedBookings}
            onClose={() => setShowProductEditModal(false)}
            onSuccess={() => {
              setShowProductEditModal(false);
              onUpdate?.();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Composant pour la confirmation de suppression avec gestion des réservations
const DeleteSessionDialog = ({
  session,
  confirmedBookings,
  deleteAction,
  setDeleteAction,
  alternativeSessions,
  selectedTargetSession,
  setSelectedTargetSession,
  loadingAlternatives,
  onConfirm,
  onCancel
}) => {
  return (
    <div className={styles.bulkMoveOverlay} onClick={onCancel}>
      <div className={styles.bulkMoveModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bulkMoveHeader}>
          <h3>⚠️ Session avec réservations</h3>
          <button className={styles.closeButton} onClick={onCancel}>×</button>
        </div>

        <div className={styles.bulkMoveBody}>
          <div className={styles.bulkMoveInfo}>
            <p>
              Cette session contient <strong>{confirmedBookings.length} réservation(s)</strong>.
            </p>
            <p>
              Que souhaitez-vous faire avec les réservations ?
            </p>
          </div>

          {/* Liste des réservations */}
          <div className={styles.bookingsList} style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {confirmedBookings.map(booking => (
              <div key={booking.id} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ fontWeight: 'bold' }}>
                  👤 {booking.clientFirstName} {booking.clientLastName}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  📧 {booking.clientEmail}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  👥 {booking.numberOfPeople} personne(s)
                </div>
              </div>
            ))}
          </div>

          {/* Choix de l'action */}
          <div className={styles.formGroup}>
            <label>Choisissez une action :</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: `2px solid ${deleteAction === 'move' ? 'var(--guide-primary)' : '#ddd'}`,
                  backgroundColor: deleteAction === 'move' ? 'var(--guide-primary-light, #e8f4f8)' : 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: deleteAction === 'move' ? 'bold' : 'normal'
                }}
                onClick={() => setDeleteAction('move')}
              >
                📦 Déplacer vers une autre session
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: `2px solid ${deleteAction === 'delete' ? '#dc2626' : '#ddd'}`,
                  backgroundColor: deleteAction === 'delete' ? '#fee' : 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: deleteAction === 'delete' ? 'bold' : 'normal',
                  color: deleteAction === 'delete' ? '#dc2626' : 'inherit'
                }}
                onClick={() => setDeleteAction('delete')}
              >
                🗑️ Supprimer les réservations
              </button>
            </div>
          </div>

          {/* Sélection de session alternative si action = move */}
          {deleteAction === 'move' && (
            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
              <label>Sélectionnez une session de destination</label>

              {loadingAlternatives && (
                <p style={{ color: '#666', fontStyle: 'italic' }}>⏳ Chargement des sessions disponibles...</p>
              )}

              {!loadingAlternatives && alternativeSessions.length === 0 && (
                <p style={{ color: '#dc2626' }}>
                  ℹ️ Aucune session compatible trouvée. Créez d'abord une nouvelle session ou supprimez les réservations.
                </p>
              )}

              {!loadingAlternatives && alternativeSessions.length > 0 && (
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem' }}>
                  {alternativeSessions.map(altSession => (
                    <div
                      key={altSession.id}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        border: `2px solid ${selectedTargetSession === altSession.id ? 'var(--guide-primary)' : '#ddd'}`,
                        backgroundColor: selectedTargetSession === altSession.id ? 'var(--guide-primary-light, #e8f4f8)' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedTargetSession(altSession.id)}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        📅 {format(new Date(altSession.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        ⏰ {altSession.timeSlot} - {altSession.startTime}
                      </div>
                      {altSession.bookings && altSession.bookings.length > 0 && (
                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                          {altSession.bookings.length} réservation(s) actuelles
                        </div>
                      )}
                      {altSession.compatibilityInfo?.lockedProductId && (
                        <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                          🔒 Produit verrouillé par rotation magique
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Avertissement si action = delete */}
          {deleteAction === 'delete' && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              color: '#dc2626',
              marginTop: '1rem'
            }}>
              <p style={{ margin: 0 }}>
                ⚠️ <strong>Attention :</strong> Cette action est irréversible. Toutes les réservations seront définitivement supprimées.
              </p>
            </div>
          )}
        </div>

        <div className={styles.bulkMoveFooter}>
          <button
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className={styles.btnPrimary}
            onClick={onConfirm}
            disabled={!deleteAction || (deleteAction === 'move' && !selectedTargetSession)}
            style={{
              backgroundColor: deleteAction === 'delete' ? '#dc2626' : 'var(--guide-primary)',
              opacity: (!deleteAction || (deleteAction === 'move' && !selectedTargetSession)) ? 0.5 : 1
            }}
          >
            {deleteAction === 'delete' ? 'Supprimer tout' : 'Déplacer et supprimer la session'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant pour le déplacement groupé
const BulkMoveModal = ({ bookingIds, currentSession, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [needsProductSelection, setNeedsProductSelection] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    loadAvailableSessions();
  }, []);

  const loadAvailableSessions = async () => {
    try {
      setLoading(true);
      const { sessionsAPI } = await import('../services/api');
      const response = await sessionsAPI.getAll();

      // Filtrer pour exclure la session actuelle et ne garder que les sessions futures
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureSessions = response.data.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return session.id !== currentSession.id && sessionDate >= today;
      });

      console.log('📊 Sessions futures disponibles:', futureSessions.length);
      console.log('📦 Détails des sessions:', futureSessions.map(s => ({
        date: s.date,
        time: s.startTime,
        products: s.products?.map(p => p.product?.name),
        bookings: s.bookings?.map(b => b.product?.name)
      })));

      setAvailableSessions(futureSessions);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      alert('Impossible de charger les sessions disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = (sessionId) => {
    setSelectedSessionId(sessionId);
    setSelectedProductId('');
    setNeedsProductSelection(false);
    setAvailableProducts([]);

    if (!sessionId) return;

    // Trouver la session sélectionnée
    const selectedSession = availableSessions.find(s => s.id === sessionId);
    if (!selectedSession) return;

    // Vérifier si la session a déjà des réservations
    const hasBookings = selectedSession.bookings && selectedSession.bookings.filter(b => b.status !== 'cancelled').length > 0;

    if (hasBookings) {
      // Session avec réservations - le produit est déjà fixé
      setNeedsProductSelection(false);
    } else if (selectedSession.products && selectedSession.products.length > 1) {
      // Session vide avec plusieurs produits - demander le choix
      setNeedsProductSelection(true);
      setAvailableProducts(selectedSession.products.map(sp => ({
        id: sp.product.id,
        name: sp.product.name,
        price: sp.product.priceIndividual
      })));
    } else if (selectedSession.products && selectedSession.products.length === 1) {
      // Session vide avec un seul produit - sélectionner automatiquement
      setSelectedProductId(selectedSession.products[0].product.id);
      setNeedsProductSelection(false);
    }
  };

  const handleBulkMove = async () => {
    if (!selectedSessionId) {
      alert('Veuillez sélectionner une session de destination');
      return;
    }

    if (needsProductSelection && !selectedProductId) {
      alert('Veuillez sélectionner un produit pour cette session');
      return;
    }

    if (!window.confirm(`Déplacer ${bookingIds.length} réservation(s) vers la nouvelle session ?`)) {
      return;
    }

    try {
      setLoading(true);

      console.log('🚀 Déplacement groupé:', {
        bookingIds,
        newSessionId: selectedSessionId,
        selectedProductId: selectedProductId || null,
        count: bookingIds.length
      });

      // Déplacer chaque réservation vers la nouvelle session
      const results = await Promise.all(
        bookingIds.map(bookingId =>
          bookingsAPI.move(bookingId, {
            newSessionId: selectedSessionId,
            selectedProductId: selectedProductId || null
          })
        )
      );

      console.log('✅ Résultats du déplacement:', results.map(r => r.data));

      alert(`${bookingIds.length} réservation(s) déplacée(s) avec succès !`);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur déplacement groupé:', error);
      alert('Erreur lors du déplacement: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bulkMoveOverlay} onClick={onClose}>
      <div className={styles.bulkMoveModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bulkMoveHeader}>
          <h3>Déplacer {bookingIds.length} réservation(s)</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.bulkMoveBody}>
          <div className={styles.bulkMoveInfo}>
            <p>
              <strong>Session actuelle :</strong>{' '}
              {format(new Date(currentSession.date), 'EEEE dd/MM', { locale: fr })} - {currentSession.startTime.substring(0, 5).replace(':', 'h')}
            </p>
          </div>

          {loading && <div className={styles.loading}>Chargement...</div>}

          {!loading && availableSessions.length === 0 && (
            <div className={styles.emptyState}>Aucune session future disponible</div>
          )}

          {!loading && availableSessions.length > 0 && (
            <>
              <div className={styles.formGroup}>
                <label>Sélectionner la session de destination</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSessionChange(e.target.value)}
                  className={styles.select}
                >
                <option value="">-- Choisir une session --</option>
                {(() => {
                  // Grouper les sessions par date
                  const sessionsByDate = {};
                  availableSessions.forEach(session => {
                    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
                    if (!sessionsByDate[dateKey]) {
                      sessionsByDate[dateKey] = {
                        dateLabel: format(new Date(session.date), 'EEEE dd/MM', { locale: fr }),
                        sessions: []
                      };
                    }
                    sessionsByDate[dateKey].sessions.push(session);
                  });

                  // Trier par date
                  const sortedDates = Object.keys(sessionsByDate).sort();

                  return sortedDates.map(dateKey => {
                    const { dateLabel, sessions } = sessionsByDate[dateKey];
                    return [
                      <option key={`date-${dateKey}`} disabled style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                        {dateLabel} :
                      </option>,
                      ...sessions.map(session => {
                        // Déterminer le nom du produit ou des produits
                        let productName;

                        // Si la session a déjà des réservations, utiliser le produit dominant
                        if (session.bookings && session.bookings.length > 0) {
                          const confirmedBookings = session.bookings.filter(b => b.status !== 'cancelled');
                          if (confirmedBookings.length > 0) {
                            productName = confirmedBookings[0].product?.name || 'Session';
                          }
                        }

                        // Si pas de réservations, regarder les produits disponibles
                        if (!productName && session.products && session.products.length > 0) {
                          if (session.products.length === 1) {
                            // Un seul produit
                            productName = session.products[0].product?.name || 'Sessions';
                          } else {
                            // Plusieurs produits - choix multiple
                            productName = 'Sessions';
                          }
                        }

                        // Fallback
                        if (!productName) {
                          productName = 'Sessions';
                        }

                        const guideName = session.guide?.login || 'Pas de guide';
                        const time = session.startTime.substring(0, 5); // "09:00" -> "09h00"
                        const timeFormatted = time.replace(':', 'h');

                        return (
                          <option key={session.id} value={session.id}>
                            &nbsp;&nbsp;&nbsp;{timeFormatted} - {productName} ({guideName})
                          </option>
                        );
                      })
                    ];
                  }).flat();
                })()}
                </select>
              </div>

              {/* Sélection du produit si nécessaire */}
              {needsProductSelection && availableProducts.length > 0 && (
                <div className={styles.formGroup}>
                  <label>Sélectionner le produit</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">-- Choisir un produit --</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price}€/personne
                      </option>
                    ))}
                  </select>
                  <p className={styles.productSelectionNote}>
                    ⚠️ Cette session propose plusieurs canyons. Veuillez choisir le canyon de destination.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.bulkMoveFooter}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleBulkMove}
            disabled={loading || !selectedSessionId || (needsProductSelection && !selectedProductId)}
          >
            {loading ? 'Déplacement...' : 'Déplacer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant pour l'édition des paramètres du produit pour une session spécifique
const ProductEditModal = ({ session, confirmedBookings, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(session?.status || 'open');
  const [startTime, setStartTime] = useState(session?.startTime || '');

  // État du formulaire avec tous les champs éditables
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    priceIndividual: '',
    duration: '',
    color: '#93C5FD',
    level: 'découverte',
    region: 'annecy',
    maxCapacity: '',
    autoCloseHoursBefore: '',
    postBookingMessage: '',
    wazeLink: '',
    googleMapsLink: '',
    websiteLink: ''
  });

  // Récupérer le produit actuel de la session
  const getCurrentProduct = () => {
    if (session.products?.length === 1) {
      return session.products[0].product;
    }
    if (session.bookings?.length > 0) {
      return session.bookings[0].product;
    }
    return null;
  };

  const currentProduct = getCurrentProduct();
  const hasBookings = confirmedBookings.length > 0;

  // Charger les produits disponibles du guide
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const guideId = session.guide?.id;

        if (!guideId) return;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products?guideId=${guideId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAvailableProducts(data.products || []);
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [session.guide?.id]);

  // Initialiser le formulaire avec les données du produit actuel
  useEffect(() => {
    if (currentProduct) {
      setSelectedProductId(currentProduct.id);
      setFormData({
        name: currentProduct.name || '',
        shortDescription: currentProduct.shortDescription || '',
        longDescription: currentProduct.longDescription || '',
        priceIndividual: currentProduct.priceIndividual || '',
        duration: currentProduct.duration || '',
        color: currentProduct.color || '#93C5FD',
        level: currentProduct.level || 'découverte',
        region: currentProduct.region || 'annecy',
        maxCapacity: currentProduct.maxCapacity || '',
        autoCloseHoursBefore: currentProduct.autoCloseHoursBefore || '',
        postBookingMessage: currentProduct.postBookingMessage || '',
        wazeLink: currentProduct.wazeLink || '',
        googleMapsLink: currentProduct.googleMapsLink || '',
        websiteLink: currentProduct.websiteLink || ''
      });
    }
  }, [currentProduct]);

  // Mettre à jour le formulaire quand le produit sélectionné change
  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const product = availableProducts.find(p => p.id === productId);

    if (product) {
      setFormData({
        name: product.name || '',
        shortDescription: product.shortDescription || '',
        longDescription: product.longDescription || '',
        priceIndividual: product.priceIndividual || '',
        duration: product.duration || '',
        color: product.color || '#93C5FD',
        level: product.level || 'découverte',
        region: product.region || 'annecy',
        maxCapacity: product.maxCapacity || '',
        autoCloseHoursBefore: product.autoCloseHoursBefore || '',
        postBookingMessage: product.postBookingMessage || '',
        wazeLink: product.wazeLink || '',
        googleMapsLink: product.googleMapsLink || '',
        websiteLink: product.websiteLink || ''
      });
    }
  };

  // Handler pour les changements de champs
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!selectedProductId) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    if (!formData.name || !formData.priceIndividual || !formData.duration || !formData.maxCapacity) {
      alert('Veuillez remplir tous les champs obligatoires (nom, prix, durée, capacité)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        productId: selectedProductId,
        productOverrides: formData,
        sessionStatus: sessionStatus,
        startTime: startTime,
        sendConfirmationEmail: hasBookings ? sendConfirmationEmail : false
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}/product`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        alert('Modifications enregistrées avec succès !');
        onSuccess?.();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible de sauvegarder les modifications'}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des modifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bulkMoveOverlay} onClick={onClose}>
      <div className={styles.bulkMoveModal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className={styles.bulkMoveHeader}>
          <h3>✏️ Modifier le produit pour cette session</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.bulkMoveBody}>
          {loading && <div className={styles.loading}>Chargement...</div>}

          {!loading && (
            <>
              {/* Sélection du produit */}
              <div className={styles.formGroup}>
                <label style={{ fontWeight: 'bold' }}>Produit *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="">-- Sélectionner un produit --</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  Vous pouvez changer de produit ou modifier les paramètres ci-dessous pour cette session uniquement
                </p>
              </div>

              {/* Statut de la session et heure de départ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontWeight: 'bold' }}>Statut du créneau *</label>
                  <select
                    value={sessionStatus}
                    onChange={(e) => setSessionStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value="open">✅ Ouvert aux réservations</option>
                    <option value="closed">🔒 Fermé aux réservations</option>
                  </select>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    {sessionStatus === 'closed' && '⚠️ Les clients ne pourront pas réserver ce créneau'}
                    {sessionStatus === 'open' && '✓ Les clients peuvent réserver ce créneau normalement'}
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontWeight: 'bold' }}>Heure de départ *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={styles.input}
                  />
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    Heure de RDV
                  </p>
                </div>
              </div>

              {selectedProductId && (
                <>
                  {/* Nom */}
                  <div className={styles.formGroup}>
                    <label style={{ fontWeight: 'bold' }}>Nom de l'activité *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className={styles.input}
                      placeholder="Ex: Canyon du Furon"
                    />
                  </div>

                  {/* Description courte */}
                  <div className={styles.formGroup}>
                    <label>Description courte</label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
                      className={styles.input}
                      placeholder="Description résumée"
                    />
                  </div>

                  {/* Description longue */}
                  <div className={styles.formGroup}>
                    <label>Description complète</label>
                    <textarea
                      value={formData.longDescription}
                      onChange={(e) => handleFieldChange('longDescription', e.target.value)}
                      className={styles.textarea}
                      rows="3"
                      placeholder="Description détaillée de l'activité"
                    />
                  </div>

                  {/* Prix et durée sur la même ligne */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 'bold' }}>Prix individuel (€) *</label>
                      <input
                        type="number"
                        value={formData.priceIndividual}
                        onChange={(e) => handleFieldChange('priceIndividual', parseFloat(e.target.value))}
                        className={styles.input}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 'bold' }}>Durée (minutes) *</label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleFieldChange('duration', parseInt(e.target.value))}
                        className={styles.input}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Niveau, région, capacité */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 'bold' }}>Niveau *</label>
                      <select
                        value={formData.level}
                        onChange={(e) => handleFieldChange('level', e.target.value)}
                        className={styles.select}
                      >
                        <option value="découverte">Découverte</option>
                        <option value="aventure">Aventure</option>
                        <option value="sportif">Sportif</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Région</label>
                      <select
                        value={formData.region}
                        onChange={(e) => handleFieldChange('region', e.target.value)}
                        className={styles.select}
                      >
                        <option value="annecy">Annecy</option>
                        <option value="grenoble">Grenoble</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 'bold' }}>Capacité max *</label>
                      <input
                        type="number"
                        value={formData.maxCapacity}
                        onChange={(e) => handleFieldChange('maxCapacity', parseInt(e.target.value))}
                        className={styles.input}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Couleur et fermeture auto */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>Couleur</label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => handleFieldChange('color', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Fermeture auto (heures avant)</label>
                      <input
                        type="number"
                        value={formData.autoCloseHoursBefore}
                        onChange={(e) => handleFieldChange('autoCloseHoursBefore', e.target.value ? parseInt(e.target.value) : '')}
                        className={styles.input}
                        min="0"
                        placeholder="Ex: 24"
                      />
                    </div>
                  </div>

                  {/* Message post-réservation */}
                  <div className={styles.formGroup}>
                    <label>Message après réservation</label>
                    <textarea
                      value={formData.postBookingMessage}
                      onChange={(e) => handleFieldChange('postBookingMessage', e.target.value)}
                      className={styles.textarea}
                      rows="2"
                      placeholder="Message affiché après la réservation"
                    />
                  </div>

                  {/* Liens */}
                  <div className={styles.formGroup}>
                    <label>Lien Waze</label>
                    <input
                      type="url"
                      value={formData.wazeLink}
                      onChange={(e) => handleFieldChange('wazeLink', e.target.value)}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Lien Google Maps</label>
                    <input
                      type="url"
                      value={formData.googleMapsLink}
                      onChange={(e) => handleFieldChange('googleMapsLink', e.target.value)}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Lien site web</label>
                    <input
                      type="url"
                      value={formData.websiteLink}
                      onChange={(e) => handleFieldChange('websiteLink', e.target.value)}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Option de renvoi d'email si réservations */}
                  {hasBookings && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      marginTop: '1rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={sendConfirmationEmail}
                          onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                        />
                        <span>
                          <strong>Renvoyer l'email de confirmation</strong> aux {confirmedBookings.length} participant(s) avec les nouvelles informations
                        </span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className={styles.bulkMoveFooter}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={loading || !selectedProductId}
            style={{ backgroundColor: 'var(--guide-primary)' }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
