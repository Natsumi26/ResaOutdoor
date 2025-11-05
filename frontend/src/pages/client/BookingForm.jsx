import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsAPI,productsAPI, bookingsAPI, giftVouchersAPI, stripeAPI, participantsAPI, newsletterAPI, settingsAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './ClientPages.module.css';
import { Trans, useTranslation } from 'react-i18next';

const BookingForm = () => {
  const { t, i18n } = useTranslation();
  const { sessionId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get('productId');
  const participantsFromUrl = searchParams.get('participants');
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modePayment, setModePayment] = useState('')
  const [clientColor, setClientColor] = useState(() => {
    // Essayer de récupérer depuis localStorage d'abord
    return localStorage.getItem('clientThemeColor') || '#3498db';
  });

  // Déterminer la langue initiale basée sur la langue de l'interface
  const initialLanguage = i18n.language?.startsWith('en') ? 'EN' : 'FR';

  const [formData, setFormData] = useState({
    numberOfPeople: participantsFromUrl ? parseInt(participantsFromUrl) : 1,
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    clientNationality: initialLanguage,
    voucherCode: '',
    paymentMethod: 'onsite', // 'online' ou 'onsite'
    fillParticipantsNow: true, // Toujours afficher le formulaire des participants
    payFullAmount: false, // Payer la totalité (si acompte requis)
    acceptNewsletterTerms: false // Accepter les conditions et s'inscrire à la newsletter
  });

  const [participants, setParticipants] = useState([]);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [showParticipantsForm, setShowParticipantsForm] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false); // Pour forcer le re-render



  useEffect(() => {
    // Initialiser les participants quand le nombre de personnes change (toujours afficher)
    setParticipants(prevParticipants => {
      const newParticipants = Array(formData.numberOfPeople).fill(null).map((_, i) => ({
        firstName: prevParticipants[i]?.firstName || '',
        age: prevParticipants[i]?.age || '',
        weight: prevParticipants[i]?.weight || '',
        height: prevParticipants[i]?.height || '',
        // ✅ Conserver la valeur exacte (false ou true), pas de || false
        shoeRental: prevParticipants[i]?.shoeRental ?? false,
        shoeSize: prevParticipants[i]?.shoeSize || ''
      }));
      return newParticipants;
    });
  }, [formData.numberOfPeople]);

  // Copier automatiquement le prénom du client dans le participant 1
  useEffect(() => {
    if (formData.clientFirstName && participants.length > 0) {
      setParticipants(prevParticipants => {
        const newParticipants = [...prevParticipants];
        if (newParticipants[0]) {
          newParticipants[0] = {
            ...newParticipants[0],
            firstName: formData.clientFirstName
          };
        }
        return newParticipants;
      });
    }
  }, [formData.clientFirstName]);

  // Vérifier si la session est dans moins de 24h
  const isLessThan24Hours = () => {
    if (!session) {
      console.log('❌ Pas de session chargée');
      return false;
    }

    const now = new Date();
    const sessionDateTime = new Date(session.date);
    const [hours, minutes] = session.startTime.split(':');
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const diffInHours = (sessionDateTime - now) / (1000 * 60 * 60);

    console.log('🕒 CALCUL 24H:', {
      maintenant: now.toLocaleString('fr-FR'),
      dateSession: sessionDateTime.toLocaleString('fr-FR'),
      differenceHeures: diffInHours.toFixed(2),
      estMoinsDe24h: diffInHours <= 30
    });

    // Utiliser 30 heures pour être sûr de couvrir "le lendemain"
    // (problèmes de timezone peuvent ajouter quelques heures)
    return diffInHours <= 30;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sessionRes, productRes, settingsRes] = await Promise.all([
          sessionsAPI.getById(sessionId),
          productsAPI.getById(productId),
          settingsAPI.get()
        ]);
        setSession(sessionRes.data.session);
        setModePayment(sessionRes.data.session.guide.paymentMode);
        setProduct(productRes.data.product);

        // Charger la couleur client
        const settings = settingsRes.data.settings;
        if (settings?.clientButtonColor) {
          setClientColor(settings.clientButtonColor);
          localStorage.setItem('clientThemeColor', settings.clientButtonColor);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
        navigate('/client/search');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId, productId]);

  // Calculer si la session est dans moins de 24h quand session change
  useEffect(() => {
    if (session) {
      const urgent = isLessThan24Hours();
      setIsUrgent(urgent);
    }
  }, [session]);

  useEffect(() => {
    if (modePayment === 'full_only') {
      handleChange(setFormData({ ...formData, paymentMethod: 'online' }));
    }
  }, [modePayment]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      [field]: value
    };
    setParticipants(newParticipants);
  };

  const handleVerifyVoucher = async () => {
    if (!formData.voucherCode) {
      setVoucherError(t('saisirCode'));
      return;
    }

    try {
      const response = await giftVouchersAPI.verifyCode(formData.voucherCode);
      if (response.data.valid) {
        setVoucherInfo(response.data.voucher);
        setVoucherError('');
      } else {
        setVoucherError(t('codeEronner'));
        setVoucherInfo(null);
      }
    } catch (error) {
      setVoucherError(error.response?.data?.error || 'Code invalide');
      setVoucherInfo(null);
    }
  };

  const calculateTotal = () => {
    if (!session || !product) return 0;

    const numberOfPeople = formData.numberOfPeople;

    let pricePerPerson = product.priceIndividual;

    // RÈGLE : Si un code promo/bon cadeau est appliqué, on ignore le prix de groupe
    const hasVoucher = voucherInfo !== null;

    // Appliquer le prix de groupe UNIQUEMENT si aucun code promo/bon cadeau n'est appliqué
    if (!hasVoucher && product.priceGroup && numberOfPeople >= product.priceGroup.min) {
      pricePerPerson = product.priceGroup.price;
    }

    let total = pricePerPerson * numberOfPeople;

    // Ajouter la location de chaussures
    if (session.shoeRentalPrice) {
      const shoeRentalCount = participants.filter(p => p.shoeRental).length;
      total += session.shoeRentalPrice * shoeRentalCount;
    }

    return total;
  };

  const calculateDiscount = () => {
    if (!voucherInfo) return 0;

    const total = calculateTotal();
    let discount = 0;

    if (voucherInfo.discountType === 'percentage') {
      // Réduction en pourcentage
      discount = (total * voucherInfo.amount) / 100;
    } else {
      // Réduction fixe
      discount = voucherInfo.amount;
    }

    // S'assurer que la réduction ne dépasse pas le total
    if (discount > total) discount = total;

    return discount;
  };

  const calculateFinalPrice = () => {
    const total = calculateTotal();
    const discount = calculateDiscount();
    return total - discount;
  };

  // Vérifier si un acompte est requis selon le mode de paiement du guide
  const isDepositRequired = () => {
    if (!session || !session.guide) return false;
    const paymentMode = session.guide.paymentMode || 'onsite_only';
    return paymentMode === 'deposit_only' || paymentMode === 'deposit_and_full';
  };


  // Calculer l'acompte si requis
  const calculateDeposit = () => {
    if (!isDepositRequired()) return 0;

    const finalPrice = calculateFinalPrice();
    const depositType = session.guide.depositType;
    const depositAmount = session.guide.depositAmount;

    if (depositType === 'percentage') {
      return (finalPrice * depositAmount) / 100;
    } else {
      // fixed
      return Math.min(depositAmount, finalPrice);
    }
  };

  // Calculer le montant à payer (acompte ou totalité selon le choix)
  const calculateAmountToPay = () => {
    const finalPrice = calculateFinalPrice();

    if (!isDepositRequired() || formData.payFullAmount) {
      // Pas d'acompte requis OU le client veut payer la totalité
      return finalPrice;
    }

    // Acompte requis et client ne veut pas payer la totalité
    return calculateDeposit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des informations client obligatoires
    if (!formData.clientFirstName || !formData.clientLastName  || !formData.clientEmail || !formData.clientPhone || !formData.clientNationality) {
      alert(t('alerts.champsOblig'));
      return;
    }

    // Si la session est dans moins de 24h, les informations des participants sont obligatoires
    if (isUrgent) {
      // Vérifier que tous les participants ont leurs informations complètes
      const incompleteParticipants = participants.filter(p =>
        !p.firstName || !p.age || !p.weight || !p.height
      );

      if (incompleteParticipants.length > 0) {
        alert(t("alerts.missingParticipantInfo"));
        return;
      }

      // Vérifier les pointures pour ceux qui louent des chaussures
      const shoeSizeError = participants.some(p => p.shoeRental && !p.shoeSize);
      if (shoeSizeError) {
        alert(t("alerts.missingSize"));
        return;
      }
    }
    // Sinon, les informations des participants sont optionnelles
    // Elles peuvent être remplies plus tard via le lien envoyé par email

    try {
      setSubmitting(true);

      const totalPrice = calculateTotal(); // Prix AVANT réduction
      const finalPrice = calculateFinalPrice(); // Prix APRÈS réduction
      const discount = calculateDiscount();
      const acompte = calculateDeposit();

      // Calculer le nombre de locations de chaussures
      let shoeRentalCount = 0;
      if (session.shoeRentalPrice) {
        shoeRentalCount = participants.filter(p => p.shoeRental).length;
      }

      const bookingData = {
        numberOfPeople: formData.numberOfPeople,
        clientFirstName: formData.clientFirstName,
        clientLastName: formData.clientLastName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        clientNationality: formData.clientNationality,
        totalPrice: totalPrice,
        shoeRentalCount: shoeRentalCount || null,
        voucherCode: formData.voucherCode || null,
        discountAmount: discount > 0 ? discount : null
      };

      // Enregistrer l'email à la newsletter si accepté
      if (formData.acceptNewsletterTerms) {
        try {
          await newsletterAPI.subscribe({
            email: formData.clientEmail,
            firstName: formData.clientFirstName,
            lastName: formData.clientLastName,
            source: 'booking',
            acceptedTerms: true
          });
        } catch (error) {
          // Si erreur newsletter, on continue quand même la réservation
          console.warn('Erreur inscription newsletter:', error);
        }
      }

      // SI ACOMPTE REQUIS OU PAIEMENT EN LIGNE : créer la session Stripe sans créer la réservation
      if (isDepositRequired() || formData.paymentMethod === 'online') {
        let amountDue = 0;

        if (formData.payFullAmount) {
          // Le client a choisi de payer la totalité
          amountDue = finalPrice;
        } else if (isDepositRequired()) {
          // Le guide demande un acompte
          amountDue = acompte;
        } else {
          // Paiement en ligne sans acompte (ex: full_only ou full_or_later)
          amountDue = finalPrice;
        }

        // Créer une session Stripe avec les données de réservation en metadata
        const stripeResponse = await stripeAPI.createBookingCheckout({
          sessionId: session.id,
          productId: productId,
          amountDue,
          bookingData,
          participants: participants.length > 0 ? participants : null,
          payFullAmount: formData.payFullAmount || false
        });

        // Rediriger vers Stripe
        window.location.href = stripeResponse.data.url;
      } else {
        // SI PAIEMENT SUR PLACE (et pas d'acompte requis) : créer la réservation normalement
        const bookingDataForCreate = {
          sessionId: session.id,
          productId: productId,
          ...bookingData,
          amountPaid: 0,
          status: 'pending'
        };

        const bookingResponse = await bookingsAPI.create(bookingDataForCreate);
        const booking = bookingResponse.data.booking;

        // Enregistrer les participants
        if (participants.length > 0) {
          await participantsAPI.upsert(booking.id, { participants: participants });
        }

        // Rediriger vers la confirmation
        navigate(`/client/booking-confirmation/${booking.id}`);
      }
    } catch (error) {
      console.error('Erreur création réservation:', error);
      alert(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('Chargement')}...</div>;
  }

  if (!session) {
    return <div className={styles.error}>{t('noSession')}</div>;
  }

  const total = calculateTotal();
  const discount = calculateDiscount();
  const finalPrice = calculateFinalPrice();

  const languageOptions = [
    { code: "FR", label: "🇫🇷 Français", flag: "🇫🇷" },
    { code: "EN", label: "🇬🇧 English", flag: "🇬🇧" }
  ];

  const getGuidePaymentMode = () => {
    return session?.guide?.paymentMode || 'onsite_only';
  };
  const guidePaymentMode = getGuidePaymentMode();

  return (
    <div className={styles.clientContainer}>
      {/* Styles globaux pour les focus et hover des éléments */}
      <style>
        {`
          .${styles.bookingForm} .${styles.formGroup} input:focus,
          .${styles.bookingForm} .${styles.formGroup} select:focus,
          .${styles.participantFields} .${styles.formGroup} input:focus,
          .${styles.compactFieldsGrid} .${styles.formGroup} input:focus,
          .${styles.shoeSizeInline} input:focus {
            border-color: ${clientColor} !important;
            box-shadow: 0 0 0 3px ${clientColor}20 !important;
          }
          .${styles.counterBtn}:hover:not(:disabled) {
            border-color: ${clientColor} !important;
            background: ${clientColor}15 !important;
            color: ${clientColor} !important;
          }
          .${styles.paymentOption}:hover {
            background: ${clientColor}15 !important;
            border-color: ${clientColor} !important;
          }
          .${styles.participantsForm} .${styles.participantCard}:hover {
            border-color: ${clientColor} !important;
          }
          .${styles.compactInfoBox} {
            background: ${clientColor}15 !important;
            border-left-color: ${clientColor} !important;
          }
          .${styles.infoBox} {
            background: ${clientColor}15 !important;
            border-left-color: ${clientColor} !important;
          }
          .${styles.loader} {
            border-top-color: ${clientColor} !important;
          }
        `}
      </style>
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'white',
          border: '2px solid #2c3e50',
          cursor: 'pointer',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          transition: 'all 0.2s',
          padding: 0
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          e.target.style.background = 'white';
        }}
        title="Retour"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.bookingFormContainer}>
        {/* Résumé de la session */}
        <div className={styles.bookingSummary}>
          <div className={styles.summaryCard}>
            <h3 style={{ borderBottom: `2px solid ${clientColor}` }}>{product.name}</h3>
            <div className={styles.summaryDetails}>
              <p><strong>📅 Date:</strong> {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
              <p style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                <span><strong>🕐 {t('Horaire')}:</strong> {session.timeSlot} - {session.startTime}</span>
                <span><strong>⏱️ {t('Durée')}:</strong> {product.duration / 60}h</span>
              </p>
              <p><strong>Votre guide:</strong> {session.guide.login}</p>
            </div>

            {product.images && product.images.length > 0 && (
              <img
                src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`}
                alt={product.name}
                className={styles.summaryImage}
              />
            )}
          </div>

          {/* Calcul du prix */}
          <div className={styles.priceBreakdown} data-desktop-price="true" style={{ border: `1px solid ${clientColor}20` }}>
            <h3 style={{ borderBottom: `2px solid ${clientColor}` }}>{t('priceDetail')}</h3>
            <div className={styles.priceItem}>
              <span>{formData.numberOfPeople} personne(s) × {
                // Afficher le prix individuel si voucher actif, sinon le prix de groupe si applicable
                voucherInfo ? product.priceIndividual : (
                  product.priceGroup && formData.numberOfPeople >= product.priceGroup.min
                    ? product.priceGroup.price
                    : product.priceIndividual
                )
              }€</span>
              <span>{(voucherInfo ? product.priceIndividual : (
                product.priceGroup && formData.numberOfPeople >= product.priceGroup.min
                  ? product.priceGroup.price
                  : product.priceIndividual
              )) * formData.numberOfPeople}€</span>
            </div>

            {session.shoeRentalPrice && participants.filter(p => p.shoeRental).length > 0 && (
              <div className={styles.priceItem}>
                <span>{participants.filter(p => p.shoeRental).length} {t('locaShoes')} × {session.shoeRentalPrice}€</span>
                <span>{session.shoeRentalPrice * participants.filter(p => p.shoeRental).length}€</span>
              </div>
            )}

            {voucherInfo && (
              <div className={`${styles.priceItem} ${styles.discount}`}>
                <span>{t('BonApply')} ({voucherInfo.code})</span>
                <span>-{discount.toFixed(2)}€</span>
              </div>
            )}

            <div className={`${styles.priceItem} ${styles.total}`} style={{ borderTop: `3px solid ${clientColor}` }}>
              <strong>{t('Total')}</strong>
              <strong>{voucherInfo ? finalPrice.toFixed(2) : total.toFixed(2)}€</strong>
            </div>

            {/* Affichage de l'acompte si requis */}
            {isDepositRequired() && (
              <>
                <div className={styles.depositInfo} style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f8ff', borderRadius: '8px', border: `1px solid ${clientColor}` }}>
                  <div className={styles.priceItem}>
                    <span>💳 {t("payment.depositNow")}</span>
                    <strong>{formData.payFullAmount ? (voucherInfo ? finalPrice.toFixed(2) : total.toFixed(2)) : calculateDeposit().toFixed(2)}€</strong>
                  </div>
                  {!formData.payFullAmount && (
                    <div className={styles.priceItem} style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                      <span>💵 {t("payment.balanceOnSite")}</span>
                      <span>{((voucherInfo ? finalPrice : total) - calculateDeposit()).toFixed(2)}€</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div className={styles.bookingFormSection}>
          <h2 style={{ textAlign: 'center' }}>{t('yoursInfos')}</h2>

          <form onSubmit={handleSubmit} className={styles.bookingForm}>
            <div className={styles.formGroup}>
              <label>{t('nbrPersonne')} *</label>
              <select
                value={formData.numberOfPeople}
                onChange={(e) => handleChange('numberOfPeople', parseInt(e.target.value))}
                required
              >
                {Array.from({ length: product.maxCapacity }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num} personne{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Prénom et Nom sur la même ligne */}
            <div className={styles.clientFieldsGrid}>
              <div className={styles.formGroup}>
                <label>{t('Prénom')} *</label>
                <input
                  type="text"
                  value={formData.clientFirstName}
                  onChange={(e) => handleChange('clientFirstName', e.target.value)}
                  placeholder="Jean"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('Nom')} *</label>
                <input
                  type="text"
                  value={formData.clientLastName}
                  onChange={(e) => handleChange('clientLastName', e.target.value)}
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            {/* Email et Téléphone sur la même ligne */}
            <div className={styles.clientFieldsGrid}>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleChange('clientEmail', e.target.value)}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('Téléphone')} *</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handleChange('clientPhone', e.target.value)}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Langue parlée *</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {languageOptions.map((lang) => {
                  // Mapper le code langue vers le code pays pour les drapeaux
                  const flagCode = lang.code === 'EN' ? 'gb' : 'fr';
                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleChange('clientNationality', lang.code)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: formData.clientNationality === lang.code ? `2px solid ${clientColor}` : '2px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: formData.clientNationality === lang.code ? `${clientColor}15` : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img
                        src={`https://flagcdn.com/24x18/${flagCode}.png`}
                        alt={lang.code}
                        style={{ width: '24px', height: '18px' }}
                      />
                      <span style={{ fontWeight: formData.clientNationality === lang.code ? '600' : '400' }}>
                        {lang.code === 'FR' ? 'Français' : 'English'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Formulaire participants */}
            <div className={styles.participantsSection}>
              <h3>{t('InfosPart')}</h3>
              <div style={{
                fontSize: '0.9rem',
                color: '#495057',
                marginBottom: '1rem',
                backgroundColor: isUrgent ? '#f8d7da' : '#fff3cd',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: isUrgent ? '4px solid #dc3545' : '4px solid #ffc107'
              }}>
                <p style={{ margin: 0, fontWeight: '500' }}>
                  {isUrgent ? (
                    <Trans i18nKey="participantInfo.urgent">
                      🔴 <strong>URGENT :</strong> Votre session est dans moins de 24h. Les informations de tous les participants sont <strong>obligatoires maintenant</strong>.
                    </Trans>
                  ) : (
                    <Trans i18nKey="participantInfo.required">
                      ⚠️ Ces informations sont <strong>obligatoires</strong> pour participer à l'activité.
                    </Trans>
                  )}
                </p>
                {!isUrgent && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                  <Trans i18nKey="participantInfo.later">
                    Vous pouvez les remplir maintenant ou plus tard. Votre <strong>email de confirmation</strong> contiendra un lien pour <strong>compléter ou modifier</strong> ces informations avant l'activité.
                  </Trans>
                  </p>
                )}
              </div>
              {session.shoeRentalAvailable && (
                <small className={styles.infoNote} style={{ backgroundColor: `${clientColor}15`, borderLeft: `3px solid ${clientColor}` }}>ℹ️ {t('AskLaterShoesLoc')}</small>
              )}

              {/* Bouton pour basculer l'affichage du formulaire - caché si moins de 24h */}
              {!isUrgent && (
                <button
                  type="button"
                  onClick={() => setShowParticipantsForm(!showParticipantsForm)}
                  className={styles.btnSecondary}
                  style={{ marginBottom: '1rem' }}
                >
                  {showParticipantsForm ? 'Remplir plus tard' : 'Remplir maintenant'}
                </button>
              )}

              {(showParticipantsForm || isUrgent) && (
              <div style={{ marginTop: '1rem' }}>
                {participants.map((participant, index) => (
                  <div key={index} className={styles.participantCard}>
                    <h4>Participant {index + 1}</h4>
                    <div className={styles.participantGrid}>
                      <div className={styles.formGroup}>
                        <label>{t('Prénom')}{isUrgent && ' *'}</label>
                        <input
                          type="text"
                          value={participant.firstName}
                          onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                          required={isUrgent}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Age{isUrgent && ' *'}</label>
                        <input
                          type="number"
                          value={participant.age}
                          onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                          required={isUrgent}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{t('Taille')} (cm){isUrgent && ' *'}</label>
                        <input
                          type="number"
                          value={participant.height}
                          onChange={(e) => handleParticipantChange(index, 'height', e.target.value)}
                          required={isUrgent}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{t('Poids')} (kg){isUrgent && ' *'}</label>
                        <input
                          type="number"
                          value={participant.weight}
                          onChange={(e) => handleParticipantChange(index, 'weight', e.target.value)}
                          required={isUrgent}
                        />
                      </div>
                    </div>

                    

                    {/* Location de chaussures */}
                    {session.shoeRentalAvailable && (
                      <div className={styles.shoeRentalSection} style={{ backgroundColor: participant.shoeRental ? `${clientColor}10` : 'white', borderColor: participant.shoeRental ? clientColor : '#dee2e6' }}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={participant.shoeRental}
                            onChange={(e) => handleParticipantChange(index, 'shoeRental', e.target.checked)}
                          />
                          {t('LocShoes')} (+{session.shoeRentalPrice}€)
                        </label>

                        {participant.shoeRental && (
                          <div className={styles.formGroup}>
                            <label>{t('Pointure')}{isUrgent && ' *'}</label>
                            <input
                              type="number"
                              value={participant.shoeSize}
                              required={isUrgent}
                              onChange={(e) => handleParticipantChange(index, 'shoeSize', e.target.value)}
                              placeholder="Ex: 42"
                              min="20"
                              max="50"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Bon cadeau */}
            <div className={styles.voucherSection}>
              <label>{t('GiftDiscount')}</label>
              <div className={styles.voucherInput}>
                <input
                  type="text"
                  value={formData.voucherCode}
                  onChange={(e) => handleChange('voucherCode', e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                />
                <button type="button" onClick={handleVerifyVoucher} className={styles.btnSecondary}>
                  {t('Vérifier')}
                </button>
              </div>
              {voucherError && <p className={styles.error}>{voucherError}</p>}
              {voucherInfo && (
                <p className={styles.success}>
                  {voucherInfo.type === 'promo' ? '🎉 Code promo valide' : '🎁 Bon cadeau valide'} :
                  {voucherInfo.discountType === 'percentage'
                    ? ` ${voucherInfo.amount}% de réduction`
                    : ` ${voucherInfo.amount}€ de réduction`}
                  {voucherInfo.type === 'promo' && voucherInfo.maxUsages && (
                  <span>
                    ({t("voucher.remainingUses", {
                      count: voucherInfo.maxUsages - voucherInfo.usageCount
                    })})
                  </span>
                  )}
                </p>
              )}
            </div>

            {/* Calcul du prix - Version mobile uniquement */}
            <div className={styles.priceBreakdown} data-mobile-price="true" style={{ border: `1px solid ${clientColor}20` }}>
              <h3 style={{ borderBottom: `2px solid ${clientColor}` }}>{t('priceDetail')}</h3>
              <div className={styles.priceItem}>
                <span>{formData.numberOfPeople} personne(s) × {
                  product.priceGroup && formData.numberOfPeople >= product.priceGroup.min
                    ? product.priceGroup.price
                    : product.priceIndividual
                }€</span>
                <span>{(product.priceGroup && formData.numberOfPeople >= product.priceGroup.min
                  ? product.priceGroup.price
                  : product.priceIndividual) * formData.numberOfPeople}€</span>
              </div>

              {session.shoeRentalPrice && participants.filter(p => p.shoeRental).length > 0 && (
                <div className={styles.priceItem}>
                  <span>{participants.filter(p => p.shoeRental).length} {t('locaShoes')} × {session.shoeRentalPrice}€</span>
                  <span>{session.shoeRentalPrice * participants.filter(p => p.shoeRental).length}€</span>
                </div>
              )}

              {voucherInfo && (
                <>
                  <div className={`${styles.priceItem} ${styles.discount}`}>
                    <span>{t('BonApply')} ({voucherInfo.code})</span>
                    <span>-{discount.toFixed(2)}€</span>
                  </div>
                  <div className={`${styles.priceItem} ${styles.total}`} style={{ borderTop: `3px solid ${clientColor}` }}>
                    <strong>{t('Total')}</strong>
                    <strong>{finalPrice.toFixed(2)}€</strong>
                  </div>
                </>
              )}

              {!voucherInfo && (
                <div className={`${styles.priceItem} ${styles.total}`} style={{ borderTop: `3px solid ${clientColor}` }}>
                  <strong>{t('Total')}</strong>
                  <strong>{total.toFixed(2)}€</strong>
                </div>
              )}

              {/* Affichage de l'acompte si requis */}
              {isDepositRequired() && (
                <>
                  <div className={styles.depositInfo} style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f8ff', borderRadius: '8px', border: `1px solid ${clientColor}` }}>
                    <div className={styles.priceItem}>
                      <span>💳 {t('payment.depositNow')}</span>
                      <strong>{formData.payFullAmount ? (voucherInfo ? finalPrice.toFixed(2) : total.toFixed(2)) : calculateDeposit().toFixed(2)}€</strong>
                    </div>
                    {!formData.payFullAmount && (
                      <div className={styles.priceItem} style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                        <span>💵 {t('payment.balanceOnSite')}</span>
                        <span>{((voucherInfo ? finalPrice : total) - calculateDeposit()).toFixed(2)}€</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Option de paiement de la totalité si acompte requis */}
            {modePayment === 'deposit_and_full' && (
              <div className={styles.payFullAmountSection} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.payFullAmount}
                    onChange={(e) => handleChange('payFullAmount', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong>💰 {t('payment.PaidTotalNow')}</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                      {t("payment.fullOption", {
                        deposit: calculateDeposit().toFixed(2),
                        total: (voucherInfo ? finalPrice : total).toFixed(2)
                      })}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Mode de paiement */}
            <div className={styles.paymentMethodSection}>
              <h3>{t('PaymentMode')}</h3>

              {guidePaymentMode === 'deposit_only' || guidePaymentMode === 'deposit_and_full' ? (
                /* Si acompte requis : toujours passer par Stripe pour l'acompte */
                <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#856404' }}>
                    💳 {t("payment.cardRequired")}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#856404' }}>
                    {formData.payFullAmount
                      ? t("payment.fullNow", {
                          amount: calculateAmountToPay().toFixed(2)
                        })
                      : t("payment.depositNowLong", {
                          deposit: calculateDeposit().toFixed(2),
                          balance: ((voucherInfo ? finalPrice : total) - calculateDeposit()).toFixed(2)
                        })
                    }
                  </p>
                </div>
              ) : guidePaymentMode === 'full_only' ? (
                 // 💳 Paiement total obligatoire
                <div style={{ padding: '1rem', backgroundColor: '#e2f0d9', borderRadius: '8px', border: '1px solid #a3d9a5' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#2f6627' }}>
                    💳 {t("payment.onlineRequired")}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#2f6627' }}>
                    {t("payment.fullAmountNow", {
                      amount: calculateAmountToPay().toFixed(2)
                    })}
                  </p>
                </div>
              ) : guidePaymentMode === 'full_or_later' ? (
                /* Si pas d'acompte : choix normal entre sur place et en ligne */
                <div className={styles.paymentOptions}>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="onsite"
                      checked={formData.paymentMethod === 'onsite'}
                      onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    />
                    <div>
                      <strong>{t('payOnPlace')}</strong>
                      <p>{t("payment.onSite")}</p>
                    </div>
                  </label>

                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    />
                    <div>
                      <strong>{t('payNow')}</strong>
                      <p>{t('cbPay')}</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className={styles.paymentOptions}>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="onsite"
                      checked={formData.paymentMethod === 'onsite'}
                      onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    />
                    <div>
                      <strong>{t('payOnPlace')}</strong>
                      <p>{t("payment.onSite")}</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Acceptation des conditions de confidentialité et newsletter */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.acceptNewsletterTerms}
                  onChange={(e) => handleChange('acceptNewsletterTerms', e.target.checked)}
                  required
                  style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                  <span>
                    <Trans i18nKey="consent.newsletter">
                      J'accepte les
                      <a
                        href={session.guide.confidentialityPolicy}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: clientColor, textDecoration: 'underline' }}
                      >
                        conditions de confidentialité
                      </a>{' '}
                      et souhaite recevoir la newsletter avec les actualités et offres spéciales. *
                  </Trans>
                  </span>
                </div>
              </label>
            </div>

            {/* Bouton de soumission */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={styles.btnSecondary}
                disabled={submitting}
              >
                {t('Retour')}
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                style={{ backgroundColor: clientColor, borderColor: clientColor }}
                disabled={submitting}
              >
                {submitting ? t('Traitement...') : (
                  isDepositRequired() || formData.paymentMethod === 'online'
                    ? `${t('Payer')} ${calculateAmountToPay().toFixed(2)}€`
                    : t('comfirmResa')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
