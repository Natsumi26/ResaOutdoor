import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingsAPI } from '../services/api';
import BookingModal from '../components/BookingModal';
import styles from './Reservations.module.css';

const Reservations = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchYear, setSearchYear] = useState('');


  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchDate, searchClient,searchYear, bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAll();
      setBookings(response.data.bookings || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement réservations:', err);
      setError('Impossible de charger les réservations');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filtre par date
    if (searchDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = format(new Date(booking.session.date), 'yyyy-MM-dd');
        return bookingDate === searchDate;
      });
    }

    // Filtre par nom de client
    if (searchClient) {
      const search = searchClient.toLowerCase();
      filtered = filtered.filter(booking => {
        const fullName = `${booking.clientFirstName} ${booking.clientLastName}`.toLowerCase();
        return fullName.includes(search) ||
               booking.clientEmail.toLowerCase().includes(search);
      });
    }

     // Filtre par année
    if (searchYear) {
      filtered = filtered.filter(booking => {
        const year = format(new Date(booking.session.date), 'yyyy');
        return year === searchYear;
      });
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'En attente', color: '#f59e0b' },
      confirmed: { label: 'Confirmée', color: '#10b981' },
      cancelled: { label: 'Annulée', color: '#ef4444' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span
        className={styles.statusBadge}
        style={{ backgroundColor: statusInfo.color }}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentStatus = (booking) => {
    const percentage = (booking.amountPaid / booking.totalPrice) * 100;
    if (percentage >= 100) return { label: 'Payé', color: '#10b981' };
    if (percentage > 0) return { label: 'Partiel', color: '#f59e0b' };
    return { label: 'Non payé', color: '#ef4444' };
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des réservations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📋 Réservations</h1>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{bookings.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {bookings.filter(b => b.status === 'confirmed').length}
            </span>
            <span className={styles.statLabel}>Confirmées</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {bookings.filter(b => b.status === 'pending').length}
            </span>
            <span className={styles.statLabel}>En attente</span>
          </div>
        </div>
      </div>

      {/* Filtres de recherche */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>📆 Filtrer par année</label>
          <select
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            className={styles.input}
          >
            <option value="">Toutes</option>
            {[...new Set(bookings.map(b => format(new Date(b.session.date), 'yyyy')))]
              .sort()
              .map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
          </select>
          {searchYear && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearchYear('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <label>📅 Recherche par date</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className={styles.input}
          />
          {searchDate && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearchDate('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <label>👤 Recherche par client</label>
          <input
            type="text"
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            placeholder="Nom, prénom ou email..."
            className={styles.input}
          />
          {searchClient && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearchClient('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Liste des réservations */}
      <div className={styles.bookingsList}>
        {filteredBookings.length === 0 ? (
          <div className={styles.emptyState}>
            {searchDate || searchClient ?
              'Aucune réservation trouvée avec ces critères' :
              'Aucune réservation'}
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.colClient}>Client</div>
              <div className={styles.colActivity}>Activité</div>
              <div className={styles.colDate}>Date & Heure</div>
              <div className={styles.colPeople}>Pers.</div>
              <div className={styles.colPrice}>Prix</div>
              <div className={styles.colPayment}>Paiement</div>
              <div className={styles.colStatus}>Statut</div>
            </div>
            {filteredBookings.map(booking => {
              const paymentStatus = getPaymentStatus(booking);
              return (
                <div
                  key={booking.id}
                  className={styles.tableRow}
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  <div className={styles.colClient}>
                    <div className={styles.clientName}>
                      {booking.clientFirstName} {booking.clientLastName}
                    </div>
                    <div className={styles.clientEmail}>{booking.clientEmail}</div>
                  </div>
                  <div className={styles.colActivity}>
                    {booking.product?.name || 'N/A'}
                  </div>
                  <div className={styles.colDate}>
                    <div className={styles.date}>
                      {format(new Date(booking.session.date), 'dd MMM yyyy', { locale: fr })}
                    </div>
                    <div className={styles.time}>
                      {booking.session.timeSlot} - {booking.session.startTime}
                    </div>
                  </div>
                  <div className={styles.colPeople}>
                    {booking.numberOfPeople}
                  </div>
                  <div className={styles.colPrice}>
                    {booking.totalPrice}€
                  </div>
                  <div className={styles.colPayment}>
                    <span
                      className={styles.paymentBadge}
                      style={{ backgroundColor: paymentStatus.color }}
                    >
                      {paymentStatus.label}
                    </span>
                    <div className={styles.paymentAmount}>
                      {booking.amountPaid}€ / {booking.totalPrice}€
                    </div>
                  </div>
                  <div className={styles.colStatus}>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedBookingId && (
        <BookingModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onUpdate={loadBookings}
        />
      )}
    </div>
  );
};

export default Reservations;
