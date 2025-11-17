import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Fonction utilitaire pour calculer la taille de combinaison
const calculateWetsuitSize = (height, weight) => {
  // Calcul basé sur la taille et le poids
  // Barème Canyon Life

  if (weight < 25) {
    return 'T6 ans';
  } else if (weight < 30) {
    return 'T8 ans';
  } else if (weight < 35) {
    return 'T10 ans';
  } else if (weight < 40) {
    return 'T12 ans';
  } else if (weight < 45) {
    if (height < 145) return 'T14 ans';
    if (height < 155) return 'T0';
    return 'T1';
  } else if (weight < 55) {
    return 'T1';
  } else if (weight < 65) {
    return 'T2';
  } else if (weight < 75) {
    return 'T3';
  } else if (weight < 90) {
    return 'T4';
  } else if (weight < 105) {
    return 'T5';
  } else if (weight < 115) {
    return 'T6';
  } else if (weight < 125) {
    return 'T7';
  } else if (weight < 135) {
    return 'T8';
  } else {
    return 'T8+';
  }
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
        session: true,
        participants: true  // Récupérer les anciens participants avant de les supprimer
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

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

          const age = parseInt(participant.age);
          const height = parseInt(participant.height);
          const weight = parseFloat(participant.weight);

        const wetsuitSize = (height && weight)
        ? calculateWetsuitSize(height,weight)
        : null;

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
            isComplete: age && height && weight ? true : false
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
                color: true
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

    // Compter les tailles de combinaisons
    const wetsuitCounts = {};
    const shoeRentalCounts = {};
    session.bookings.forEach(booking => {
      booking.participants.forEach(participant => {
        console.log(participant)
        if (participant.wetsuitSize) {
          wetsuitCounts[participant.wetsuitSize] =
            (wetsuitCounts[participant.wetsuitSize] || 0) + 1;
        }
        if (participant.shoeSize) {
          shoeRentalCounts[participant.shoeSize] =
            (shoeRentalCounts[participant.shoeSize] || 0) + 1;
        }
      });
    });

    // Trier les tailles
    const sizeOrder = ['T6 ans', 'T8 ans', 'T10 ans', 'T12 ans', 'T14 ans', 'T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T8+'];
    const wetsuitSummary = sizeOrder
      .filter(size => wetsuitCounts[size])
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
    .wetsuit-badge {
      background: #4a90e2;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: bold;
      font-size: 11pt;
      margin-left: 10px;
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

      ${booking.participants.map((participant, idx) => `
        <div class="participant">
          <div class="participant-info">
            <span class="participant-name">• ${participant.firstName}</span>
            <div class="participant-details">
              Âge: ${participant.age} ans - Taille: ${participant.height} cm - Poids: ${participant.weight} kg
              ${participant.shoeRental ? `- 👟 Pointure: ${participant.shoeSize}` : ''}
            </div>
          </div>
          <div class="wetsuit-badge">${participant.wetsuitSize}</div>
        </div>
      `).join('')}
    </div>
  `).join('')}

  <div class="summary">
    <h2>📊 Total du nombre et des tailles de combinaisons à prévoir:</h2>
    <p class="summary-text">${wetsuitSummary || 'Aucune donnée'}</p>
  </div>
  <div class="summary">
  <h2>👟 Pointures à prévoir :</h2>
  <p class="summary-text">${shoeSummary || 'Aucune donnée'}</p>
  </div>


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
