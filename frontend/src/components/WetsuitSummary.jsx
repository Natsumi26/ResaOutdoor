import { useState, useEffect } from 'react';
import { participantsAPI } from '../services/api';
import styles from './WetsuitSummary.module.css';

const WetsuitSummary = ({ sessionId, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, [sessionId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await participantsAPI.getSessionWetsuitSummary(sessionId);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement de la synthèse');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
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

  if (!summary || summary.totalParticipants === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          Aucun participant enregistré pour cette session
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.btnClose}>
            Fermer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Indicateur de complétion des formulaires */}
      {summary.allFormsCompleted ? (
        <div className={styles.statusComplete}>
          ✓ Tous les formulaires participants ont été complétés ({summary.completedForms}/{summary.totalBookings})
        </div>
      ) : (
        <div className={styles.statusIncomplete}>
          ⚠ Formulaires incomplets : {summary.completedForms}/{summary.totalBookings} complétés
        </div>
      )}

      <div className={styles.content}>
        {/* Synthèse des combinaisons */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🧥 Combinaisons nécessaires</h3>
          {summary.wetsuitSummary.length > 0 ? (
            <div className={styles.wetsuitGrid}>
              {summary.wetsuitSummary.map(({ size, count }) => (
                <div key={size} className={styles.wetsuitCard}>
                  <div className={styles.wetsuitSize}>{size}</div>
                  <div className={styles.wetsuitCount}>×{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>Aucune combinaison à préparer</p>
          )}
        </div>

        {/* Synthèse des chaussures */}
        {summary.shoeRentalSummary.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>👟 Chaussures à louer</h3>
            <div className={styles.shoesGrid}>
              {summary.shoeRentalSummary.map(({ size, count }) => (
                <div key={size} className={styles.shoeCard}>
                  <div className={styles.shoeSize}>{size}</div>
                  <div className={styles.shoeCount}>×{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails par produit */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📋 Détail par activité</h3>
          {summary.participantsByProduct.map((productGroup) => (
            <div key={productGroup.productName} className={styles.productGroup}>
              <div
                className={styles.productHeader}
                style={{ borderLeftColor: productGroup.color }}
              >
                <h4>{productGroup.productName}</h4>
                <span className={styles.productCount}>
                  {productGroup.bookings.reduce((sum, b) => sum + b.participants.length, 0)} participants
                </span>
              </div>

              {productGroup.bookings.map((booking) => (
                <div key={booking.bookingId} className={styles.bookingGroup}>
                  <div className={styles.bookingHeader}>
                    <span className={styles.clientName}>👤 {booking.clientName}</span>
                    <span className={styles.participantCount}>
                      {booking.participants.length} personne{booking.participants.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className={styles.participantsTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Prénom</th>
                          <th>Âge</th>
                          <th>Taille</th>
                          <th>Combi (T)</th>
                          <th>Poids</th>
                          <th>Combi (P)</th>
                          <th>Chaussures</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.participants.map((participant, idx) => (
                          <tr key={idx}>
                            <td>{participant.firstName}</td>
                            <td>{participant.age} ans</td>
                            <td>{participant.height} cm</td>
                            <td>
                              {participant.wetsuitSizeByHeight ? (
                                <span className={styles.sizeBadgeSecondary}>
                                  {participant.wetsuitSizeByHeight}
                                </span>
                              ) : (
                                <span className={styles.noShoe}>-</span>
                              )}
                            </td>
                            <td>{participant.weight} kg</td>
                            <td>
                              {participant.wetsuitSize ? (
                                <span className={styles.sizeBadge}>
                                  {participant.wetsuitSize}
                                </span>
                              ) : (
                                <span className={styles.noShoe}>-</span>
                              )}
                            </td>
                            <td>
                              {participant.shoeRental ? (
                                <span className={styles.shoeBadge}>
                                  {participant.shoeSize}
                                </span>
                              ) : (
                                <span className={styles.noShoe}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnClose}>
            Fermer
          </button>
          <button
            onClick={() => {
              const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
              const token = localStorage.getItem('token');
              console.log('Token stocké :', localStorage.getItem('token'));
              console.log(token)
              window.open(`${API_URL}/participants/session/${sessionId}/print?token=${token}`, '_blank');
            }}
            className={styles.btnExport}
          >
            📄 Exporter PDF
          </button>
          <button
            onClick={() => window.print()}
            className={styles.btnPrint}
          >
            🖨️ Imprimer
          </button>
        </div>
    </div>
  );
};

export default WetsuitSummary;
