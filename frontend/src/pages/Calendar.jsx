import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import WeeklyCalendar from '../components/WeeklyCalendar';
import BookingModal from '../components/BookingModal';
import SessionForm from '../components/SessionForm';
import BookingForm from '../components/BookingForm';
import SessionDuplicateDialog from '../components/SessionDuplicateDialog';
import SessionDeleteDialog from '../components/SessionDeleteDialog';
import ConfirmDuplicateModal from '../components/ConfirmDuplicateModal';
import { sessionsAPI, bookingsAPI, productsAPI, usersAPI, authAPI } from '../services/api';
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

  // Charger les sessions de la semaine
  const loadSessions = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const params = {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd')
      };

      // Si un filtre guide est sélectionné, l'ajouter
      if (selectedGuideFilter) {
        params.guideId = selectedGuideFilter;
      }

      const response = await sessionsAPI.getAll(params);

      setSessions(response.data.sessions || []);
      setError(null);
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
      loadSessions();
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

  const loadGuides = async () => {
    // Charger les guides uniquement si admin
    if (currentUser?.role === 'admin') {
      try {
        const response = await usersAPI.getAll();
        setGuides(response.data.users || []);
      } catch (err) {
        console.error('Erreur chargement guides:', err);
      }
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Erreur chargement utilisateur:', err);
    }
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

      // Déplacement réussi, recharger les sessions
      loadSessions();
    } catch (err) {
      console.error('Erreur déplacement réservation:', err);
      alert('Impossible de déplacer la réservation: ' + (err.response?.data?.message || err.message));
    }
  };

  // Gérer le clic sur une session (modifier)
  const handleSessionClick = (session) => {
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
        const sessionData = {
          date: new Date(date).toISOString(),
          timeSlot: sessionToDuplicate.timeSlot,
          startTime: sessionToDuplicate.startTime,
          isMagicRotation: sessionToDuplicate.isMagicRotation,
          status: sessionToDuplicate.status,
          productIds: sessionToDuplicate.products.map(sp => sp.productId),
          guideId: sessionToDuplicate.guideId
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

    // Vérifier si des sessions ont des réservations
    const sessionsWithBookings = selectedSessions.filter(s => s.bookings && s.bookings.length > 0);

    if (sessionsWithBookings.length > 0) {
      alert(`Impossible de supprimer ${sessionsWithBookings.length} session(s) car elles contiennent des réservations.`);
      return;
    }

    if (!window.confirm(`Supprimer ${selectedSessions.length} session(s) ?`)) return;

    try {
      for (const session of selectedSessions) {
        await sessionsAPI.delete(session.id);
      }

      await loadSessions();
      setShowDeleteDialog(false);
      alert(`${selectedSessions.length} session(s) supprimée(s) avec succès !`);
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
      await sessionsAPI.delete(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('Erreur suppression session:', err);
      alert('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📅 Calendrier Hebdomadaire</h1>
        </div>
        <div className={styles.calendarContainer}>
          <p className={styles.placeholder}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📅 Calendrier Hebdomadaire</h1>
        </div>
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
          <h1>📅 Calendrier Hebdomadaire</h1>

          {/* Filtre par guide (admin uniquement) */}
          {currentUser?.role === 'admin' && !showSessionForm && !showBookingForm && (
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

        {!showSessionForm && !showBookingForm && (
          <div className={styles.sessionMenuContainer}>
            <button
              className={styles.btnPrimary}
              onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
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
    </div>
  );
};

export default Calendar;
