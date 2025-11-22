import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import WeeklyCalendar from '../components/WeeklyCalendar';
import BookingModal from '../components/BookingModal';
import SessionDetailModal from '../components/SessionDetailModal';
import SessionForm from '../components/SessionForm';
import BookingForm from '../components/BookingForm';
import SessionDuplicateDialog from '../components/SessionDuplicateDialog';
import SessionDeleteDialog from '../components/SessionDeleteDialog';
import ConfirmDuplicateModal from '../components/ConfirmDuplicateModal';
import { sessionsAPI, bookingsAPI, productsAPI, usersAPI, authAPI, settingsAPI, emailAPI } from '../services/api';
import styles from './Calendar.module.css';


const Calendar = () => {
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [bookingSessionId, setBookingSessionId] = useState(null);
  const [sessionFormDate, setSessionFormDate] = useState(null);
  const [selectedGuideFilter, setSelectedGuideFilter] = useState(''); // Filtre par guide
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false); // Menu Session
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false); // Dialog de duplication
  const [sessionToDuplicate, setSessionToDuplicate] = useState(null); // Session à dupliquer
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // Dialog de suppression
  const [showConfirmDuplicate, setShowConfirmDuplicate] = useState(false); // Modal de confirmation de duplication
  const [selectedSessionId, setSelectedSessionId] = useState(null); // Session sélectionnée pour le modal de détail
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false); // Modal de confirmation d'email après déplacement
  const [movedBookingId, setMovedBookingId] = useState(null); // ID de la réservation déplacée

  // Charger les couleurs du thème depuis les settings et mettre à jour les CSS variables
  useEffect(() => {
    const loadThemeColors = async () => {
      try {
        const response = await settingsAPI.get();
        const settings = response.data.settings;
        if (settings?.primaryColor) {
          const primaryColor = settings.primaryColor;
          const secondaryColor = settings.secondaryColor || settings.primaryColor;

          // Mettre à jour les CSS variables
          document.documentElement.style.setProperty('--guide-primary', primaryColor);
          document.documentElement.style.setProperty('--guide-secondary', secondaryColor);

          // Extraire les composants RGB
          const extractRGB = (hex) => {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            return `${r}, ${g}, ${b}`;
          };
          document.documentElement.style.setProperty('--guide-primary-rgb', extractRGB(primaryColor));
          document.documentElement.style.setProperty('--guide-secondary-rgb', extractRGB(secondaryColor));

          // Sauvegarder dans localStorage
          localStorage.setItem('guidePrimaryColor', primaryColor);
          localStorage.setItem('guideSecondaryColor', secondaryColor);
        }
      } catch (error) {
        console.error('Erreur chargement couleurs thème:', error);
      }
    };
    loadThemeColors();
  }, []);

  // Charger les sessions de la semaine
  const loadSessions = async (baseDate= new Date()) => {
    try {
      setLoading(true);
        const start = baseDate;
        const end = addDays(baseDate, 7);
      const params = {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      };

      // Si un filtre guide est sélectionné, l'ajouter
      if (selectedGuideFilter) {
        params.guideId = selectedGuideFilter;
      }

      const response = await sessionsAPI.getAll(params);

      setSessions(response.data.sessions || []);
      setError(null);
      console.log('Sessions chargées :', response.data.sessions);

    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      setError('Impossible de charger les sessions');
    } finally {
      setLoading(false);
    }
  };

  // Charger l'utilisateur au montage
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Charger les données quand la semaine ou le filtre change
  useEffect(() => {
    if (currentUser) {
      loadSessions(currentWeek);
      loadProducts();
      loadGuides();
    }
  }, [currentWeek, selectedGuideFilter, currentUser]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    }
  };
  console.log(currentUser)
  const loadGuides = async () => {
    // Charger les guides uniquement si admin
    if (currentUser?.role === 'leader'|| currentUser?.role === 'super_admin' ) {
      try {
        const response = await usersAPI.getAll();
        let allGuides = response.data.users;

        if (currentUser.teamName !== null){
          let guideTeam = allGuides.filter(g => g.teamName === currentUser.teamName);
        setGuides(guideTeam);
        } else {
          setGuides(currentUser)
        }
        
      } catch (err) {
        console.error('Erreur chargement guides:', err);
      }
    }
  };
        console.log(guides)
  const loadCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Erreur chargement utilisateur:', err);
    }
  };
  //Gerer les changement de semaine
  const handleWeekChange = (newDate) => {
  setCurrentWeek(newDate); // newDate est un objet Date
};

  // Gérer le déplacement d'une réservation
  const handleMoveBooking = async (bookingId, newSessionId, selectedProductId = null) => {
    try {
      const response = await bookingsAPI.move(bookingId, {
        newSessionId,
        selectedProductId
      });

      // Si le backend demande une sélection de produit
      if (response.data.needsProductSelection) {
        const availableProducts = response.data.availableProducts;

        // Créer une liste des produits pour l'utilisateur
        const productList = availableProducts
          .map((p, i) => `${i + 1}. ${p.name} (${p.price}€)`)
          .join('\n');

        const choice = prompt(
          `Plusieurs produits disponibles. Choisissez un numéro :\n\n${productList}`
        );

        if (choice) {
          const index = parseInt(choice) - 1;
          if (index >= 0 && index < availableProducts.length) {
            const selectedProduct = availableProducts[index];
            // Relancer le déplacement avec le produit sélectionné
            await handleMoveBooking(bookingId, newSessionId, selectedProduct.id);
            return;
          }
        }

        alert('Déplacement annulé : aucun produit sélectionné');
        return;
      }

      // Déplacement réussi - Afficher le modal de confirmation d'envoi d'email
      setMovedBookingId(bookingId);
      setShowEmailConfirmation(true);
      loadSessions();
    } catch (err) {
      console.error('Erreur déplacement réservation:', err);
      alert('Impossible de déplacer la réservation: ' + (err.response?.data?.message || err.message));
    }
  };

  // Gérer l'envoi d'email de confirmation après déplacement
  const handleSendEmailAfterMove = async () => {
    try {
      await emailAPI.sendBookingConfirmation(movedBookingId);
      alert('Email de confirmation envoyé avec succès !');
      setShowEmailConfirmation(false);
      setMovedBookingId(null);
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSkipEmailAfterMove = () => {
    setShowEmailConfirmation(false);
    setMovedBookingId(null);
  };

  // Gérer le clic sur une session (ouvrir le modal de détail)
  const handleSessionClick = (session) => {
    setSelectedSessionId(session.id);
  };

  // Gérer l'édition depuis le modal de détail
  const handleEditFromDetail = (session) => {
    setSelectedSessionId(null);
    setEditingSession(session);
    setShowSessionForm(true);
  };

  // Créer une réservation sur une session
  const handleCreateBooking = (session) => {
    setBookingSessionId(session.id);
    setShowBookingForm(true);
  };

  // Gérer le clic sur une réservation
  const handleBookingClick = (bookingId) => {
    setSelectedBookingId(bookingId);
  };

  // Fermer la modale et recharger les données
  const handleCloseModal = () => {
    setSelectedBookingId(null);
  };

  const handleBookingUpdate = () => {
    loadSessions(); // Recharger pour voir les changements
  };

  const handleNewSession = (date = null) => {
    setEditingSession(null);
    setSessionFormDate(date);
    setShowSessionForm(true);
  };

  const handleSessionSubmit = async (data) => {
    try {
      let createdSession;
      if (editingSession) {
        await sessionsAPI.update(editingSession.id, data);
      } else {
        const response = await sessionsAPI.create(data);
        createdSession = response.data.session;
      }
      await loadSessions();
      setShowSessionForm(false);
      setEditingSession(null);
      setSessionFormDate(null);

      // Proposer la duplication après création
      if (createdSession) {
        setSessionToDuplicate(createdSession);
        setShowConfirmDuplicate(true);
      }
    } catch (err) {
      console.error('Erreur sauvegarde session:', err);
      alert('Erreur lors de la sauvegarde: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSessionCancel = () => {
    setShowSessionForm(false);
    setEditingSession(null);
    setSessionFormDate(null);
  };

  const handleDeleteSessions = () => {
    setSessionMenuOpen(false);
    setShowDeleteDialog(true);
  };

  const handleConfirmDuplicateYes = () => {
    setShowConfirmDuplicate(false);
    setShowDuplicateDialog(true);
  };

  const handleConfirmDuplicateNo = () => {
    setShowConfirmDuplicate(false);
    setSessionToDuplicate(null);
  };

  const handleDuplicateConfirm = async (selectedDates) => {
    if (!sessionToDuplicate || selectedDates.length === 0) return;

    try {
      // Dupliquer la session sur chaque date sélectionnée
      for (const date of selectedDates) {
        console.log('Duplication sur :', date);

        const sessionData = {
          date: new Date(date).toISOString(),
          timeSlot: sessionToDuplicate.timeSlot,
          startTime: sessionToDuplicate.startTime,
          isMagicRotation: sessionToDuplicate.isMagicRotation,
          status: sessionToDuplicate.status,
          productIds: sessionToDuplicate.products.map(sp => sp.productId),
          guideId: sessionToDuplicate.guideId,
          shoeRentalAvailable: sessionToDuplicate.shoeRentalAvailable,
          shoeRentalPrice: sessionToDuplicate.shoeRentalPrice
        };
        await sessionsAPI.create(sessionData);
      }

      await loadSessions();
      setShowDuplicateDialog(false);
      setSessionToDuplicate(null);
      alert(`Session dupliquée sur ${selectedDates.length} jour(s) avec succès !`);
    } catch (err) {
      console.error('Erreur duplication session:', err);
      alert('Erreur lors de la duplication: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteConfirm = async (selectedSessions) => {
    if (selectedSessions.length === 0) return;

    try {
      let deletedCount = 0;
      let movedCount = 0;

      for (const session of selectedSessions) {
        // Si la session a une action spécifiée (delete ou move)
        if (session.action === 'delete') {
          // Supprimer avec les réservations
          await sessionsAPI.delete(session.id, { action: 'delete' });
          deletedCount++;
        } else if (session.action === 'move') {
          // Déplacer les réservations vers la session cible
          await sessionsAPI.delete(session.id, {
            action: 'move',
            targetSessionId: session.targetSessionId
          });
          movedCount++;
        } else {
          // Session sans réservation - suppression simple
          await sessionsAPI.delete(session.id);
          deletedCount++;
        }
      }

      await loadSessions();
      setShowDeleteDialog(false);

      // Message de succès personnalisé
      let message = '';
      if (deletedCount > 0 && movedCount > 0) {
        message = `${deletedCount} session(s) supprimée(s) et ${movedCount} session(s) supprimée(s) avec réservations déplacées !`;
      } else if (deletedCount > 0) {
        message = `${deletedCount} session(s) supprimée(s) avec succès !`;
      } else if (movedCount > 0) {
        message = `${movedCount} session(s) supprimée(s) avec réservations déplacées !`;
      }

      if (message) {
        alert(message);
      }
    } catch (err) {
      console.error('Erreur suppression sessions:', err);
      alert('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBookingSubmit = async (data) => {
    try {
      await bookingsAPI.create(data);
      await loadSessions();
      setShowBookingForm(false);
      setBookingSessionId(null);
    } catch (err) {
      console.error('Erreur création réservation:', err);
      alert('Erreur lors de la création: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBookingCancel = () => {
    setShowBookingForm(false);
    setBookingSessionId(null);
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      console.log('Session supprimée:', sessionId);
      // La session a déjà été supprimée par le modal, on recharge juste les sessions
      await loadSessions();
    } catch (err) {
      console.error('Erreur lors du rechargement des sessions:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.calendarContainer}>
          <p className={styles.placeholder}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.calendarContainer}>
          <p className={styles.placeholder} style={{ color: '#ef4444' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Filtre par guide (admin uniquement) */}
          {((currentUser?.role === 'leader' && currentUser?.teamName !== null)||(currentUser?.role === 'super_admin'&& currentUser?.teamName !== null)) && !showSessionForm && !showBookingForm && (
            <div className={styles.guideFilter}>
              <label>Filtrer par guide :</label>
              <select
                value={selectedGuideFilter}
                onChange={(e) => setSelectedGuideFilter(e.target.value)}
                className={styles.guideSelect}
              >
                <option value="">Tous les guides</option>
                {guides.map(guide => (
                  <option key={guide.id} value={guide.id}>
                    {guide.login}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {currentUser.role !== 'trainee' && !showSessionForm && !showBookingForm && (
          <div className={styles.sessionMenuContainer}>
            <button
              className={styles.btnPrimary}
              onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
              style={{ background: 'linear-gradient(135deg, var(--guide-primary) 0%, var(--guide-secondary) 100%)' }}
            >
              Session ▾
            </button>
            {sessionMenuOpen && (
              <div className={styles.sessionDropdown}>
                
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleNewSession();
                    setSessionMenuOpen(false);
                  }}
                >
                  ➕ Nouvelle session
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={handleDeleteSessions}
                >
                  🗑️ Supprimer sessions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showSessionForm ? (
        <div className={styles.formWrapper}>
          <SessionForm
            session={editingSession}
            products={products}
            guides={guides}
            currentUser={currentUser}
            initialDate={sessionFormDate}
            onSubmit={handleSessionSubmit}
            onCancel={handleSessionCancel}
          />
        </div>
      ) : showBookingForm ? (
        <div className={styles.formWrapper}>
          <BookingForm
            session={sessions.find(s => s.id === bookingSessionId)}
            onSubmit={handleBookingSubmit}
            onCancel={handleBookingCancel}
          />
        </div>
      ) : (
        <WeeklyCalendar
          sessions={sessions}
          selectedDate={currentWeek}
          currentUser={currentUser}
          onWeekChange={handleWeekChange}
          onMoveBooking={handleMoveBooking}
          onSessionClick={handleSessionClick}
          onBookingClick={handleBookingClick}
          onCreateBooking={handleCreateBooking}
          onCreateSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Modale de détails de réservation */}
      {selectedBookingId && (
        <BookingModal
          bookingId={selectedBookingId}
          onClose={handleCloseModal}
          onUpdate={handleBookingUpdate}
        />
      )}

      {/* Modal de détails de session */}
      {selectedSessionId && (
        <SessionDetailModal
          session={sessions.find(s => s.id === selectedSessionId)}
          onClose={() => setSelectedSessionId(null)}
          onEdit={handleEditFromDetail}
          onBookingClick={handleBookingClick}
          onDuplicate={(session) => {
            setSelectedSessionId(null);
            setSessionToDuplicate(session);
            setShowDuplicateDialog(true);
          }}
          onDelete={handleDeleteSession}
          onUpdate={loadSessions}
        />
      )}

      {/* Dialogue de duplication de session */}
      {showDuplicateDialog && sessionToDuplicate && (
        <SessionDuplicateDialog
          session={sessionToDuplicate}
          onConfirm={handleDuplicateConfirm}
          onCancel={() => {
            setShowDuplicateDialog(false);
            setSessionToDuplicate(null);
          }}
        />
      )}

      {/* Dialogue de suppression de sessions */}
      {showDeleteDialog && (
        <SessionDeleteDialog
          sessions={sessions}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Modal de confirmation de duplication */}
      {showConfirmDuplicate && (
        <ConfirmDuplicateModal
          onConfirm={handleConfirmDuplicateYes}
          onCancel={handleConfirmDuplicateNo}
        />
      )}

      {/* Modal de confirmation d'envoi d'email après déplacement */}
      {showEmailConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, var(--guide-primary) 0%, var(--guide-secondary) 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px 12px 0 0'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>✅ Réservation déplacée</h2>
            </div>

            <div style={{ padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                La réservation a été déplacée avec succès vers la nouvelle session.
              </p>
              <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                <strong>Souhaitez-vous envoyer un email de confirmation avec les nouvelles informations au client ?</strong>
              </p>
              <div style={{
                background: '#fff3cd',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #ffc107'
              }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#856404' }}>
                  ⚠️ L'ancien email de confirmation envoyé au client contenait les anciennes informations (date, horaire, activité).
                  Il est recommandé d'envoyer un nouvel email avec les informations mises à jour.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleSkipEmailAfterMove}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Plus tard
              </button>
              <button
                onClick={handleSendEmailAfterMove}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, var(--guide-primary) 0%, var(--guide-secondary) 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                📧 Envoyer l'email de confirmation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
