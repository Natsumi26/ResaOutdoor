import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { statsAPI } from '../services/api';
import styles from './Stats.module.css';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadStats();
    loadDailyStats();
    loadRecentBookings();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getGlobalStats(dateRange);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await statsAPI.getDailyStats();
      setDailyStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement stats du jour:', error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const response = await statsAPI.getRecentBookings({ limit: 5 });
      setRecentBookings(response.data.bookings);
    } catch (error) {
      console.error('Erreur chargement réservations récentes:', error);
    }
  };

  if (loading || !stats) {
    return (
      <div className={styles.container}>
        <h1>📊 Tableau de bord</h1>
        <div className={styles.loading}>Chargement des statistiques...</div>
      </div>
    );
  }

  // Préparer les données pour le graphique des revenus par jour
  const revenueChartData = {
    labels: Object.keys(stats.revenueByDay || {}).map(date =>
      format(new Date(date), 'dd/MM', { locale: fr })
    ),
    datasets: [
      {
        label: 'Revenus (€)',
        data: Object.values(stats.revenueByDay || {}),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Préparer les données pour le graphique des réservations par produit
  const productChartData = {
    labels: Object.keys(stats.bookingsByProduct || {}),
    datasets: [
      {
        label: 'Réservations',
        data: Object.values(stats.bookingsByProduct || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ]
      }
    ]
  };

  // Préparer les données pour le graphique des statuts
  const statusChartData = {
    labels: ['Confirmées', 'En attente', 'Annulées'],
    datasets: [
      {
        data: [
          stats.bookingsByStatus?.confirmed || 0,
          stats.bookingsByStatus?.pending || 0,
          stats.bookingsByStatus?.cancelled || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Tableau de bord</h1>

        {/* Sélecteur de période */}
        <div className={styles.dateRangeSelector}>
          <label>Du</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <label>Au</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
          <button
            className={styles.btnPreset}
            onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(now), 'yyyy-MM-dd')
              });
            }}
          >
            Ce mois
          </button>
        </div>
      </div>

      {/* KPIs du jour */}
      {dailyStats && (
        <div className={styles.dailyStats}>
          <h2>📅 Aujourd'hui</h2>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>📝</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{dailyStats.totalBookings}</div>
                <div className={styles.kpiLabel}>Réservations</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>👥</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{dailyStats.totalPeople}</div>
                <div className={styles.kpiLabel}>Personnes</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>💰</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{dailyStats.totalRevenue}€</div>
                <div className={styles.kpiLabel}>Revenus</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>✅</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{dailyStats.totalPaid}€</div>
                <div className={styles.kpiLabel}>Encaissé</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs de la période */}
      <div className={styles.periodStats}>
        <h2>📆 Période sélectionnée</h2>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>📅</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.totalSessions}</div>
              <div className={styles.kpiLabel}>Sessions</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>📝</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.totalBookings}</div>
              <div className={styles.kpiLabel}>Réservations</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>👥</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.totalPeople}</div>
              <div className={styles.kpiLabel}>Personnes</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>💰</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.totalRevenue}€</div>
              <div className={styles.kpiLabel}>Revenus totaux</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>✅</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.totalPaid}€</div>
              <div className={styles.kpiLabel}>Encaissé</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>⏳</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.totalUnpaid}€</div>
              <div className={styles.kpiLabel}>À encaisser</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>📊</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.averageFillRate}%</div>
              <div className={styles.kpiLabel}>Taux de remplissage</div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>✓</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.confirmedBookings}</div>
              <div className={styles.kpiLabel}>Confirmées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className={styles.chartsGrid}>
        {/* Graphique des revenus */}
        <div className={styles.chartCard}>
          <h3>💰 Évolution des revenus</h3>
          <div className={styles.chartContainer}>
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => value + '€'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Graphique des produits */}
        <div className={styles.chartCard}>
          <h3>🏞️ Réservations par canyon</h3>
          <div className={styles.chartContainer}>
            <Bar
              data={productChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Graphique des statuts */}
        <div className={styles.chartCard}>
          <h3>📊 Statuts des réservations</h3>
          <div className={styles.chartContainer}>
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>
      </div>

      {/* Dernières réservations */}
      <div className={styles.recentBookings}>
        <h2>📝 Dernières réservations</h2>
        <div className={styles.bookingsTable}>
          {recentBookings.length === 0 ? (
            <p className={styles.emptyState}>Aucune réservation récente</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Produit</th>
                  <th>Date</th>
                  <th>Personnes</th>
                  <th>Prix</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.clientFirstName} {booking.clientLastName}</td>
                    <td>{booking.product?.name}</td>
                    <td>{format(new Date(booking.session.date), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td>{booking.numberOfPeople}</td>
                    <td>{booking.totalPrice}€</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
                        {booking.status === 'pending' ? 'En attente' :
                         booking.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;
