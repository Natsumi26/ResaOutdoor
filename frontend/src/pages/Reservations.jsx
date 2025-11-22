import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingsAPI, settingsAPI } from '../services/api';
import BookingModal from '../components/BookingModal';
import styles from './Reservations.module.css';
import { useAuth } from '../context/AuthContext';

const Reservations = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [groupedClients, setGroupedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const { user, isSuperAdmin, isLeader } = useAuth();


  useEffect(() => {
    loadBookings();
    loadThemeColor();
  }, []);

  const loadThemeColor = async () => {
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
      console.error('Erreur chargement couleur thème:', error);
    }
  };

  useEffect(() => {
    filterBookings();
  }, [searchDate, searchClient,searchYear, bookings]);

  useEffect(() => {
    groupBookingsByClient();
  }, [filteredBookings]);
console.log(user) 
  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAll();
      let allBookings = response.data.bookings;

      let visibleBookings = [];
      if (isSuperAdmin||isLeader) {
        visibleBookings = allBookings.filter(b => b.session.guide.teamName === user.teamName);
      } else {
        visibleBookings = allBookings.filter(b => b.session.guideId === user.id)
      }

      setBookings(visibleBookings);  
      console.log(visibleBookings)    
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

  const groupBookingsByClient = () => {
    const clientMap = new Map();

    filteredBookings.forEach(booking => {
      const clientKey = booking.clientEmail;

      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, {
          clientFirstName: booking.clientFirstName,
          clientLastName: booking.clientLastName,
          clientEmail: booking.clientEmail,
          bookings: [],
          totalActivities: 0,
          totalAmount: 0,
          totalPaid: 0
        });
      }

      const client = clientMap.get(clientKey);
      client.bookings.push(booking);
      client.totalActivities += 1;
      client.totalAmount += booking.totalPrice;
      client.totalPaid += booking.amountPaid;
    });

    const grouped = Array.from(clientMap.values());
    setGroupedClients(grouped);
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
            <span className={styles.statValue} style={{ color: 'var(--guide-primary)' }}>{groupedClients.length}</span>
            <span className={styles.statLabel}>Clients</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: 'var(--guide-primary)' }}>
              {bookings.length}
            </span>
            <span className={styles.statLabel}>Réservations</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: 'var(--guide-primary)' }}>
              {bookings.filter(b => b.status === 'confirmed').length}
            </span>
            <span className={styles.statLabel}>Confirmées</span>
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

      {/* Liste des clients */}
      <div className={styles.bookingsList}>
        {groupedClients.length === 0 ? (
          <div className={styles.emptyState}>
            {searchDate || searchClient || searchYear ?
              'Aucune réservation trouvée avec ces critères' :
              'Aucune réservation'}
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.colClientName}>Client</div>
              <div className={styles.colEmail}>Email</div>
              <div className={styles.colActivities}>Activités</div>
              <div className={styles.colPaymentSummary}>Paiement</div>
            </div>
            {groupedClients.map(client => {
              const isExpanded = expandedClient === client.clientEmail;
              const paymentPercentage = (client.totalPaid / client.totalAmount) * 100;
              let paymentColor = '#ef4444';
              if (paymentPercentage >= 100) paymentColor = '#10b981';
              else if (paymentPercentage > 0) paymentColor = '#f59e0b';

              return (
                <div key={client.clientEmail}>
                  <div
                    className={styles.clientRow}
                    onClick={() => setExpandedClient(isExpanded ? null : client.clientEmail)}
                  >
                    <div className={styles.colClientName}>
                      <div className={styles.clientName}>
                        {client.clientFirstName} {client.clientLastName}
                      </div>
                    </div>
                    <div className={styles.colEmail}>
                      {client.clientEmail}
                    </div>
                    <div className={styles.colActivities}>
                      <span className={styles.activityBadge} style={{ backgroundColor: 'var(--guide-primary)' }}>
                        {client.totalActivities}
                      </span>
                    </div>
                    <div className={styles.colPaymentSummary}>
                      <div className={styles.paymentInfo}>
                        <span
                          className={styles.paymentBadge}
                          style={{ backgroundColor: paymentColor }}
                        >
                          {client.totalPaid}€ / {client.totalAmount}€
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.expandedBookings}>
                      {client.bookings.map(booking => {
                        const paymentStatus = getPaymentStatus(booking);
                        return (
                          <div
                            key={booking.id}
                            className={styles.bookingRow}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingId(booking.id);
                            }}
                          >
                            <div className={styles.bookingActivity}>
                              <strong>{booking.product?.name || 'N/A'}</strong>
                            </div>
                            <div className={styles.bookingDate}>
                              {format(new Date(booking.session.date), 'dd MMM yyyy', { locale: fr })}
                              {' - '}
                              {booking.session.timeSlot} ({booking.session.startTime})
                            </div>
                            <div className={styles.bookingPeople}>
                              {booking.numberOfPeople} pers.
                            </div>
                            <div className={styles.bookingPayment}>
                              <span
                                className={styles.paymentBadge}
                                style={{ backgroundColor: paymentStatus.color }}
                              >
                                {paymentStatus.label}
                              </span>
                              <span className={styles.bookingPrice}>
                                {booking.amountPaid}€ / {booking.totalPrice}€
                              </span>
                            </div>
                            <div className={styles.bookingStatus}>
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
