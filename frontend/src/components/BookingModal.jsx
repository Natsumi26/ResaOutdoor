import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingsAPI, emailAPI, stripeAPI, participantsAPI } from '../services/api';
import ParticipantForm from './ParticipantForm';
import MoveBookingModal from './MoveBookingModal';
import styles from './BookingModal.module.css';

const BookingModal = ({ bookingId, onClose, onUpdate }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CB',
    notes: ''
  });
  const [showClientRequest, setShowClientRequest] = useState(false);
  const [clientRequestText, setClientRequestText] = useState('');
  const [showActivityEmail, setShowActivityEmail] = useState(false);
  const [activityEmailText, setActivityEmailText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(0);
  const [discountType, setDiscountType] = useState('none'); // 'none', 'percentage', 'amount'
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [editedClientData, setEditedClientData] = useState({
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    clientNationality: '',
    numberOfPeople: 0,
    totalPrice: 0
  });

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getById(bookingId);
      setBooking(response.data.booking);
      // Initialiser les données d'édition
      setEditedClientData({
        clientFirstName: response.data.booking.clientFirstName || '',
        clientLastName: response.data.booking.clientLastName || '',
        clientEmail: response.data.booking.clientEmail || '',
        clientPhone: response.data.booking.clientPhone || '',
        clientNationality: response.data.booking.clientNationality || '',
        numberOfPeople: response.data.booking.numberOfPeople || 0,
        totalPrice: response.data.booking.totalPrice || 0
      });

      // Charger les participants
      await loadParticipants();
      // Charger les notes
      await loadNotes();
    } catch (error) {
      console.error('Erreur chargement réservation:', error);
      alert('Impossible de charger la réservation');
    } finally {
      setLoading(false);
    }
  };
console.log('Booking data:', booking);
  if (booking?.reseller) {
    console.log('Reseller data:', booking.reseller);
    console.log('Reseller website:', booking.reseller.website);
  }
  const loadParticipants = async () => {
    try {
      const response = await participantsAPI.getByBooking(bookingId);
      setParticipants(response.data.participants);
    } catch (error) {
      console.error('Erreur chargement participants:', error);
      // Ne pas afficher d'erreur si aucun participant n'existe
    }
  };

  const loadNotes = async () => {
    try {
      const response = await bookingsAPI.getNotes(bookingId);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Erreur chargement notes:', error);
      setNotes([]);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert('Veuillez saisir une note');
      return;
    }

    try {
      if (editingNoteId) {
        // Modifier une note existante
        await bookingsAPI.updateNote(bookingId, editingNoteId, { content: noteText });
        alert('Note modifiée avec succès !');
      } else {
        // Ajouter une nouvelle note
        await bookingsAPI.addNote(bookingId, { content: noteText });
        alert('Note ajoutée avec succès !');
      }

      setNoteText('');
      setEditingNoteId(null);
      setShowNoteForm(false);
      await loadNotes();
    } catch (error) {
      console.error('Erreur sauvegarde note:', error);
      alert('Impossible de sauvegarder la note: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditNote = (note) => {
    setNoteText(note.content);
    setEditingNoteId(note.id);
    setShowNoteForm(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) return;

    try {
      await bookingsAPI.deleteNote(bookingId, noteId);
      alert('Note supprimée avec succès !');
      await loadNotes();
    } catch (error) {
      console.error('Erreur suppression note:', error);
      alert('Impossible de supprimer la note: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelNote = () => {
    setNoteText('');
    setEditingNoteId(null);
    setShowNoteForm(false);
  };
  const handleSaveParticipants = async (data) => {
    try {
      await participantsAPI.upsert(bookingId, {
        participants: data.participants,
        shoeRentalTotal: data.shoeRentalTotal,
        totalWithShoes: data.totalWithShoes
      });
      alert('Participants enregistrés avec succès !');
      setShowParticipantForm(false);
      await loadParticipants();
      await loadBooking(); // Recharger pour mettre à jour le prix si location de chaussures
      onUpdate?.();
    } catch (error) {
      console.error('Erreur sauvegarde participants:', error);
      alert('Impossible d\'enregistrer les participants: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    // Réinitialiser avec les données actuelles
    setEditedClientData({
      clientFirstName: booking.clientFirstName || '',
      clientLastName: booking.clientLastName || '',
      clientEmail: booking.clientEmail || '',
      clientPhone: booking.clientPhone || '',
      clientNationality: booking.clientNationality || '',
      numberOfPeople: booking.numberOfPeople || 0,
      totalPrice: booking.totalPrice || 0
    });
  };

  const handleEditPrice = () => {
    setEditedPrice(booking.totalPrice);
    setDiscountType('none');
    setDiscountValue(0);
    setIsEditingPrice(true);
  };

  const handleCancelPriceEdit = () => {
    setIsEditingPrice(false);
    setEditedPrice(0);
    setDiscountType('none');
    setDiscountValue(0);
  };

  const calculateFinalPrice = () => {
    const basePrice = booking.totalPrice;

    if (discountType === 'percentage') {
      return basePrice * (1 - discountValue / 100);
    } else if (discountType === 'amount') {
      return basePrice - discountValue;
    }

    return editedPrice;
  };

  const handleApplyDiscount = () => {
    const finalPrice = calculateFinalPrice();
    setEditedPrice(parseFloat(finalPrice.toFixed(2)));
    setDiscountType('none');
    setDiscountValue(0);
  };

  const handleNumberOfPeopleChange = (newNumberOfPeople) => {
    // Calculer le prix unitaire actuel
    const unitPrice = booking.totalPrice / booking.numberOfPeople;
    // Calculer le nouveau prix total
    const newTotalPrice = unitPrice * newNumberOfPeople;

    setEditedClientData({
      ...editedClientData,
      numberOfPeople: newNumberOfPeople,
      totalPrice: parseFloat(newTotalPrice.toFixed(2))
    });
  };

  const handleSavePrice = async () => {
    try {
      await bookingsAPI.update(bookingId, { totalPrice: editedPrice });
      alert('Prix mis à jour avec succès !');
      setIsEditingPrice(false);
      await loadBooking();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur mise à jour prix:', error);
      alert('Impossible de mettre à jour le prix: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveClient = async () => {
    try {
      await bookingsAPI.update(bookingId, editedClientData);
      alert('Informations mises à jour avec succès !');
      setShowEditModal(false);
      await loadBooking();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur mise à jour réservation:', error);
      alert('Impossible de mettre à jour les informations: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await bookingsAPI.addPayment(bookingId, paymentData);
      setShowPaymentForm(false);
      setPaymentData({ amount: '', method: 'CB', notes: '' });
      loadBooking();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur ajout paiement:', error);
      alert('Impossible d\'ajouter le paiement: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteBooking = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.')) return;

    try {
      await bookingsAPI.delete(bookingId);
      onUpdate?.();
      onClose();
      alert('Réservation supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Impossible de supprimer la réservation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendEmail = async () => {
    try {
      await emailAPI.sendBookingConfirmation(bookingId);
      alert('Email de confirmation envoyé avec succès !');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePayWithStripe = async () => {
    try {
      const remainingAmount = booking.totalPrice - booking.amountPaid;

      if (remainingAmount <= 0) {
        alert('Cette réservation est déjà entièrement payée !');
        return;
      }

      // Créer une session Stripe
      const response = await stripeAPI.createCheckoutSession({
        bookingId: booking.id,
        amount: remainingAmount
      });

      // Rediriger vers Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erreur création session Stripe:', error);
      alert('Impossible de créer la session de paiement: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendClientRequest = async () => {
    try {
      await emailAPI.sendCustomEmail({
        bookingId: bookingId,
        to: booking.clientEmail,
        subject: 'Demande d\'information - Votre réservation',
        content: clientRequestText
      });
      alert('Email envoyé avec succès au client !');
      setShowClientRequest(false);
    } catch (error) {
      console.error('Erreur envoi email client:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendActivityEmail = async () => {
    try {
      await emailAPI.sendCustomEmail({
        bookingId: bookingId,
        to: booking.clientEmail,
        subject: 'Informations sur votre activité',
        content: activityEmailText
      });
      alert('Email envoyé avec succès au client !');
      setShowActivityEmail(false);
      handleMarkProductDetailsSent()
    } catch (error) {
      console.error('Erreur envoi email activité:', error);
      alert('Impossible d\'envoyer l\'email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMarkProductDetailsSent = async () => {
    try {
      await bookingsAPI.markProductDetailsSent(bookingId);
      alert('Détails du produit marqués comme envoyés !');
      await loadBooking();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur marquage détails produit:', error);
      alert('Impossible de marquer les détails comme envoyés: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateActivityEmailTemplate = () => {
    const unitPrice = booking.totalPrice / booking.numberOfPeople;
    return `Bonjour ${booking.clientFirstName} ${booking.clientLastName},<br><br>

Voici les informations concernant votre activité :<br><br>

Activité : ${booking.product?.name || 'N/A'}<br>
Date : ${format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr })}<br>
Horaire : ${session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} - ${session.startTime}<br>
Nombre de personnes : ${booking.numberOfPeople}<br>
Prix unitaire : ${unitPrice.toFixed(2)}€ par personne<br>
Prix total : ${booking.totalPrice}€<br><br><br>


Nous vous attendons avec plaisir !
À très bientôt pour cette aventure inoubliable !<br>
L'équipe Canyon Life 🌊<br><br>

<small style="color:gray;">
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
</small>
`;
  };

const generateAskEmailTemplate = () => {
    const formattedDate = format(new Date(booking.session.date), 'EEEE dd MMMM yyyy', { locale: fr });
    return `
    Bonjour ${booking.clientFirstName} ${booking.clientLastName},<br><br>

Suite à votre réservation du ${formattedDate} ${booking.session.startTime} pour le canyon ${booking.product.name},
veuillez compléter le formulaire des participants  :<br>
<a href="https://canyonlife.fr/client/my-booking/${booking.id}" target="_blank" style="color:#007bff;">
Ma réservation</a><br><br>

À très bientôt pour cette aventure inoubliable !<br>
L'équipe Canyon Life 🌊<br><br>

<small style="color:gray;">
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
</small>
`;

  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const { session, payments = [], history = [] } = booking;
  const remainingAmount = booking.totalPrice - booking.amountPaid;
  const paymentPercentage = (booking.amountPaid / booking.totalPrice) * 100;

  // Vérifier s'il reste des tâches à faire
  const hasPendingTasks = !booking.participantsFormCompleted || !booking.productDetailsSent;

  // Fonction pour formater le numéro de téléphone
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Supprimer tous les espaces et caractères spéciaux
    const cleaned = phone.replace(/\D/g, '');

    // Si le numéro commence par 0, le remplacer par +33
    let formatted = cleaned;
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      formatted = '33' + cleaned.substring(1);
    } else if (!cleaned.startsWith('33')) {
      formatted = '33' + cleaned;
    }

    // Formater : +33 06 88 78 81 86
    if (formatted.startsWith('33') && formatted.length >= 11) {
      return `+${formatted.substring(0, 2)} ${formatted.substring(2, 3)} ${formatted.substring(3, 5)} ${formatted.substring(5, 7)} ${formatted.substring(7, 9)} ${formatted.substring(9, 11)}`;
    }

    return phone; // Retourner le numéro original si le format n'est pas reconnu
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header avec infos client - couleur selon tâches */}
        <div className={`${styles.header} ${hasPendingTasks ? styles.headerPending : styles.headerComplete}`}>
          <div className={styles.headerLeft}>
            <div className={`${styles.clientBadge} ${hasPendingTasks ? styles.badgePending : styles.badgeComplete}`}>
              <span className={styles.clientNumber}>{booking.numberOfPeople}</span>
            </div>
            <div className={styles.clientInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 className={styles.clientName}>
                  {booking.clientLastName.toUpperCase()}
                </h2>
                {booking.reseller && booking.reseller.website && (
                  <a
                    href={booking.reseller.website.startsWith('http') ? booking.reseller.website : `https://${booking.reseller.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resellerBadge}
                    style={{ textDecoration: 'none', cursor: 'pointer' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Clicked on reseller badge!');
                      console.log('Website URL:', booking.reseller.website);
                    }}
                  >
                    via {booking.reseller.name}
                  </a>
                )}
                {booking.reseller && !booking.reseller.website && (
                  <span className={styles.resellerBadge}>
                    via {booking.reseller.name}
                  </span>
                )}
              </div>
              <p className={styles.clientFirstName}>{booking.clientFirstName}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.contactWrapper}>
              <div className={styles.contactInfo}>
                <a href={`tel:${booking.clientPhone.replace(/\s/g, '')}`} className={styles.phoneNumber}>
                  {booking.clientNationality && (
                    <img
                      src={`https://flagcdn.com/24x18/${booking.clientNationality.toLowerCase()}.png`}
                      alt={booking.clientNationality}
                      className={styles.flagImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {formatPhoneNumber(booking.clientPhone)}
                </a>
                <a href={`mailto:${booking.clientEmail}`} className={styles.emailLink}>
                  {booking.clientEmail}
                </a>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
          </div>
        </div>

        {/* Content - Structure en 2 colonnes */}
        <div className={styles.content}>
          {/* Colonne gauche */}
          <div className={styles.leftColumn}>
            {/* Bloc 1 - Rotation - Tableau 2 lignes */}
            <div className={styles.blockRotationTable}>
              {/* Ligne 1 : Header coloré */}
              <div className={styles.rotationHeader}>
                <div className={styles.rotationHeaderLeft}>
                  <span className={styles.blockIcon}>✓</span>
                  <span className={styles.blockTitle}>Rotation</span>
                </div>
                <button className={styles.btnRotation} onClick={() => setShowMoveModal(true)}>
                  Déplacer cette réservation
                </button>
              </div>
              {/* Ligne 2 : Contenu blanc/grisé */}
              <div className={styles.rotationContent}>
                <span className={styles.rotationActivity}>{booking.product?.name || 'N/A'}</span>
                <span className={styles.rotationDate}>
                  — {format(new Date(session.date), 'EEEE dd/MM/yy', { locale: fr })} ({session.startTime})
                </span>
              </div>
            </div>

          {/* Bloc 2 - Infos de groupe - Tableau 2 lignes */}
          <div className={styles.blockGroupInfoTable}>
            {/* Ligne 1 : Header coloré (jaune ou vert) */}
            <div className={`${styles.groupInfoHeader} ${booking.participantsFormCompleted ? styles.groupComplete : styles.groupIncomplete}`}>
              <span className={styles.blockIcon}>{booking.participantsFormCompleted ? '✓' : '⚠'}</span>
              <span className={styles.blockTitle}>Infos de groupe {booking.participantsFormCompleted ? 'complètes' : 'incomplètes'}</span>
            </div>

            {/* Ligne 2 : Contenu blanc/grisé - 2 colonnes */}
            <div className={styles.groupInfoContent}>
              {!booking.participantsFormCompleted ? (
                <>
                  <div className={styles.groupInfoText}>
                    <p>Demandez au client de renseigner lui-même les infos de son groupe.</p>
                  </div>
                  <div className={styles.groupInfoButtons}>
                    <button
                      className={styles.btnBlue}
                      onClick={() => {
                        setClientRequestText(generateAskEmailTemplate());
                        setShowClientRequest(!showClientRequest);
                      }}
                    >
                      ⚡ Demander au client
                    </button>
                    <button
                      className={styles.btnGray}
                      onClick={() => setShowParticipantForm(true)}
                    >
                      Saisir à la main
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.groupInfoButtonsFull}>
                  <button
                    className={styles.btnBlue}
                    onClick={() => setShowParticipantForm(true)}
                  >
                    📋 Voir le formulaire
                  </button>
                </div>
              )}
            </div>

            {/* Formulaire demande client */}
            {showClientRequest && (
              <div className={styles.emailForm}>
                <label className={styles.label}>Message à envoyer au client</label>
                <textarea
                  className={styles.textarea}
                  value={clientRequestText}
                  onChange={(e) => setClientRequestText(e.target.value)}
                  rows={10}
                />
                <div className={styles.formActions}>
                  <button className={styles.btnBlue} onClick={handleSendClientRequest}>
                    📧 Envoyer
                  </button>
                  <button
                    className={styles.btnGray}
                    onClick={() => setShowClientRequest(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Participant Form */}
          {showParticipantForm && (
            <div className={styles.participantFormOverlay}>
              <ParticipantForm
                booking={booking}
                shoeRentalAvailable={booking.session?.shoeRentalAvailable}
                shoeRentalPrice={booking.session?.shoeRentalPrice}
                initialParticipants={participants}
                onSubmit={handleSaveParticipants}
                onCancel={() => setShowParticipantForm(false)}
              />
            </div>
          )}

          {/* Bloc 3 - Détails de l'activité - Tableau 2 lignes */}
          <div className={styles.blockActivityTable}>
            {/* Ligne 1 : Header coloré (jaune ou vert) */}
            <div className={`${styles.activityHeader} ${booking.productDetailsSent ? styles.activityComplete : styles.activityIncomplete}`}>
              <span className={styles.blockIcon}>{booking.productDetailsSent ? '✓' : '○'}</span>
              <span className={styles.blockTitle}>Détails de l'activité {booking.productDetailsSent ? 'envoyés' : 'non envoyés'}</span>
              {!booking.productDetailsSent && (
                <span
                  className={styles.quickValidateIcon}
                  onClick={handleMarkProductDetailsSent}
                  title="Marquer comme envoyé"
                >
                  ✅
                </span>
              )}
            </div>

            {/* Ligne 2 : Contenu blanc/grisé - 2 colonnes */}
            <div className={styles.activityContent}>
              <div className={styles.activityText}>
                <p>Envoyez un email récapitulatif de l'activité au client. Vous pouvez y ajouter un message personnalisé.</p>
              </div>
              <div className={styles.activityButtons}>
                <button
                  className={styles.btnBlue}
                  onClick={() => {
                    setActivityEmailText(generateActivityEmailTemplate());
                    setShowActivityEmail(!showActivityEmail);
                  }}
                >
                  📧 Envoyer par email
                </button>
                <button className={styles.btnText} onClick={() => setShowActivityEmail(!showActivityEmail)}>
                  Ajouter un message
                </button>
              </div>
            </div>

            {/* Formulaire email activité */}
            {showActivityEmail && (
              <div className={styles.emailForm}>
                <label className={styles.label}>Email à envoyer au client (modifiable)</label>
                <textarea
                  className={styles.textarea}
                  value={activityEmailText}
                  onChange={(e) => setActivityEmailText(e.target.value)}
                  rows={10}
                />
                <div className={styles.formActions}>
                  <button className={styles.btnBlue} onClick={handleSendActivityEmail}>
                    📧 Envoyer
                  </button>
                  <button
                    className={styles.btnGray}
                    onClick={() => setShowActivityEmail(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* Bloc 4 - Tarif (BLANC/BLEU CLAIR) */}
            <div className={styles.blockPricing}>
              <div className={styles.blockHeader}>
                <span className={styles.blockIcon}>💵</span>
                <span className={styles.blockTitle}>Tarif</span>
                {!isEditingPrice && (
                  <button className={styles.btnModify} onClick={handleEditPrice}>
                    Modifier
                  </button>
                )}
              </div>

              <table className={styles.pricingTable}>
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Prix</th>
                    <th>Quantité</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Par personne</td>
                    <td>{(() => {
                      // Calculer le coût total des chaussures
                      const shoeCount = participants.filter(p => p.shoeRental).length;
                      const shoesTotalCost = shoeCount * (booking.session?.shoeRentalPrice || 0);
                      // Prix de l'activité sans chaussures
                      const activityPrice = booking.totalPrice - shoesTotalCost;
                      const pricePerPerson = activityPrice / booking.numberOfPeople;
                      return pricePerPerson.toFixed(2);
                    })()} €</td>
                    <td>{booking.numberOfPeople}</td>
                    <td>{(() => {
                      const shoeCount = participants.filter(p => p.shoeRental).length;
                      const shoesTotalCost = shoeCount * (booking.session?.shoeRentalPrice || 0);
                      const activityPrice = booking.totalPrice - shoesTotalCost;
                      return activityPrice.toFixed(2);
                    })()} €</td>
                  </tr>
                  {participants && participants.length > 0 && participants.some(p => p.shoeRental) && (
                    <tr>
                      <td>Location de chaussures</td>
                      <td>{(booking.session?.shoeRentalPrice || 5).toFixed(2)} €</td>
                      <td>{participants.filter(p => p.shoeRental).length}</td>
                      <td>{(() => {
                        const shoeCount = participants.filter(p => p.shoeRental).length;
                        const shoesTotalCost = shoeCount * (booking.session?.shoeRentalPrice || 0);
                        return shoesTotalCost.toFixed(2);
                      })()} €</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {isEditingPrice ? (
                <div className={styles.editPriceForm}>
                  <div className={styles.priceOriginal}>
                    <span>Prix actuel :</span>
                    <strong>{booking.totalPrice} €</strong>
                  </div>

                  <div className={styles.discountSection}>
                    <label>Appliquer une réduction</label>
                    <div className={styles.discountControls}>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className={styles.discountTypeSelect}
                      >
                        <option value="none">Pas de réduction</option>
                        <option value="percentage">Réduction en %</option>
                        <option value="amount">Réduction en €</option>
                      </select>

                      {discountType !== 'none' && (
                        <>
                          <input
                            type="number"
                            step={discountType === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={discountType === 'percentage' ? '100' : booking.totalPrice}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                            placeholder={discountType === 'percentage' ? '%' : '€'}
                            className={styles.discountInput}
                          />
                          <button
                            className={styles.btnApplyDiscount}
                            onClick={handleApplyDiscount}
                            type="button"
                          >
                            Appliquer
                          </button>
                        </>
                      )}
                    </div>

                    {discountType !== 'none' && discountValue > 0 && (
                      <div className={styles.discountPreview}>
                        <span>Nouveau prix : </span>
                        <strong>{calculateFinalPrice().toFixed(2)} €</strong>
                        <span className={styles.discountAmount}>
                          (-{discountType === 'percentage'
                            ? `${discountValue}%`
                            : `${discountValue.toFixed(2)}€`})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Prix final (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button className={styles.btnBlue} onClick={handleSavePrice}>
                      Enregistrer
                    </button>
                    <button className={styles.btnGray} onClick={handleCancelPriceEdit}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.totalPrice}>
                  <span>Total :</span>
                  <span className={styles.totalValue}>{booking.totalPrice} €</span>
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div className={styles.rightColumn}>
            {/* Bloc Paiements - Tableau 3 lignes (VIOLET) */}
          <div className={styles.blockPaymentsTable}>
            {/* Ligne 1 : Header violet avec titre et bouton */}
            <div className={styles.paymentsHeader}>
              <span className={styles.blockIcon}>💳</span>
              <span className={styles.blockTitle}>Paiements</span>
              <button className={styles.btnViewPaymentsNew} onClick={() => alert('Voir les paiements (à implémenter)')}>
                Voir les paiements
              </button>
            </div>

            {/* Ligne 2 : Tableau 2 colonnes avec bordures grises */}
            <div className={styles.paymentsAmountsRow}>
              <div className={styles.paymentColumn}>
                <span className={styles.paymentLabelNew}>Encaissé</span>
                <span className={styles.paymentValueNew}>{booking.amountPaid} €</span>
              </div>
              <div className={styles.paymentColumn}>
                <span className={styles.paymentLabelNew}>Reste à régler</span>
                <span className={styles.paymentValueNew}>{remainingAmount} €</span>
              </div>
            </div>

            {/* Ligne 3 : Bouton nouvel encaissement */}
            <button
              className={styles.btnNewPayment}
              onClick={() => setShowPaymentForm(!showPaymentForm)}
            >
              + Nouvel encaissement
            </button>

            {/* Formulaire paiement (en dehors du tableau) */}
            {showPaymentForm && (
              <form className={styles.paymentForm} onSubmit={handleAddPayment}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Montant (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      required
                      placeholder={`Reste: ${remainingAmount}€`}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Méthode</label>
                    <select
                      value={paymentData.method}
                      onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                    >
                      <option value="CB">Carte Bancaire</option>
                      <option value="espèces">Espèces</option>
                      <option value="virement">Virement</option>
                      <option value="stripe">Stripe</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Notes (optionnel)</label>
                  <input
                    type="text"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    placeholder="Commentaire..."
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnBlue}>
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    className={styles.btnGray}
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Bouton Stripe pour paiement */}
            {remainingAmount > 0 && booking.status !== 'cancelled' && (
              <button className={styles.btnStripe} onClick={handlePayWithStripe}>
                💳 Demander un paiement Stripe
              </button>
            )}
          </div>

            {/* Bloc Notes (BLANC) */}
            {notes.length === 0 && !showNoteForm ? (
              <div className={styles.blockNotesCompact}>
                <span className={styles.blockIcon}>📝</span>
                <span className={styles.blockTitle}>Note</span>
                <button className={styles.btnAdd} onClick={() => setShowNoteForm(true)}>
                  Ajouter
                </button>
              </div>
            ) : (
              <div className={styles.blockNotes}>
                <div className={styles.blockHeader}>
                  <span className={styles.blockIcon}>📝</span>
                  <span className={styles.blockTitle}>Notes ({notes.length})</span>
                  <button className={styles.btnAdd} onClick={() => setShowNoteForm(true)}>
                    + Ajouter
                  </button>
                </div>

                {/* Liste des notes */}
                {notes.map((note) => (
                  <div key={note.id} className={styles.noteItem}>
                    <div className={styles.noteContent}>{note.content}</div>
                    <div className={styles.noteActions}>
                      <button className={styles.btnEditNote} onClick={() => handleEditNote(note)}>
                        ✏️
                      </button>
                      <button className={styles.btnDeleteNote} onClick={() => handleDeleteNote(note.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'ajout/modification de note */}
            {showNoteForm && (
              <div className={styles.noteFormOverlay}>
                <div className={styles.noteForm}>
                  <h3>{editingNoteId ? 'Modifier la note' : 'Ajouter une note'}</h3>
                  <textarea
                    className={styles.noteTextarea}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Saisir votre note..."
                    rows={5}
                    autoFocus
                  />
                  <div className={styles.noteFormActions}>
                    <button className={styles.btnBlue} onClick={handleAddNote}>
                      {editingNoteId ? 'Modifier' : 'Ajouter'}
                    </button>
                    <button className={styles.btnGray} onClick={handleCancelNote}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liens texte pour actions */}
            <div className={styles.bookingActions}>
              <span className={styles.linkModify} onClick={handleOpenEditModal}>
                <span className={styles.emojiBlue}>✏️</span> Modifier la réservation
              </span>
              <span className={styles.linkDelete} onClick={handleDeleteBooking}>
                <span className={styles.emojiRed}>🗑️</span> Supprimer la réservation
              </span>
            </div>
          </div>

          {/* Modal de déplacement de réservation */}
          {showMoveModal && (
            <MoveBookingModal
              booking={booking}
              onClose={() => setShowMoveModal(false)}
              onSuccess={() => {
                loadBooking();
                onUpdate?.();
              }}
            />
          )}

          {/* Modal d'édition de réservation */}
          {showEditModal && (
            <div className={styles.editModalOverlay}>
              <div className={styles.editModalContent}>
                <h3>Modifier la réservation</h3>
                <div className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={editedClientData.clientFirstName}
                      onChange={(e) => setEditedClientData({...editedClientData, clientFirstName: e.target.value})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nom</label>
                    <input
                      type="text"
                      value={editedClientData.clientLastName}
                      onChange={(e) => setEditedClientData({...editedClientData, clientLastName: e.target.value})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={editedClientData.clientEmail}
                      onChange={(e) => setEditedClientData({...editedClientData, clientEmail: e.target.value})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Téléphone</label>
                    <input
                      type="tel"
                      value={editedClientData.clientPhone}
                      onChange={(e) => setEditedClientData({...editedClientData, clientPhone: e.target.value})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nationalité (code pays, ex: FR)</label>
                    <input
                      type="text"
                      value={editedClientData.clientNationality}
                      onChange={(e) => setEditedClientData({...editedClientData, clientNationality: e.target.value})}
                      maxLength={2}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nombre de personnes</label>
                    <input
                      type="number"
                      min="1"
                      value={editedClientData.numberOfPeople}
                      onChange={(e) => handleNumberOfPeopleChange(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Prix total (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedClientData.totalPrice}
                      onChange={(e) => setEditedClientData({...editedClientData, totalPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.btnBlue} onClick={handleSaveClient}>
                      Enregistrer
                    </button>
                    <button className={styles.btnGray} onClick={handleCloseEditModal}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bloc Historique pleine largeur en bas */}
          <div className={styles.fullWidthSection}>
          {/* Bloc Historique (GRIS CLAIR) */}
          <div className={styles.blockHistory}>
            <div className={styles.blockHeader}>
              <span className={styles.blockIcon}>🕐</span>
              <span className={styles.blockTitle}>Historique de la réservation</span>
            </div>
            <div className={styles.historyList}>
              {history.length === 0 ? (
                <div className={styles.emptyState}>Aucun historique disponible</div>
              ) : (
                history.slice(0, 5).map((item) => (
                  <div key={item.id} className={styles.historyItem}>
                    <span className={styles.historyTime}>
                      {format(new Date(item.createdAt), 'HH:mm', { locale: fr })}
                    </span>
                    <span className={styles.historyIcon}>✏️</span>
                    <div className={styles.historyContent}>
                      <span className={styles.historyAction}>{item.action}</span>
                      {item.details && <span className={styles.historyDetails}>{item.details}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Fin de .content */}
      </div>

      </div>
    </div>
  );
};

export default BookingModal;
