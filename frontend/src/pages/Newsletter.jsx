import { useState, useEffect } from 'react';
import { newsletterAPI } from '../services/api';
import styles from './Newsletter.module.css';

const Newsletter = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [stats, setStats] = useState({ active: 0, total: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active'); // 'all', 'active', 'inactive'

  // Formulaire d'envoi
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    htmlContent: '',
    textContent: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadNewsletters();
  }, [filter, search]);

  const loadNewsletters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.isActive = filter === 'active';
      }
      if (search) {
        params.search = search;
      }

      const response = await newsletterAPI.getAll(params);
      setNewsletters(response.data.newsletters);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement newsletters:', error);
      alert('Erreur lors du chargement de la liste');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet abonné ?')) return;

    try {
      await newsletterAPI.delete(id);
      loadNewsletters();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSendTestEmail = async () => {
    if (!emailForm.subject || !emailForm.htmlContent) {
      alert('Veuillez remplir au moins le sujet et le contenu HTML');
      return;
    }

    try {
      setSending(true);
      await newsletterAPI.sendTestEmail(emailForm);
      alert('Email de test envoyé avec succès !');
    } catch (error) {
      console.error('Erreur envoi test:', error);
      alert('Erreur lors de l\'envoi du test');
    } finally {
      setSending(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!emailForm.subject || !emailForm.htmlContent) {
      alert('Veuillez remplir au moins le sujet et le contenu HTML');
      return;
    }

    const activeCount = stats.active;
    if (activeCount === 0) {
      alert('Aucun abonné actif');
      return;
    }

    if (!confirm(`Envoyer la newsletter à ${activeCount} abonnés ?`)) return;

    try {
      setSending(true);
      const response = await newsletterAPI.sendEmail(emailForm);
      alert(response.data.message);
      setShowEmailForm(false);
      setEmailForm({ subject: '', htmlContent: '', textContent: '' });
    } catch (error) {
      console.error('Erreur envoi newsletter:', error);
      alert('Erreur lors de l\'envoi de la newsletter');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.newsletterPage}>
      <div className={styles.header}>
        <h1>Newsletter</h1>
        <button
          className={styles.btnPrimary}
          onClick={() => setShowEmailForm(!showEmailForm)}
        >
          {showEmailForm ? 'Annuler' : 'Envoyer une newsletter'}
        </button>
      </div>

      {/* Statistiques */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Abonnés actifs</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.inactive}</div>
          <div className={styles.statLabel}>Désabonnés</div>
        </div>
      </div>

      {/* Formulaire d'envoi */}
      {showEmailForm && (
        <div className={styles.emailForm}>
          <h2>Composer une newsletter</h2>

          <div className={styles.formGroup}>
            <label>Sujet *</label>
            <input
              type="text"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              placeholder="Ex: Nouvelles activités disponibles"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Contenu HTML *</label>
            <textarea
              value={emailForm.htmlContent}
              onChange={(e) => setEmailForm({ ...emailForm, htmlContent: e.target.value })}
              placeholder="Contenu de l'email en HTML..."
              rows={15}
            />
            <p className={styles.helpText}>
              Utilisez du HTML pour formater votre email. Exemple:
              <br/>
              &lt;h2&gt;Titre&lt;/h2&gt;&lt;p&gt;Texte&lt;/p&gt;
            </p>
          </div>

          <div className={styles.formGroup}>
            <label>Contenu texte (optionnel)</label>
            <textarea
              value={emailForm.textContent}
              onChange={(e) => setEmailForm({ ...emailForm, textContent: e.target.value })}
              placeholder="Version texte brut de l'email (pour les clients email ne supportant pas le HTML)..."
              rows={8}
            />
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.btnSecondary}
              onClick={handleSendTestEmail}
              disabled={sending}
            >
              Envoyer un test à moi-même
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleSendNewsletter}
              disabled={sending}
            >
              {sending ? 'Envoi en cours...' : `Envoyer à ${stats.active} abonnés`}
            </button>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className={styles.filters}>
        <div className={styles.filterTabs}>
          <button
            className={filter === 'active' ? styles.active : ''}
            onClick={() => setFilter('active')}
          >
            Actifs ({stats.active})
          </button>
          <button
            className={filter === 'all' ? styles.active : ''}
            onClick={() => setFilter('all')}
          >
            Tous ({stats.total})
          </button>
          <button
            className={filter === 'inactive' ? styles.active : ''}
            onClick={() => setFilter('inactive')}
          >
            Désabonnés ({stats.inactive})
          </button>
        </div>

        <input
          type="text"
          placeholder="Rechercher par email, prénom ou nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Liste des abonnés */}
      <div className={styles.subscribersList}>
        {loading ? (
          <p>Chargement...</p>
        ) : newsletters.length === 0 ? (
          <p>Aucun abonné trouvé</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Prénom</th>
                <th>Nom</th>
                <th>Source</th>
                <th>Inscrit le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {newsletters.map((newsletter) => (
                <tr key={newsletter.id}>
                  <td>{newsletter.email}</td>
                  <td>{newsletter.firstName || '-'}</td>
                  <td>{newsletter.lastName || '-'}</td>
                  <td>
                    <span className={styles.badge}>
                      {newsletter.source || 'manuel'}
                    </span>
                  </td>
                  <td>{new Date(newsletter.subscribedAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={newsletter.isActive ? styles.statusActive : styles.statusInactive}>
                      {newsletter.isActive ? 'Actif' : 'Désabonné'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(newsletter.id)}
                      className={styles.btnDelete}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Newsletter;
