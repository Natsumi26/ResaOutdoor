import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateWetsuitSizeByBrand, DEFAULT_ACTIVITY_CONFIGS } from '../utils/wetsuitSizeCharts.js';

// Fonction utilitaire pour récupérer la config d'une activité pour un guide
const getActivityConfig = async (activityTypeId, userId) => {
  // Chercher la config personnalisée
  const customConfig = await prisma.activityFormConfig.findUnique({
    where: {
      activityTypeId_userId: {
        activityTypeId,
        userId
      }
    }
  });

  if (customConfig) {
    return customConfig;
  }

  // Retourner la config par défaut
  return {
    activityTypeId,
    fields: DEFAULT_ACTIVITY_CONFIGS[activityTypeId]?.fields || DEFAULT_ACTIVITY_CONFIGS.canyoning.fields,
    wetsuitBrand: DEFAULT_ACTIVITY_CONFIGS[activityTypeId]?.wetsuitBrand || null
  };
};

// Obtenir tous les participants d'une réservation
export const getParticipantsByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const participants = await prisma.participant.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      participants
    });
  } catch (error) {
    next(error);
  }
};

// Créer ou mettre à jour les participants d'une réservation
export const upsertParticipants = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { participants } = req.body;
    console.log('bookingId reçus:', req.params.bookingId);
    console.log('Participants reçus:', req.body.participants);

    if (!Array.isArray(participants)) {
      throw new AppError('Les participants doivent être un tableau', 400);
    }

    // Vérifier que la réservation existe
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: {
          include: {
            guide: true
          }
        },
        participants: true,  // Récupérer les anciens participants avant de les supprimer
        product: {
          select: {
            activityTypeId: true
          }
        }
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    // Récupérer la config de l'activité pour ce guide
    const activityConfig = await getActivityConfig(booking.product.activityTypeId, booking.session.guideId);

    // Vérifier que le nombre de participants correspond
    if (participants.length !== booking.numberOfPeople) {
      throw new AppError(
        `Le nombre de participants (${participants.length}) ne correspond pas au nombre de personnes réservées (${booking.numberOfPeople})`,
        400
      );
    }

    // Calculer l'ancien coût des chaussures AVANT de supprimer les participants
    let oldShoeRentalTotal = 0;
    if (booking.session.shoeRentalAvailable && booking.session.shoeRentalPrice) {
      oldShoeRentalTotal = booking.participants.filter(p => p.shoeRental).length * booking.session.shoeRentalPrice;
    }

    // Supprimer les anciens participants
    await prisma.participant.deleteMany({
      where: { bookingId }
    });

    // Calculer le nouveau coût total de location de chaussures
    let newShoeRentalTotal = 0;
    if (booking.session.shoeRentalAvailable && booking.session.shoeRentalPrice) {
      const shoesCount = participants.filter(p => p.shoeRental).length;
      newShoeRentalTotal = shoesCount * booking.session.shoeRentalPrice;
      console.log('Shoes count:', shoesCount, 'Price:', booking.session.shoeRentalPrice);
    }
    console.log('New shoe rental total:', newShoeRentalTotal);

    // Créer les nouveaux participants avec calcul de taille de combinaison
    const createdParticipants = await Promise.all(

      participants.map(async (participant) => {

          const age = participant.age ? parseInt(participant.age) : null;
          const height = participant.height ? parseInt(participant.height) : null;
          const weight = participant.weight ? parseFloat(participant.weight) : null;

        // Calculer la taille de combinaison uniquement pour le canyoning
        let wetsuitSize = null;
        if (booking.product.activityTypeId === 'canyoning' && height && weight) {
          const sizes = calculateWetsuitSizeByBrand(weight, height, activityConfig.wetsuitBrand || 'guara');
          wetsuitSize = sizes.primary; // On stocke la taille principale (basée sur le poids)
        }

        // Déterminer si le participant est complet selon les champs activés
        const fields = activityConfig.fields;
        let isComplete = true;
        if (fields.age?.required && !age) isComplete = false;
        if (fields.height?.required && !height) isComplete = false;
        if (fields.weight?.required && !weight) isComplete = false;

        return prisma.participant.create({
          data: {
            firstName: participant.firstName,
            age,
            height,
            weight,
            wetsuitSize,
            shoeRental: participant.shoeRental || false,
            shoeSize: participant.shoeSize ? parseInt(participant.shoeSize) : null,
            bookingId,
            isComplete
          }
        });
      })
    );

    // Mettre à jour le prix total de la réservation et marquer le formulaire comme complété
    // Soustraire l'ancien coût des chaussures et ajouter le nouveau
    const newTotalPrice = booking.totalPrice - oldShoeRentalTotal + newShoeRentalTotal;
    const allComplete = createdParticipants.every(p => p.isComplete);
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalPrice: newTotalPrice,
        participantsFormCompleted: allComplete  // Marquer le formulaire comme complété
      }
    });

    // Ajouter à l'historique
    await prisma.bookingHistory.create({
      data: {
        action: 'modified',
        details: `Formulaire participants complété (${participants.length} participant(s))`,
        bookingId
      }
    });


    res.json({
      success: true,
      participants: createdParticipants,
      shoeRentalTotal: newShoeRentalTotal,
      totalPrice: newTotalPrice
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir la synthèse des combinaisons pour une session
export const getSessionWetsuitSummary = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Récupérer toutes les réservations confirmées de la session avec participants
    const bookings = await prisma.booking.findMany({
      where: {
        sessionId,
        status: { in: ['confirmed', 'pending'] }
      },
      select: {
        id: true,
        clientFirstName: true,
        clientLastName: true,
        participantsFormCompleted: true,
        participants: true,
        product: {
          select: {
            name: true,
            color: true
          }
        }
      }
    });

    // Compter les tailles de combinaisons
    const wetsuitCounts = {};
    const shoeRentalCounts = {};
    const participantsByProduct = {};

    bookings.forEach(booking => {
      // Initialiser le compteur par produit
      if (!participantsByProduct[booking.product.name]) {
        participantsByProduct[booking.product.name] = {
          productName: booking.product.name,
          color: booking.product.color,
          bookings: []
        };
      }

      const bookingInfo = {
        bookingId: booking.id,
        clientName: `${booking.clientFirstName} ${booking.clientLastName}`,
        participants: []
      };

      booking.participants.forEach(participant => {
        // Compter les combinaisons
        if (participant.wetsuitSize) {
          wetsuitCounts[participant.wetsuitSize] =
            (wetsuitCounts[participant.wetsuitSize] || 0) + 1;
        }

        // Compter les locations de chaussures par pointure
        if (participant.shoeRental && participant.shoeSize) {
          const size = participant.shoeSize.toString();
          shoeRentalCounts[size] = (shoeRentalCounts[size] || 0) + 1;
        }

        bookingInfo.participants.push({
          firstName: participant.firstName,
          age: participant.age,
          height: participant.height,
          weight: participant.weight,
          wetsuitSize: participant.wetsuitSize,
          shoeRental: participant.shoeRental,
          shoeSize: participant.shoeSize
        });
      });

      participantsByProduct[booking.product.name].bookings.push(bookingInfo);
    });

    // Trier les tailles de combinaisons
    const sizeOrder = ['T6 ans', 'T8 ans', 'T10 ans', 'T12 ans', 'T14 ans', 'T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8',];
    const wetsuitSummary = sizeOrder
      .filter(size => wetsuitCounts[size])
      .map(size => ({
        size,
        count: wetsuitCounts[size]
      }));

    // Trier les pointures de chaussures
    const shoeRentalSummary = Object.entries(shoeRentalCounts)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([size, count]) => ({
        size: parseInt(size),
        count
      }));

    // Calculer le statut de complétion des formulaires
    const completedForms = bookings.filter(b => b.participantsFormCompleted).length;
    const allFormsCompleted = bookings.length > 0 && completedForms === bookings.length;

    res.json({
      success: true,
      summary: {
        wetsuitSummary,
        shoeRentalSummary,
        participantsByProduct: Object.values(participantsByProduct),
        totalParticipants: bookings.reduce((sum, b) => sum + b.participants.length, 0),
        totalBookings: bookings.length,
        completedForms,
        allFormsCompleted
      }
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un participant
export const deleteParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.participant.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Participant supprimé avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Participant non trouvé', 404));
    } else {
      next(error);
    }
  }
};

// Générer une page HTML imprimable pour une session
export const getSessionPrintHTML = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Récupérer la session avec toutes les informations
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        products: {
          include: {
            product: true
          }
        },
        bookings: {
          where: {
            status: { in: ['confirmed', 'pending'] }
          },
          include: {
            participants: true,
            product: {
              select: {
                name: true,
                color: true,
                activityTypeId: true
              }
            },
            notes: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            product: {
              name: 'asc'
            }
          }
        }
      }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // Récupérer la config d'activité pour le canyoning (si présent)
    const activityConfig = await getActivityConfig('canyoning', session.guide.id);
    const wetsuitBrand = activityConfig.wetsuitBrand || 'guara';

    // Vérifier si la session contient du canyoning
    const hasCanyoning = session.bookings.some(b => b.product.activityTypeId === 'canyoning');

    // Compter les tailles de combinaisons (uniquement pour le canyoning)
    const wetsuitCounts = {};
    const shoeRentalCounts = {};
    session.bookings.forEach(booking => {
      booking.participants.forEach(participant => {
        // Compter les combinaisons uniquement pour le canyoning
        if (booking.product.activityTypeId === 'canyoning' && participant.wetsuitSize) {
          wetsuitCounts[participant.wetsuitSize] =
            (wetsuitCounts[participant.wetsuitSize] || 0) + 1;
        }
        // Compter les chaussures pour toutes les activités qui ont la location
        if (participant.shoeRental && participant.shoeSize) {
          shoeRentalCounts[participant.shoeSize] =
            (shoeRentalCounts[participant.shoeSize] || 0) + 1;
        }
      });
    });

    // Trier les tailles (inclut les tailles de toutes les marques)
    const sizeOrder = [
      // Enfants
      'C2', 'C3', 'C4', 'C5', 'C6',
      'T6 ans', 'T8 ans', 'T10 ans', 'T12 ans', 'T14 ans',
      '8 ans', '10 ans', '12 ans', '14 ans',
      // Adultes
      '3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '5XL+', '3XL+',
      'T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T8+'
    ];

    // Créer le résumé en triant selon l'ordre, puis ajouter les tailles non listées
    const orderedSizes = sizeOrder.filter(size => wetsuitCounts[size]);
    const otherSizes = Object.keys(wetsuitCounts).filter(size => !sizeOrder.includes(size));
    const allSizes = [...orderedSizes, ...otherSizes];

    const wetsuitSummary = allSizes
      .map(size => `${wetsuitCounts[size]}${size}`)
      .join(' - ');

    //Somme des taille de chaussures si location
    const shoeSummary = Object.entries(shoeRentalCounts)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([size, count]) => `${count}x${size}`)
      .join(' - ');

    // Formater la date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Fonction pour calculer les tailles de combinaison avec la marque configurée
    const getWetsuitSizes = (weight, height) => {
      if (!weight && !height) return { primary: '?', secondary: '?' };
      return calculateWetsuitSizeByBrand(weight, height, wetsuitBrand);
    };

    // Générer le HTML
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Session ${session.products[0]?.product?.name || 'Canyon'} - ${formatDate(session.date)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }
    .header h1 {
      margin: 0;
      font-size: 16pt;
      font-weight: bold;
    }
    .header .date {
      text-align: right;
      font-size: 12pt;
    }
    .booking {
      margin-bottom: 20px;
      padding: 10px;
      border: 1px solid #333;
      border-radius: 5px;
      page-break-inside: avoid;
    }
    .booking-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ccc;
    }
    .booking-header .name {
      font-weight: bold;
      font-size: 12pt;
    }
    .booking-header .telephone {
      font-size: 10pt;
      color: #666;
    }
    .participant {
      margin: 5px 0;
      padding: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .participant-info {
      flex: 1;
    }
    .participant-name {
      font-weight: bold;
    }
    .participant-details {
      font-size: 10pt;
      color: #555;
    }
    .wetsuit-badges {
      display: flex;
      gap: 5px;
    }
    .wetsuit-badge {
      background: #4a90e2;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: bold;
      font-size: 11pt;
    }
    .wetsuit-badge-alt {
      background: #f59e0b;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: bold;
      font-size: 11pt;
    }
    .summary {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border: 2px solid #333;
      border-radius: 5px;
      page-break-inside: avoid;
    }
    .summary h2 {
      margin: 0 0 10px 0;
      font-size: 14pt;
    }
    .summary-text {
      font-size: 12pt;
      font-weight: bold;
    }
    .product-group {
      margin-bottom: 15px;
    }
    .product-header {
      background: #4a90e2;
      color: white;
      padding: 8px 12px;
      margin-bottom: 10px;
      border-radius: 5px;
      font-weight: bold;
      font-size: 12pt;
    }
    .booking-notes {
      margin-top: 10px;
      padding: 8px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
    }
    .booking-note {
      margin-bottom: 5px;
      font-size: 10pt;
      color: #78350f;
    }
    .booking-note:last-child {
      margin-bottom: 0;
    }
    .note-icon {
      font-weight: bold;
      margin-right: 5px;
    }
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${session.products[0]?.product?.name || 'Canyon Life'}</h1>
      <p>Guide: ${session.guide?.login || 'N/A'}</p>
    </div>
    <div class="date">
      <strong>${formatDate(session.date)}</strong>
    </div>
  </div>

  ${session.bookings.map(booking => `
    <div class="booking">
      <div class="booking-header">
        <div class="name">
          ${booking.clientFirstName} ${booking.clientLastName} :
          ${booking.amountPaid >= booking.totalPrice
            ? '<span style="color: green;">✓ Payé</span>'
            : `<span style="color: red;">⚠ Reste: ${(booking.totalPrice - booking.amountPaid).toFixed(2)}€ sur ${booking.totalPrice}€</span>`}
                        <img
                          src="https://flagcdn.com/16x12/${booking.clientNationality.toLowerCase()}.png"
                          alt="${booking.clientNationality}"
                          style="margin-left: 12px; vertical-align: center;"
                          onError="this.style.display='none';"
                        />
        </div>
        <div class="telephone">
          Tel: ${booking.clientPhone}
        </div>
      </div>

      ${booking.notes && booking.notes.length > 0 ? `
        <div class="booking-notes">
          ${booking.notes.map(note => `
            <div class="booking-note">
              <span class="note-icon">📝</span>
              <strong>Note:</strong> ${note.content}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${booking.participants.map((participant, idx) => {
        const isCanyoning = booking.product.activityTypeId === 'canyoning';
        const sizes = isCanyoning ? getWetsuitSizes(participant.weight, participant.height) : null;
        return `
        <div class="participant">
          <div class="participant-info">
            <span class="participant-name">• ${participant.firstName}</span>
            <div class="participant-details">
              ${participant.age ? `Âge: ${participant.age} ans` : ''}
              ${participant.height ? ` - Taille: ${participant.height} cm` : ''}
              ${participant.weight ? ` - Poids: ${participant.weight} kg` : ''}
              ${participant.shoeRental ? ` - 👟 Pointure: ${participant.shoeSize}` : ''}
            </div>
          </div>
          ${isCanyoning && sizes ? `
          <div class="wetsuit-badges">
            <div class="wetsuit-badge" title="Taille poids">${sizes.primary || '?'}</div>
            <div class="wetsuit-badge-alt" title="Taille hauteur">${sizes.secondary || '?'}</div>
          </div>
          ` : ''}
        </div>
      `}).join('')}
    </div>
  `).join('')}

  ${hasCanyoning ? `
  <div class="summary">
    <h2>📊 Total du nombre et des tailles de combinaisons à prévoir:</h2>
    <p class="summary-text">${wetsuitSummary || 'Aucune donnée'}</p>
  </div>
  ` : ''}

  ${shoeSummary ? `
  <div class="summary">
    <h2>👟 Pointures à prévoir :</h2>
    <p class="summary-text">${shoeSummary}</p>
  </div>
  ` : ''}


  <script>
    // Auto-print on load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    next(error);
  }
};
