import { useState, useEffect } from 'react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingsAPI, resellersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Statistics.module.css';

const Statistics = () => {
  const [bookings, setBookings] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReseller, setSelectedReseller] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('confirmed'); // 'all', 'confirmed', 'pending'
  const { user, isSuperAdmin, isLeader } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, resellersRes] = await Promise.all([
        bookingsAPI.getAll(),
        resellersAPI.getAll()
      ]);

      let allBookings = bookingsRes.data.bookings;

      // Filtrer selon les permissions
      let visibleBookings = [];
      if (isSuperAdmin || isLeader) {
        visibleBookings = allBookings.filter(b => b.session.guide.teamName === user.teamName);
      } else {
        visibleBookings = allBookings.filter(b => b.session.guideId === user.id);
      }

      setBookings(visibleBookings);
      setResellers(resellersRes.data.resellers);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];

    // Filtre par statut
    if (statusFilter === 'confirmed') {
      filtered = filtered.filter(b => b.status === 'confirmed');
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(b => b.status === 'pending');
    }
    // 'all' ne filtre pas

    // Filtre par revendeur
    if (selectedReseller) {
      filtered = filtered.filter(b => b.resellerId === selectedReseller);
    }

    // Filtre par date
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
        break;
      default: // 'all'
        return filtered;
    }

    if (startDate || endDate) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.session.date);
        if (startDate && bookingDate < startDate) return false;
        if (endDate && bookingDate > endDate) return false;
        return true;
      });
    }

    return filtered;
  };

  const calculateStats = () => {
    const filtered = getFilteredBookings();

    const totalRevenue = filtered.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalPaid = filtered.reduce((sum, b) => sum + b.amountPaid, 0);
    const totalBookings = filtered.length;
    const totalPeople = filtered.reduce((sum, b) => sum + b.numberOfPeople, 0);

    let commissionTotal = 0;
    let revenueAfterCommission = totalRevenue;

    if (selectedReseller) {
      const reseller = resellers.find(r => r.id === selectedReseller);
      if (reseller && reseller.commission) {
        commissionTotal = (totalRevenue * reseller.commission) / 100;
        revenueAfterCommission = totalRevenue - commissionTotal;
      }
    }

    return {
      totalRevenue,
      totalPaid,
      totalBookings,
      totalPeople,
      commissionTotal,
      revenueAfterCommission,
      remaining: totalRevenue - totalPaid
    };
  };

  const stats = calculateStats();
  const selectedResellerData = resellers.find(r => r.id === selectedReseller);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Statistiques</h1>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Période</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={styles.select}
          >
            <option value="all">Toutes les périodes</option>
            <option value="year">Cette année</option>
            <option value="month">Ce mois</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <>
            <div className={styles.filterGroup}>
              <label>Du</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Au</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </>
        )}

        <div className={styles.filterGroup}>
          <label>Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmed">Confirmées uniquement</option>
            <option value="pending">En attente uniquement</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Revendeur</label>
          <select
            value={selectedReseller}
            onChange={(e) => setSelectedReseller(e.target.value)}
            className={styles.select}
          >
            <option value="">Tous les revendeurs</option>
            {resellers.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} {r.commission ? `(${r.commission}%)` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Chiffre d'Affaires</div>
            <div className={styles.statValue}>{stats.totalRevenue.toFixed(2)}€</div>
            <div className={styles.statSubtext}>
              {stats.totalBookings} réservation{stats.totalBookings > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Montant Encaissé</div>
            <div className={styles.statValue}>{stats.totalPaid.toFixed(2)}€</div>
            <div className={styles.statSubtext}>
              {((stats.totalPaid / stats.totalRevenue) * 100 || 0).toFixed(1)}% du CA
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Reste à Encaisser</div>
            <div className={styles.statValue}>{stats.remaining.toFixed(2)}€</div>
            <div className={styles.statSubtext}>
              {((stats.remaining / stats.totalRevenue) * 100 || 0).toFixed(1)}% du CA
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Participants</div>
            <div className={styles.statValue}>{stats.totalPeople}</div>
            <div className={styles.statSubtext}>
              {stats.totalBookings > 0 ? (stats.totalPeople / stats.totalBookings).toFixed(1) : 0} pers./résa
            </div>
          </div>
        </div>
      </div>

      {/* Section Commissions Revendeur */}
      {selectedReseller && selectedResellerData && (
        <div className={styles.commissionSection}>
          <h2>💼 Commission Revendeur : {selectedResellerData.name}</h2>
          <div className={styles.commissionGrid}>
            <div className={styles.commissionCard}>
              <div className={styles.commissionLabel}>Taux de commission</div>
              <div className={styles.commissionValue}>
                {selectedResellerData.commission || 0}%
              </div>
            </div>

            <div className={styles.commissionCard}>
              <div className={styles.commissionLabel}>Montant de commission</div>
              <div className={styles.commissionValue}>
                {stats.commissionTotal.toFixed(2)}€
              </div>
            </div>

            <div className={styles.commissionCard}>
              <div className={styles.commissionLabel}>CA après commission</div>
              <div className={styles.commissionValue}>
                {stats.revenueAfterCommission.toFixed(2)}€
              </div>
            </div>

            <div className={styles.commissionCard}>
              <div className={styles.commissionLabel}>Réservations via ce revendeur</div>
              <div className={styles.commissionValue}>
                {stats.totalBookings}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des réservations */}
      <div className={styles.bookingsSection}>
        <h2>📋 Détail des Réservations</h2>
        <div className={styles.bookingsTable}>
          <div className={styles.tableHeader}>
            <div className={styles.colDate}>Date</div>
            <div className={styles.colClient}>Client</div>
            <div className={styles.colActivity}>Activité</div>
            <div className={styles.colPeople}>Pers.</div>
            <div className={styles.colPrice}>Prix Total</div>
            <div className={styles.colPaid}>Encaissé</div>
            <div className={styles.colStatus}>Statut</div>
            {selectedReseller && <div className={styles.colCommission}>Commission</div>}
          </div>
          {getFilteredBookings().length === 0 ? (
            <div className={styles.emptyState}>
              Aucune réservation trouvée avec ces critères
            </div>
          ) : (
            getFilteredBookings().map(booking => {
              const commission = selectedResellerData?.commission
                ? (booking.totalPrice * selectedResellerData.commission) / 100
                : 0;

              return (
                <div key={booking.id} className={styles.tableRow}>
                  <div className={styles.colDate}>
                    {format(new Date(booking.session.date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                  <div className={styles.colClient}>
                    {booking.clientFirstName} {booking.clientLastName}
                  </div>
                  <div className={styles.colActivity}>
                    {booking.product?.name || 'N/A'}
                  </div>
                  <div className={styles.colPeople}>
                    {booking.numberOfPeople}
                  </div>
                  <div className={styles.colPrice}>
                    {booking.totalPrice.toFixed(2)}€
                  </div>
                  <div className={styles.colPaid}>
                    {booking.amountPaid.toFixed(2)}€
                  </div>
                  <div className={styles.colStatus}>
                    <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
                      {booking.status === 'confirmed' ? 'Confirmée' :
                       booking.status === 'pending' ? 'En attente' : 'Annulée'}
                    </span>
                  </div>
                  {selectedReseller && (
                    <div className={styles.colCommission}>
                      {commission.toFixed(2)}€
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
