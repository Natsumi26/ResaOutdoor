import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sessionsAPI } from '../../services/api';
import DateRangePicker from '../../components/DateRangePicker';
import styles from './ClientPages.module.css';
import { Trans, useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';


const CanyonSearch = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const startDateParam = queryParams.get('startDate'); // format attendu : yyyy-MM-dd
  const colorFromUrl = queryParams.get('color');
  const [selectedDate, setSelectedDate] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Tous les produits avant filtrage
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextAvailableDates, setNextAvailableDates] = useState([]);
  const [filters, setFilters] = useState({
    guideId : searchParams.get('guideId')|| '',
    teamName : searchParams.get('teamName')|| '',
    participants: searchParams.get('participants') || '',
    date: searchParams.get('date') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [clientColor, setClientColor] = useState(() => {
    // Priorité: URL > localStorage > défaut
    return colorFromUrl || localStorage.getItem('clientThemeColor') || '#3498db';
  });

  // État pour le calendrier
  const [calendarAvailability, setCalendarAvailability] = useState({});

  // Filtres supplémentaires pour les résultats
  const [resultFilters, setResultFilters] = useState({
    category: '',
    massif: '',
    difficulty: ''
  });

  // Détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Ref pour le calendrier
  const calendarRef = useRef(null);

  // État pour le modal de validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer le calendrier quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // Sauvegarder la couleur dans localStorage si elle vient de l'URL
  useEffect(() => {
    if (colorFromUrl) {
      localStorage.setItem('clientThemeColor', colorFromUrl);
    }
    loadCalendarAvailability();
  }, [colorFromUrl]);

  // Retirer le chargement automatique au démarrage
  useEffect(() => {
    if (startDateParam) {
      const parsedDate = new Date(startDateParam);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }

    // Ne charger que si les paramètres URL sont présents
    const hasParams = searchParams.get('participants') || searchParams.get('date') || searchParams.get('startDate');
    if (hasParams && filters.participants && (filters.date || (filters.startDate && filters.endDate))) {
      loadProducts();
    }
  }, []);

  // Appliquer les filtres sur les résultats
  useEffect(() => {
    if (allProducts.length === 0) return;

    let filtered = [...allProducts];

    // Filtre par catégorie
    if (resultFilters.category) {
      filtered = filtered.filter(product =>
        product.categories && product.categories.some(cat =>
          cat.category && cat.category.name === resultFilters.category
        )
      );
    }

    // Filtre par massif (à implémenter quand le champ sera ajouté)
    if (resultFilters.massif) {
      filtered = filtered.filter(product =>
        product.massif === resultFilters.massif
      );
    }

    // Filtre par difficulté
    if (resultFilters.difficulty) {
      filtered = filtered.filter(product =>
        product.level && product.level.toLowerCase() === resultFilters.difficulty.toLowerCase()
      );
    }

    setProducts(filtered);
  }, [resultFilters, allProducts]);

  const loadProducts = async (customFilters = null) => {
    const currentFilters = customFilters || filters;

    // Vérifier que les champs requis sont remplis
    if (!currentFilters.participants) {
      return;
    }

    if (!currentFilters.date && !(currentFilters.startDate && currentFilters.endDate)) {
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      // Construire les paramètres de recherche
      const params = {};

      if (currentFilters.participants) {
        params.participants = currentFilters.participants;
      }

      // Utiliser soit la date spécifique, soit la période
      if (currentFilters.date) {
        params.date = currentFilters.date;
      } else if (currentFilters.startDate && currentFilters.endDate) {
        params.startDate = currentFilters.startDate;
        params.endDate = currentFilters.endDate;
      }

      // 🌐 Ajouter les filtres guideId ou teamName depuis l'URL
      const guideId = searchParams.get('guideId');
      const teamName = searchParams.get('teamName');

      if (guideId) params.guideId = guideId;
      if (teamName) params.teamName = teamName;

      // Utiliser la nouvelle API de recherche
      const response = await sessionsAPI.searchAvailable(params);
      const fetchedProducts = response.data.products || [];
      setAllProducts(fetchedProducts);
      setProducts(fetchedProducts);

      // Si aucun produit trouvé, chercher les prochaines dates disponibles
      if (!fetchedProducts || fetchedProducts.length === 0) {
        try {
          // 🌐 Ajouter les filtres guideId ou teamName
          const guideId = searchParams.get('guideId');
          const teamName = searchParams.get('teamName');
          const params = {
            participants: currentFilters.participants
          };
          if (guideId) params.guideId = guideId;
          if (teamName) params.teamName = teamName;

          const nextDatesResponse = await sessionsAPI.getNextAvailableDates(params);
          const dates = nextDatesResponse.data.dates || [];

          // Filtrer pour ne garder que les dates avec au moins une session future
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

          const futureDates = dates.filter(dateInfo => {
            const dateObj = new Date(dateInfo.date);
            dateObj.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
            
            // Garder toutes les dates >= aujourd'hui
            return dateObj >= now;
          });
          console.log(futureDates)
          setNextAvailableDates(futureDates);
        } catch (err) {
          console.error('Erreur récupération prochaines dates:', err);
          setNextAvailableDates([]);
        }
      } else {
        setNextAvailableDates([]);
      }

    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
      setNextAvailableDates([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les disponibilités pour le calendrier
  const loadCalendarAvailability = async () => {
    try {
      // Charger les sessions des 60 prochains jours
      const today = new Date();
      const endDate = addDays(today, 60);

      // 🌐 Ajouter les filtres guideId ou teamName depuis l'URL
      const params = {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      };

      const guideId = searchParams.get('guideId');
      const teamName = searchParams.get('teamName');
      if (guideId) params.guideId = guideId;
      if (teamName) params.teamName = teamName;

      const response = await sessionsAPI.getAll(params);

      const allSessions = response.data.sessions || [];
      const availability = {};
      const now = new Date();

      // Analyser chaque session pour déterminer la disponibilité
      allSessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');

        // Vérifier si la session est passée
        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.startTime.split(':').map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);
        const isSessionPast = sessionDate <= now;

        // Ignorer les sessions passées
        if (isSessionPast) return;

        // Calculer la disponibilité pour cette session
        if (session.status === 'open' && session.products && session.products.length > 0) {
          // Vérifier s'il y a au moins un produit avec des places disponibles
          const hasAvailability = session.products.some(sp => {
            const maxCapacity = sp.product.maxCapacity;
            const booked = session.bookings
              .filter(b => String(b.productId) === String(sp.product.id) && b.status !== 'cancelled')
              .reduce((sum, b) => sum + b.numberOfPeople, 0);
            return maxCapacity > booked;
          });

          if (hasAvailability) {
            availability[dateKey] = 'available';
          } else if (!availability[dateKey]) {
            // Si pas encore marqué comme disponible, marquer comme complet
            availability[dateKey] = 'full';
          }
        }
      });

      // Marquer les dates futures sans session comme fermées
      for (let i = 0; i < 60; i++) {
        const date = addDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!availability[dateKey]) {
          availability[dateKey] = 'closed';
        }
      }

      setCalendarAvailability(availability);
    } catch (error) {
      console.error('Erreur chargement disponibilités calendrier:', error);
      setCalendarAvailability({});
    }
  };

  const handleDateChange = (startDate, endDate) => {
    const newFilters = { ...filters };

    if (startDate && !endDate) {
      // Date unique
      newFilters.date = startDate;
      newFilters.startDate = '';
      newFilters.endDate = '';
      setSelectedDate(new Date(startDate));
    } else if (startDate && endDate) {
      // Période
      newFilters.date = '';
      newFilters.startDate = startDate;
      newFilters.endDate = endDate;
      setSelectedDate(new Date(startDate));
    } else {
      // Réinitialisation
      newFilters.date = '';
      newFilters.startDate = '';
      newFilters.endDate = '';
      setSelectedDate(null);
    }

    setFilters(newFilters);

    // Mettre à jour les paramètres URL en préservant guideId/teamName
    const params = new URLSearchParams(searchParams);
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);

    // Lancer automatiquement la recherche si les critères sont remplis
    if (newFilters.participants && (newFilters.date || (newFilters.startDate && newFilters.endDate))) {
      loadProducts(newFilters);
    } else if (!startDate && !endDate) {
      // Si réinitialisation, effacer les résultats
      setProducts([]);
      setHasSearched(false);
      setNextAvailableDates([]);
    }
  };

  // Fonction spéciale pour gérer le clic sur le calendrier
  const handleCalendarDateClick = (startDate) => {
    if (!filters.participants) {
    alert(t("alerts.missingParticipantCount"));      return;
    }

    // Récupérer guideId et teamName depuis l'URL
    const guideId = searchParams.get('guideId');
    const teamName = searchParams.get('teamName');

    // Sélectionner cette date et lancer la recherche
    const newFilters = {
      ...filters,
      date: startDate,
      startDate: '',
      endDate: '',
      // Inclure guideId et teamName dans les filtres
      ...(guideId && { guideId }),
      ...(teamName && { teamName })
    };

    setFilters(newFilters);
    setSelectedDate(new Date(startDate));

    // Mettre à jour l'URL en préservant guideId/teamName
    const params = new URLSearchParams(searchParams);
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);

    // Lancer la recherche
    loadProducts(newFilters);
  };

  const handleParticipantsChange = (value) => {
    const newFilters = { ...filters, participants: value };
    setFilters(newFilters);

    // Mettre à jour les paramètres URL en préservant guideId/teamName
    const params = new URLSearchParams(searchParams);
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const handleSearch = () => {
    // Réinitialiser les filtres de résultats
    setResultFilters({
      category: '',
      massif: '',
      difficulty: ''
    });
    loadProducts();
    // Scroll automatique vers les résultats après un court délai
    setTimeout(() => {
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const canSearch = filters.participants && (filters.date || (filters.startDate && filters.endDate));

  // Navigation entre les jours
  const navigateDay = (direction) => {
    if (!filters.date) return;

    const currentDate = parseISO(filters.date);
    const newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
    const formattedDate = format(newDate, 'yyyy-MM-dd');

    const newFilters = {
      ...filters,
      date: formattedDate,
      startDate: '',
      endDate: ''
    };

    setFilters(newFilters);

    // Mettre à jour les paramètres URL
    const params = new URLSearchParams(searchParams);
    params.set('date', formattedDate);
    params.delete('startDate');
    params.delete('endDate');
    setSearchParams(params);

    // Lancer automatiquement la recherche
    loadProducts(newFilters);
  };

  const getDurationLabel = (minutes) => {
    const hours = minutes / 60;
    if (hours < 1) return `${minutes} min`;
    if (hours === Math.floor(hours)) return `${hours}h`;
    return `${Math.floor(hours)}h${(minutes % 60).toString().padStart(2, '0')}`;
  };

  const getLevelBadgeClass = (level) => {
    const levelMap = {
      'découverte': styles.badgeGreen,
      'aventure': styles.badgeOrange,
      'sportif': styles.badgeRed
    };
    return levelMap[level] || styles.badgeGray;
  };

  const getLevelColor = (level) => {
    const colorMap = {
      'découverte': '#28a745',
      'aventure': '#fd7e14',
      'sportif': '#dc3545'
    };
    return colorMap[level?.toLowerCase()] || '#6c757d';
  };

  // Obtenir les catégories uniques des produits
  const getUniqueCategories = () => {
    const categories = new Set();
    allProducts.forEach(product => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach(cat => {
          if (cat.category && cat.category.name) {
            categories.add(cat.category.name);
          }
        });
      }
    });
    return Array.from(categories).sort();
  };

  // Obtenir les massifs uniques (à implémenter plus tard)
  const getUniqueMassifs = () => {
    const massifs = new Set();
    allProducts.forEach(product => {
      if (product.massif) {
        massifs.add(product.massif);
      }
    });
    return Array.from(massifs).sort();
  };

  // Obtenir les difficultés uniques
  const getUniqueDifficulties = () => {
    const difficulties = new Set();
    allProducts.forEach(product => {
      if (product.level) {
        difficulties.add(product.level);
      }
    });
    return Array.from(difficulties).sort();
  };

  console.log(nextAvailableDates)
  // Afficher l'interface de recherche (toujours visible maintenant)
  return (
    <div className={styles.searchPageContainer}>
      {/* Styles globaux pour les focus des inputs */}
      <style>
        {`
          .${styles.filterGroup} select:focus,
          .${styles.filterGroup} input[type="date"]:focus {
            border-color: ${clientColor} !important;
            box-shadow: 0 0 0 3px ${clientColor}20 !important;
          }
        `}
      </style>
      <div className={styles.searchBox} style={{ marginTop: '2rem', position: 'relative' }}>
        {/* Sélecteur de langue à cheval dans le coin */}
        <div style={{ position: 'absolute', top: '-8px', right: '-8px', zIndex: 10, transform: 'scale(1.2)' }}>
          <LanguageSwitcher />
        </div>

        {/* Titre */}
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>
          {t("booking.title")}
        </h2>

        {/* Informations de contact */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#495057', lineHeight: 1.5, textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
          <Trans i18nKey="booking.groupContact">
            Pour les réservations de groupe : <a href="tel:+33688788186" style={{ color: clientColor, textDecoration: 'none', fontWeight: 600 }}>06 88 78 81 86</a> - <a href="mailto:contact@canyonlife.fr" style={{ color: clientColor, textDecoration: 'none', fontWeight: 600 }}>contact@canyonlife.fr</a>
          </Trans>
          </p>
        </div>

          {/* Section Date */}
          <div ref={calendarRef} style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#495057', textAlign: 'center' }}>
              Date
            </label>
            <input
              type="text"
              readOnly
              value={
                filters.date
                  ? new Date(filters.date).toLocaleDateString('fr-FR')
                  : filters.startDate && filters.endDate
                  ? `${new Date(filters.startDate).toLocaleDateString('fr-FR')} - ${new Date(filters.endDate).toLocaleDateString('fr-FR')}`
                  : ''
              }
              onClick={() => setShowCalendar(!showCalendar)}
              placeholder="Sélectionner"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: 'white',
                textAlign: 'center'
              }}
            />
            {showCalendar && (
              <div style={{ marginTop: '0.75rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <DateRangePicker
                  onDateChange={(start, end) => {
                    handleDateChange(start, end);
                    if (start) setShowCalendar(false);
                  }}
                  initialStartDate={filters.startDate || filters.date}
                  initialEndDate={filters.endDate}
                  accentColor={clientColor}
                />
              </div>
            )}
          </div>

          {/* Nombre de participants */}
          <div style={{ maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#495057', textAlign: 'center' }}>
              {t('NbrParticipants')} *
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 4"
              value={filters.participants}
              onChange={(e) => handleParticipantsChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem',
                textAlign: 'center'
              }}
            />
          </div>

        {/* Bouton de recherche */}
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!canSearch && !loading) {
                let message = '';
                if (!filters.participants && !filters.date && !filters.startDate) {
                  message = t('alerts.missingDateAndParticipants') || 'Veuillez sélectionner une date et indiquer le nombre de participants';
                } else if (!filters.participants) {
                  message = t('alerts.missingParticipantCount') || 'Veuillez indiquer le nombre de participants';
                } else if (!filters.date && !filters.startDate) {
                  message = t('alerts.missingDate') || 'Veuillez sélectionner une date';
                }
                setValidationMessage(message);
                setShowValidationModal(true);
              } else if (!loading) {
                handleSearch();
              }
            }}
            className={`${styles.searchButton} ${(!canSearch || loading) ? styles.searchButtonDisabled : ''}`}
            title={!canSearch && !loading ? (
              !filters.participants && !filters.date && !filters.startDate
                ? t('alerts.missingDateAndParticipants') || 'Veuillez sélectionner une date et indiquer le nombre de participants'
                : !filters.participants
                ? t('alerts.missingParticipantCount') || 'Veuillez indiquer le nombre de participants'
                : t('alerts.missingDate') || 'Veuillez sélectionner une date'
            ) : ''}
            style={{
              width: '100%',
              backgroundColor: canSearch && !loading ? clientColor : undefined,
              borderColor: canSearch && !loading ? clientColor : undefined,
              cursor: (!canSearch || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t('RechercheLoading') || 'Recherche en cours...' : t('Rechercher')}
          </button>
        </div>

        {/* Bouton Bon Cadeau */}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.guideId) params.set('guideId', filters.guideId);
              if (filters.teamName) params.set('teamName', filters.teamName);
              const color = searchParams.get('color');
              if (color) params.set('color', color);
              navigate(`/client/gift-voucher?${params.toString()}`);
            }}
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s',
              opacity: '0.9'
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = '1';
              e.target.style.background = '#5a6268';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '0.9';
              e.target.style.background = '#6c757d';
            }}
          >
            🎁 {t('achatGift') || 'Acheter un bon cadeau'}
          </button>
        </div>
      </div>

      {/* Résultats en dessous */}
      {hasSearched && (
        <div id="results" style={{ marginTop: '2rem', width: '100%', maxWidth: '1200px', background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {products.length > 0 ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', color: '#6c757d', fontWeight: '500', margin: 0 }}>
                      {products.length} canyon{products.length > 1 ? 's' : ''} {t('Find')}{products.length > 1 ? 's' : ''}
                      {(resultFilters.category || resultFilters.massif || resultFilters.difficulty) && allProducts.length !== products.length && (
                        <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: clientColor }}>
                          (sur {allProducts.length})
                        </span>
                      )}
                    </h2>

                    {/* Navigation de dates (seulement si recherche par date unique) */}
                    {filters.date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                        <button
                          onClick={() => navigateDay('previous')}
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0',
                            border: `2px solid ${clientColor}`,
                            borderRadius: '50%',
                            background: 'white',
                            color: clientColor,
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            lineHeight: '1',
                            fontFamily: 'Arial, sans-serif'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = clientColor;
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = `0 4px 8px ${clientColor}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = clientColor;
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          title="Jour précédent"
                        >
                          ‹
                        </button>
                        <span style={{
                          fontSize: '0.9rem',
                          color: '#495057',
                          fontWeight: '500',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}>
                          {format(parseISO(filters.date), 'dd/MM/yyyy')}
                        </span>
                        <button
                          onClick={() => navigateDay('next')}
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0',
                            border: `2px solid ${clientColor}`,
                            borderRadius: '50%',
                            background: 'white',
                            color: clientColor,
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            lineHeight: '1',
                            fontFamily: 'Arial, sans-serif'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = clientColor;
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = `0 4px 8px ${clientColor}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = clientColor;
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          title="Jour suivant"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filtres supplémentaires */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Catégorie - masqué sur mobile */}
                    {!isMobile && getUniqueCategories().length > 0 && (
                      <select
                        value={resultFilters.category}
                        onChange={(e) => setResultFilters({ ...resultFilters, category: e.target.value })}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">{t('allCategories')}</option>
                        {getUniqueCategories().map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}

                    {/* Massif - masqué sur mobile */}
                    {!isMobile && getUniqueMassifs().length > 0 && (
                      <select
                        value={resultFilters.massif}
                        onChange={(e) => setResultFilters({ ...resultFilters, massif: e.target.value })}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">{t('allMassifs')}</option>
                        {getUniqueMassifs().map(massif => (
                          <option key={massif} value={massif}>{massif}</option>
                        ))}
                      </select>
                    )}

                    {/* Difficulté - toujours visible */}
                    {getUniqueDifficulties().length > 0 && (
                      <select
                        value={resultFilters.difficulty}
                        onChange={(e) => setResultFilters({ ...resultFilters, difficulty: e.target.value })}
                        style={{
                          padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          cursor: 'pointer',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">{isMobile ? t("filters.difficultyShort") : t("filters.difficultyAll")}</option>
                        {getUniqueDifficulties().map(diff => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {products.map((product) => {
                  // Grouper les sessions par date
                  const sessionsByDate = {};
                  if (product.availableSessions && product.availableSessions.length > 0) {
                    product.availableSessions.forEach(session => {
                      const dateKey = session.date.split('T')[0]; // Extraire juste la date YYYY-MM-DD
                      if (!sessionsByDate[dateKey]) {
                        sessionsByDate[dateKey] = [];
                      }
                      sessionsByDate[dateKey].push({
                        ...session,
                        id: session.sessionId,
                        availablePlaces: session.availableCapacity
                      });
                    });
                  }

                  const hasSessions = Object.keys(sessionsByDate).length > 0;

                  return (
                    <div key={product.uniqueId || product.id} className={styles.canyonCard}>
                      {/* Image à gauche/haut */}
                      <div className={styles.canyonCardImage}>
                        {product.images && product.images.length > 0 ? (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(${product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <button
                              onClick={() => {
                                // Si le produit a un websiteLink, ouvrir ce lien dans une nouvelle page
                                if (product.websiteLink) {
                                  window.open(product.websiteLink, '_blank', 'noopener,noreferrer');
                                  return;
                                }

                                // Sinon, naviguer vers /client/canyon
                                const params = new URLSearchParams();
                                const guideId = searchParams.get('guideId');
                                const teamName = searchParams.get('teamName');

                                if (guideId) params.set('guideId', guideId);
                                if (teamName) params.set('teamName', teamName);
                                const color = searchParams.get('color');
                                if (color) params.set('color', color);

                                // Si le produit a des overrides, passer la sessionId de la première session disponible
                                const hasOverrides = product.uniqueId && product.uniqueId !== product.id;
                                const sessionIdParam = hasOverrides && product.availableSessions?.[0]?.sessionId
                                  ? `&sessionId=${product.availableSessions[0].sessionId}`
                                  : '';

                                navigate(`/client/canyon/${product.id}?startDate=${filters.date || filters.startDate}&participants=${filters.participants}&${params.toString()}${sessionIdParam}`)}}
                              style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'white',
                                color: clientColor,
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = clientColor;
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.color = clientColor;
                              }}
                            >
                              {t('MoreInfo')}
                            </button>
                          </div>
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: product.color || '#dee2e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => {
                                // Si le produit a un websiteLink, ouvrir ce lien dans une nouvelle page
                                if (product.websiteLink) {
                                  window.open(product.websiteLink, '_blank', 'noopener,noreferrer');
                                  return;
                                }

                                // Sinon, naviguer vers /client/canyon
                                const params = new URLSearchParams();
                                const guideId = searchParams.get('guideId');
                                const teamName = searchParams.get('teamName');

                                if (guideId) params.set('guideId', guideId);
                                if (teamName) params.set('teamName', teamName);
                                const color = searchParams.get('color');
                                if (color) params.set('color', color);

                                // Si le produit a des overrides, passer la sessionId de la première session disponible
                                const hasOverrides = product.uniqueId && product.uniqueId !== product.id;
                                const sessionIdParam = hasOverrides && product.availableSessions?.[0]?.sessionId
                                  ? `&sessionId=${product.availableSessions[0].sessionId}`
                                  : '';

                                navigate(`/client/canyon/${product.id}?startDate=${filters.date || filters.startDate}&participants=${filters.participants}&${params.toString()}${sessionIdParam}`)}}
                              style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'white',
                                color: clientColor,
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = clientColor;
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.color = clientColor;
                              }}
                            >
                              {t('MoreInfo')}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Contenu à droite/bas */}
                      <div className={styles.canyonCardContent}>
                        {/* Titre avec prix */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div className={styles.headerCard}>
                            <h3>
                              {product.name.toUpperCase()}
                            </h3>
                            <div className={styles.priceBlock}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', lineHeight: 1 }}>
                                {product.priceIndividual}€
                              </div>
                              {product.priceGroup && product.priceGroup.min && (
                                <div style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                  {t("pricing.groupRateFrom", { count: product.priceGroup.min })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#495057', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '14px', height: '14px', background: '#2c3e50', borderRadius: '50%', display: 'inline-block' }}></span>
                              <span>{t('Durée')} : {getDurationLabel(product.duration)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '14px', height: '14px', background: getLevelColor(product.level), borderRadius: '50%', display: 'inline-block' }}></span>
                              <span>{t('filters.difficultyShort')} : {product.level}</span>
                            </div>
                          </div>

                          {/* Description courte */}
                          {product.shortDescription && (
                            <div style={{
                              marginTop: '0.75rem',
                              color: '#6c757d',
                              fontSize: '0.9rem',
                              lineHeight: '1.5',
                              fontStyle: 'italic'
                            }}>
                              {product.shortDescription}
                            </div>
                          )}
                        </div>

                        {/* Lieu de départ - Afficher uniquement si renseigné */}
                        {product.meetingPoint && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '0.25rem' }}>
                              {t('DepartPlace')}
                            </div>
                            <div style={{ color: clientColor, fontSize: '0.95rem' }}>
                              {product.meetingPoint}
                            </div>
                          </div>
                        )}

                        {/* Créneaux disponibles - Affichage conditionnel selon le nombre de jours */}
                        {hasSessions ? (
                          Object.keys(sessionsByDate).length > 2 ? (
                            // Période longue (> 2 jours) : Affichage résumé
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{
                                background: `linear-gradient(135deg, ${clientColor}20 0%, ${clientColor}40 100%)`,
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: `2px solid ${clientColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1.5rem' }}>📅</span>
                                  <div>
                                    <div style={{ fontWeight: '700', color: clientColor, fontSize: '1.1rem' }}>
                                      {t("sessions.availableSlots", {
                                        count: Object.values(sessionsByDate).flat().length
                                      })}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: clientColor, marginTop: '2px', opacity: 0.9 }}>
                                      {t("sessions.dateRange", {
                                          start: new Date(Object.keys(sessionsByDate)[0]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                                          end: new Date(Object.keys(sessionsByDate)[Object.keys(sessionsByDate).length - 1]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                                        })}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const params = new URLSearchParams();
                                    const guideId = searchParams.get('guideId');
                                    const teamName = searchParams.get('teamName');

                                    if (guideId) params.set('guideId', guideId);
                                    if (teamName) params.set('teamName', teamName);
                                    const color = searchParams.get('color');
                                    if (color) params.set('color', color);

                                    // Si le produit a des overrides, passer la sessionId de la première session disponible
                                    const hasOverrides = product.uniqueId && product.uniqueId !== product.id;
                                    const sessionIdParam = hasOverrides && product.availableSessions?.[0]?.sessionId
                                      ? `&sessionId=${product.availableSessions[0].sessionId}`
                                      : '';

                                    navigate(`/client/canyon/${product.id}?participants=${filters.participants}&${params.toString()}${sessionIdParam}`);
                                  }}
                                  style={{
                                    background: clientColor,
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s',
                                    boxShadow: `0 2px 4px ${clientColor}50`
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.opacity = '0.85';
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = `0 4px 8px ${clientColor}70`;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.opacity = '1';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = `0 2px 4px ${clientColor}50`;
                                  }}
                                >
                                  {t('slots.showSlots')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Période courte (1-2 jours) : Affichage détaillé
                            <div style={{ marginBottom: '1rem', flex: 1 }}>
                              <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '0.75rem' }}>
                                {t('slots.AvailableSlots')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.entries(sessionsByDate).map(([date, sessions]) => (
                                  <div key={date} style={{
                                    background: '#f8f9fa',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    {/* Date */}
                                    <div style={{
                                      fontWeight: '600',
                                      color: '#2c3e50',
                                      marginBottom: '0.75rem',
                                      fontSize: '0.95rem'
                                    }}>
                                      📅 {new Date(date).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                      })}
                                    </div>

                                    {/* Créneaux horaires pour cette date */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                      {sessions.map((session) => {
                                        const isAutoClosed = session.isAutoClosed;

                                        if (isAutoClosed) {
                                          // Affichage pour session fermée automatiquement
                                          return (
                                            <div
                                              key={session.sessionId || session.id}
                                              style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '6px',
                                                border: '2px solid #ffc107',
                                                background: '#fff3cd',
                                                cursor: 'default',
                                                minWidth: '140px'
                                              }}
                                            >
                                              <span style={{ fontSize: '1.1rem', color: '#856404', fontWeight: '600' }}>
                                                🕐 {session.startTime}
                                              </span>
                                              <span style={{ fontSize: '0.75rem', marginTop: '4px', color: '#856404', textAlign: 'center', lineHeight: '1.3' }}>
                                                {t('calendarEmbed.closedOnline')}
                                              </span>
                                              <span style={{ fontSize: '0.7rem', marginTop: '4px', color: '#856404', textAlign: 'center', lineHeight: '1.2' }}>
                                                📞 {t('calendarEmbed.callGuideToBook')}
                                              </span>
                                              <span style={{ fontSize: '0.75rem', marginTop: '2px', color: '#856404' }}>
                                                ({session.availablePlaces} {session.availablePlaces > 1 ? 'places' : 'place'})
                                              </span>
                                            </div>
                                          );
                                        }

                                        // Affichage normal pour session réservable
                                        return (
                                          <button
                                            key={session.sessionId || session.id}
                                            className={styles.timeSlotButton}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const sessionId = session.sessionId || session.id;
                                              const params = new URLSearchParams();
                                              const guideId = searchParams.get('guideId');
                                              const teamName = searchParams.get('teamName');

                                              if (guideId) params.set('guideId', guideId);
                                              if (teamName) params.set('teamName', teamName);
                                              const color = searchParams.get('color');
                                              if (color) params.set('color', color);
                                              navigate(`/client/book/${sessionId}?productId=${product.id}&participants=${filters.participants}&${params.toString()}`);
                                            }}
                                            style={{ borderColor: clientColor }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = clientColor;
                                              e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'white';
                                              e.currentTarget.style.color = '#2c3e50';
                                            }}
                                          >
                                            <span style={{ fontSize: '1.1rem' }}>🕐 {session.startTime}</span>
                                            <span style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
                                              {session.availablePlaces} places
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ) : (
                          <div style={{
                            padding: '1rem',
                            background: '#fff3cd',
                            borderRadius: '6px',
                            color: '#856404',
                            fontSize: '0.9rem',
                            marginBottom: '1rem'
                          }}>
                            ⚠️ {t('calendarEmbed.noSessionsAvailableForPeriode')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : allProducts.length > 0 ? (
            // Cas où des filtres sont actifs et ne retournent aucun résultat
            <div className={styles.noResults}>
              <h2>{t("filters.noResultsTitle")}</h2>
              <p>{t("filters.noResultsText")}</p>
              <button
                onClick={() => setResultFilters({ category: '', massif: '', difficulty: '' })}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: clientColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                {t("filters.resetButton")}
              </button>
            </div>
          ) : (
            <div className={styles.noResults}>
              <h2>{t('Désolé')} !</h2>
              <p>{t('NoResult')}</p>

              {/* Afficher les prochaines dates disponibles */}
              {nextAvailableDates.length > 0 && (
                <div className={styles.alternativeDatesSection}>
                  {/* Mise en page 2 colonnes */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '2rem',
                    marginTop: '2rem'
                  }}>
                    {/* Colonne gauche - Calendrier */}
                    <div>
                      <h3 style={{
                        fontSize: '1.3rem',
                        marginBottom: '1rem',
                        color: '#2c3e50',
                        textAlign: 'center'
                      }}>
                        {t("calendar.flexible")}
                      </h3>
                      <h4 style={{
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        color: '#6c757d',
                        textAlign: 'center',
                        fontWeight: '400'
                      }}>
                        {t("calendar.selectDate")}
                      </h4>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <DateRangePicker
                          onDateChange={handleCalendarDateClick}
                          hideRangeMode={true}
                          dateAvailability={calendarAvailability}
                          accentColor={clientColor}
                        />
                      </div>
                    </div>

                    {/* Colonne droite - Contact */}
                    <div>
                      <h3 style={{
                        fontSize: '1.3rem',
                        marginBottom: '1rem',
                        color: '#2c3e50',
                        textAlign: 'center'
                      }}>
                        {t("calendar.otherOption")}
                      </h3>
                      <p style={{
                        textAlign: 'center',
                        color: '#6c757d',
                        marginBottom: '1.5rem'
                      }}>
                        {t("calendar.callUs")}
                      </p>
                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        <a
                          href="tel:+33688788186"
                          className={styles.contactButton}
                          style={{
                            textDecoration: 'none',
                            borderColor: clientColor
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = clientColor;
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${clientColor}50`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.color = '#2c3e50';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }}
                        >
                          <div>
                            <strong>📞 {t('call')}</strong>
                            <p style={{ margin: 0 }}>06 88 78 81 86</p>
                          </div>
                        </a>
                        <a
                          href="mailto:contact@canyonlife.fr"
                          className={styles.contactButton}
                          style={{
                            textDecoration: 'none',
                            borderColor: clientColor
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = clientColor;
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${clientColor}50`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.color = '#2c3e50';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }}
                        >
                          <div>
                            <strong>✉️ {t('SendEmail')}</strong>
                            <p style={{ margin: 0 }}>contact@canyonlife.fr</p>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Modal de validation */}
      {showValidationModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowValidationModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>⚠️ {t('alerts.incompleteForm') || 'Formulaire incomplet'}</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowValidationModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>{validationMessage}</p>
              <button
                className={styles.modalButton}
                onClick={() => setShowValidationModal(false)}
                style={{ backgroundColor: clientColor, borderColor: clientColor }}
              >
                {t('alerts.understood') || 'J\'ai compris'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanyonSearch;
