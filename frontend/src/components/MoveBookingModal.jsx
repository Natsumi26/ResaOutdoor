import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { sessionsAPI, bookingsAPI } from '../services/api';
import styles from './MoveBookingModal.module.css';

const MoveBookingModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [needsProductSelection, setNeedsProductSelection] = useState(false);

  useEffect(() => {
    loadAvailableSessions();
  }, []);

  const loadAvailableSessions = async () => {
    try {
      setLoading(true);
      // Récupérer toutes les sessions futures
      const response = await sessionsAPI.getAll();

      // Filtrer pour exclure la session actuelle et ne garder que les sessions futures
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureSessions = response.data.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return session.id !== booking.sessionId && sessionDate >= today;
      });

      setAvailableSessions(futureSessions);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      alert('Impossible de charger les sessions disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setSelectedProductId('');
    setNeedsProductSelection(false);

    if (!sessionId) {
      setSelectedSession(null);
      setAvailableProducts([]);
      return;
    }

    // Trouver la session sélectionnée
    const session = availableSessions.find(s => s.id === sessionId);
    setSelectedSession(session);

    // Charger les produits disponibles pour cette session
    if (session && session.products) {
      setAvailableProducts(session.products.map(sp => ({
        id: sp.product.id,
        name: sp.product.name,
        price: sp.product.priceIndividual
      })));

      // Si un seul produit, le sélectionner automatiquement
      if (session.products.length === 1) {
        setSelectedProductId(session.products[0].product.id);
      }
    }
  };

  const handleMove = async () => {
    if (!selectedSessionId) {
      alert('Veuillez sélectionner une session');
      return;
    }

    try {
      setLoading(true);

      // Appeler l'API de déplacement
      const response = await bookingsAPI.move(booking.id, {
        newSessionId: selectedSessionId,
        selectedProductId: selectedProductId || null
      });

      // Si l'API demande une sélection de produit
      if (response.data.needsProductSelection) {
        setNeedsProductSelection(true);
        setAvailableProducts(response.data.availableProducts);
        setLoading(false);
        return;
      }

      // Succès
      alert('Réservation déplacée avec succès !');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur déplacement réservation:', error);
      alert('Impossible de déplacer la réservation: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Déplacer la réservation</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Info réservation actuelle */}
          <div className={styles.currentBooking}>
            <h3>Réservation actuelle</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Client:</span>
                <span className={styles.value}>{booking.clientFirstName} {booking.clientLastName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Produit:</span>
                <span className={styles.value}>{booking.product?.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Date:</span>
                <span className={styles.value}>
                  {format(new Date(booking.session.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Horaire:</span>
                <span className={styles.value}>{booking.session.startTime}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Participants:</span>
                <span className={styles.value}>{booking.numberOfPeople} personne(s)</span>
              </div>
            </div>
          </div>

          {/* Sélection nouvelle session */}
          <div className={styles.newSession}>
            <h3>Nouvelle session</h3>

            {loading && <div className={styles.loading}>Chargement...</div>}

            {!loading && availableSessions.length === 0 && (
              <div className={styles.emptyState}>Aucune session future disponible</div>
            )}

            {!loading && availableSessions.length > 0 && (
              <>
                <div className={styles.formGroup}>
                  <label>Sélectionner la session</label>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => handleSessionChange(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">-- Choisir une session --</option>
                    {availableSessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {format(new Date(session.date), 'EEEE dd/MM/yyyy', { locale: fr })} - {session.startTime}
                        {session.guide && ` - Guide: ${session.guide.login}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection produit si nécessaire */}
                {(needsProductSelection || (selectedSession && availableProducts.length > 1)) && (
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
                    {needsProductSelection && (
                      <p className={styles.warning}>
                        ⚠️ Cette session vide nécessite la sélection d'un produit.
                      </p>
                    )}
                  </div>
                )}

                {/* Info sur le produit sélectionné */}
                {selectedSession && selectedProductId && (
                  <div className={styles.priceInfo}>
                    <p>
                      Le prix sera recalculé en fonction du produit sélectionné
                      {availableProducts.find(p => p.id === selectedProductId) && (
                        <> : <strong>
                          {availableProducts.find(p => p.id === selectedProductId).price * booking.numberOfPeople}€
                        </strong> ({availableProducts.find(p => p.id === selectedProductId).price}€ × {booking.numberOfPeople} personne(s))
                        </>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className={styles.btnConfirm}
            onClick={handleMove}
            disabled={loading || !selectedSessionId || (needsProductSelection && !selectedProductId)}
          >
            {loading ? 'Déplacement...' : 'Déplacer la réservation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveBookingModal;
