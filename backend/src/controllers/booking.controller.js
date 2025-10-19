import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendBookingConfirmation } from '../services/email.service.js';

// Lister toutes les réservations
export const getAllBookings = async (req, res, next) => {
  try {
    const { sessionId, status } = req.query;

    const where = {};
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        session: {
          include: {
            guide: {
              select: {
                id: true,
                login: true
              }
            }
          }
        },
        product: {
        },
        reseller: {
          select: {
            id: true,
            name: true,
            website: true,
            commission: true
          }
        },
        payments: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir une réservation par ID
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            products: {
              include: {
                product: true
              }
            },
            guide: {
              select: {
                id: true,
                login: true,
                email: true
              }
            }
          }
        },
        product: {
        },
        reseller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true,
            commission: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Créer une réservation
export const createBooking = async (req, res, next) => {
  try {
    const {
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      clientNationality,
      numberOfPeople,
      totalPrice,
      amountPaid,
      status,
      sessionId,
      productId,  // Le client choisit un produit spécifique
      resellerId  // Revendeur optionnel
    } = req.body;

    if (!clientFirstName || !clientLastName ||
        !numberOfPeople || !totalPrice || !sessionId || !productId) {
      throw new AppError('Champs requis manquants', 400);
    }

    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        products: {
          include: {
            product: true
          }
        },
        bookings: {
          include: {
            product: true
          }
        }
      }
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // Vérifier que le produit fait partie de cette session
    const sessionProduct = session.products.find(sp => sp.productId === productId);
    if (!sessionProduct) {
      throw new AppError('Ce produit n\'est pas disponible pour cette session', 400);
    }

    const product = sessionProduct.product;

    // LOGIQUE DE ROTATION MAGIQUE
    if (session.isMagicRotation) {
      // Vérifier si le guide a déjà une réservation sur ce créneau
      const hasBooking = session.bookings.length > 0;

      if (hasBooking) {
        // Il y a déjà une réservation, vérifier si c'est pour le même produit
        const existingProductId = session.bookings[0].productId;

        if (existingProductId !== productId) {
          throw new AppError('Ce créneau est déjà réservé pour un autre canyon. Le guide n\'est plus disponible.', 409);
        }

        // C'est le même produit, vérifier la capacité
        const currentOccupancy = session.bookings
          .filter(b => b.productId === productId)
          .reduce((sum, b) => sum + b.numberOfPeople, 0);

        if (currentOccupancy + numberOfPeople > product.maxCapacity) {
          throw new AppError(`Capacité maximale atteinte pour ${product.name} (${product.maxCapacity} places)`, 409);
        }
      }
    } else {
      // Mode normal : vérifier simplement la capacité du produit
      const currentOccupancy = session.bookings
        .filter(b => b.productId === productId)
        .reduce((sum, b) => sum + b.numberOfPeople, 0);

      if (currentOccupancy + numberOfPeople > product.maxCapacity) {
        throw new AppError(`Capacité maximale atteinte pour ${product.name} (${product.maxCapacity} places)`, 409);
      }
    }

    // Créer la réservation avec transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          clientFirstName,
          clientLastName,
          clientEmail,
          clientPhone,
          clientNationality,
          numberOfPeople: parseInt(numberOfPeople),
          totalPrice: parseFloat(totalPrice),
          amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
          status: status || 'pending',
          sessionId,
          productId,
          resellerId: resellerId || null
        },
        include: {
          session: {
            include: {
              guide: true
            }
          },
          product: {
          }
        }
      });

      // Créer l'entrée historique
      await tx.bookingHistory.create({
        data: {
          action: 'created',
          details: `Réservation créée pour ${numberOfPeople} personne(s) - ${product.name}`,
          bookingId: newBooking.id
        }
      });

      // Si un paiement initial est effectué
      if (amountPaid && amountPaid > 0) {
        await tx.payment.create({
          data: {
            amount: parseFloat(amountPaid),
            method: 'other',
            bookingId: newBooking.id
          }
        });

        await tx.bookingHistory.create({
          data: {
            action: 'payment',
            details: `Paiement de ${amountPaid}€`,
            bookingId: newBooking.id
          }
        });
      }

      return newBooking;
    });

    // Envoyer l'email de confirmation (asynchrone, ne bloque pas la réponse)
    sendBookingConfirmation(booking).catch(err => {
      console.error('Erreur envoi email de confirmation:', err);
      // L'email échoue mais la réservation est créée
    });

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une réservation
export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Supprimer les champs non modifiables
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.session;
    delete updateData.product;
    delete updateData.payments;
    delete updateData.history;

    // Convertir les types si nécessaire
    if (updateData.numberOfPeople) {
      updateData.numberOfPeople = parseInt(updateData.numberOfPeople);
    }
    if (updateData.totalPrice) {
      updateData.totalPrice = parseFloat(updateData.totalPrice);
    }
    if (updateData.amountPaid !== undefined) {
      updateData.amountPaid = parseFloat(updateData.amountPaid);
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Récupérer la réservation actuelle pour comparer
      const currentBooking = await tx.booking.findUnique({
        where: { id }
      });

      // Si le nombre de personnes augmente, marquer les infos de groupe comme incomplètes
      if (updateData.numberOfPeople && updateData.numberOfPeople > currentBooking.numberOfPeople) {
        updateData.participantsFormCompleted = false;
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          session: {
            include: {
              guide: true
            }
          },
          product: {
          },
          payments: true,
          history: true
        }
      });

      // Ajouter à l'historique
      await tx.bookingHistory.create({
        data: {
          action: 'modified',
          details: 'Réservation modifiée',
          bookingId: id
        }
      });

      return updatedBooking;
    });

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Réservation non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Ajouter un paiement
export const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, notes } = req.body;

    if (!amount || !method) {
      throw new AppError('Montant et méthode requis', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount),
          method,
          notes,
          bookingId: id
        }
      });

      // Mettre à jour le montant payé
      const newAmountPaid = booking.amountPaid + parseFloat(amount);
      await tx.booking.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          status: newAmountPaid >= booking.totalPrice ? 'confirmed' : 'pending'
        }
      });

      // Ajouter à l'historique
      await tx.bookingHistory.create({
        data: {
          action: 'payment',
          details: `Paiement de ${amount}€ via ${method}`,
          bookingId: id
        }
      });

      return payment;
    });

    res.status(201).json({
      success: true,
      payment: result
    });
  } catch (error) {
    next(error);
  }
};

// Annuler une réservation
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.$transaction(async (tx) => {
      const cancelledBooking = await tx.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          session: true,
          product: true,
          payments: true
        }
      });

      await tx.bookingHistory.create({
        data: {
          action: 'cancelled',
          details: 'Réservation annulée',
          bookingId: id
        }
      });

      return cancelledBooking;
    });

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Réservation non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Déplacer une réservation vers une autre session
export const moveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newSessionId, selectedProductId } = req.body;

    console.log('🔄 Move booking:', { bookingId: id, newSessionId, selectedProductId });

    if (!newSessionId) {
      throw new AppError('ID de la nouvelle session requis', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    console.log('📦 Current booking:', {
      bookingId: booking.id,
      currentProductId: booking.productId,
      currentProductName: booking.product.name,
      currentSessionId: booking.sessionId
    });

    // Vérifier la nouvelle session
    const newSession = await prisma.session.findUnique({
      where: { id: newSessionId },
      include: {
        products: {
          include: {
            product: true
          }
        },
        bookings: {
          where: {
            id: { not: id } // Exclure la réservation actuelle
          },
          include: {
            product: true
          }
        }
      }
    });

    if (!newSession) {
      throw new AppError('Nouvelle session non trouvée', 404);
    }

    console.log('🎯 New session:', {
      sessionId: newSession.id,
      availableProducts: newSession.products.map(sp => ({
        id: sp.productId,
        name: sp.product.name
      })),
      existingBookings: newSession.bookings.length
    });

    // Déterminer le produit à utiliser
    let newProductId;
    let productChanged = false;

    // LOGIQUE 1: Si la session a déjà des réservations, utiliser le produit dominant
    if (newSession.bookings.length > 0) {
      // Trouver le produit le plus utilisé dans la session
      const productCounts = {};
      newSession.bookings.forEach(b => {
        productCounts[b.productId] = (productCounts[b.productId] || 0) + 1;
      });

      const dominantProductId = Object.keys(productCounts).reduce((a, b) =>
        productCounts[a] > productCounts[b] ? a : b
      );

      console.log('📊 Session has existing bookings. Dominant product:', dominantProductId);

      // Vérifier que ce produit est disponible dans la session
      const isDominantProductAvailable = newSession.products.some(sp => sp.productId === dominantProductId);

      if (!isDominantProductAvailable) {
        throw new AppError('Le produit dominant de la session n\'est plus disponible', 400);
      }

      newProductId = dominantProductId;
      productChanged = newProductId !== booking.productId;

      console.log('✅ Using dominant product from existing bookings:', {
        productId: newProductId,
        productName: newSession.bookings.find(b => b.productId === newProductId)?.product.name,
        changed: productChanged
      });
    }
    // LOGIQUE 2: Si la session est vide et qu'un produit est sélectionné, l'utiliser
    else if (selectedProductId) {
      // Vérifier que le produit sélectionné est disponible
      const isSelectedProductAvailable = newSession.products.some(sp => sp.productId === selectedProductId);

      if (!isSelectedProductAvailable) {
        throw new AppError('Le produit sélectionné n\'est pas disponible dans cette session', 400);
      }

      newProductId = selectedProductId;
      productChanged = newProductId !== booking.productId;

      console.log('✅ Using user-selected product:', {
        productId: newProductId,
        changed: productChanged
      });
    }
    // LOGIQUE 3: Session vide et pas de sélection -> TOUJOURS demander le choix
    else {
      if (newSession.products.length === 0) {
        throw new AppError('Aucun produit disponible dans cette session', 400);
      }

      if (newSession.products.length === 1) {
        // Un seul produit disponible, l'utiliser automatiquement
        newProductId = newSession.products[0].productId;
        productChanged = newProductId !== booking.productId;
        console.log('✅ Using only available product:', newProductId);
      } else {
        // Plusieurs produits disponibles, demander à l'utilisateur de choisir
        console.log('🤔 Multiple products available, asking user to choose');
        return res.status(200).json({
          success: false,
          needsProductSelection: true,
          availableProducts: newSession.products.map(sp => ({
            id: sp.productId,
            name: sp.product.name,
            price: sp.product.priceIndividual
          }))
        });
      }
    }

    // Récupérer le nouveau produit pour vérifier la capacité
    const newProduct = await prisma.product.findUnique({
      where: { id: newProductId }
    });

    console.log('📊 New product:', { id: newProduct.id, name: newProduct.name, price: newProduct.priceIndividual });

    // Vérifier la capacité pour le produit (ancien ou nouveau)
    const currentOccupancy = newSession.bookings
      .filter(b => b.productId === newProductId)
      .reduce((sum, b) => sum + b.numberOfPeople, 0);

    if (currentOccupancy + booking.numberOfPeople > newProduct.maxCapacity) {
      throw new AppError('Capacité maximale atteinte dans la nouvelle session', 409);
    }

    // Recalculer le prix si le produit change
    let newTotalPrice = booking.totalPrice;
    if (productChanged) {
      newTotalPrice = newProduct.priceIndividual * booking.numberOfPeople;
      console.log('💰 Price changed from', booking.totalPrice, 'to', newTotalPrice);
    }

    console.log('💾 Updating booking with:', {
      sessionId: newSessionId,
      productId: newProductId,
      totalPrice: newTotalPrice,
      productChanged
    });

    const movedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: {
          session: {
            connect: { id: newSessionId }
          },
          product: {
            connect: { id: newProductId }
          },
          totalPrice: newTotalPrice
        },
        include: {
          session: true,
          product: true
        }
      });

      console.log('✅ Booking updated:', {
        id: updated.id,
        newProductId: updated.productId,
        newProductName: updated.product.name,
        newSessionId: updated.sessionId,
        newTotalPrice: updated.totalPrice
      });

      const historyDetails = productChanged
        ? `Réservation déplacée vers une nouvelle session. Produit changé de "${booking.product.name}" vers "${newProduct.name}". Prix mis à jour: ${newTotalPrice}€`
        : `Réservation déplacée vers une nouvelle session`;

      await tx.bookingHistory.create({
        data: {
          action: 'modified',
          details: historyDetails,
          bookingId: id
        }
      });

      return updated;
    });

    res.json({
      success: true,
      booking: movedBooking
    });
  } catch (error) {
    console.error('❌ Error in moveBooking:', error);
    next(error);
  }
};

// Supprimer une réservation
export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    // Supprimer la réservation et toutes ses dépendances (cascade)
    await prisma.booking.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Réservation supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Réservation non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Marquer les détails du produit comme envoyés par le guide
export const markProductDetailsSent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { productDetailsSent: true },
        include: {
          session: {
            include: {
              guide: true
            }
          },
          product: true,
          payments: true,
          history: true
        }
      });

      // Ajouter à l'historique
      await tx.bookingHistory.create({
        data: {
          action: 'modified',
          details: 'Détails du produit envoyés au client',
          bookingId: id
        }
      });

      return updatedBooking;
    });

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Réservation non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Obtenir toutes les notes d'une réservation
export const getNotes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notes = await prisma.bookingNote.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// Ajouter une note à une réservation
export const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new AppError('Le contenu de la note est requis', 400);
    }

    // Vérifier que la réservation existe
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError('Réservation non trouvée', 404);
    }

    const note = await prisma.bookingNote.create({
      data: {
        content: content.trim(),
        bookingId: id
      }
    });

    res.status(201).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une note
export const updateNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new AppError('Le contenu de la note est requis', 400);
    }

    // Vérifier que la note existe et appartient à cette réservation
    const existingNote = await prisma.bookingNote.findUnique({
      where: { id: noteId }
    });

    if (!existingNote) {
      throw new AppError('Note non trouvée', 404);
    }

    if (existingNote.bookingId !== id) {
      throw new AppError('Cette note n\'appartient pas à cette réservation', 403);
    }

    const note = await prisma.bookingNote.update({
      where: { id: noteId },
      data: { content: content.trim() }
    });

    res.json({
      success: true,
      note
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Note non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Supprimer une note
export const deleteNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;

    // Vérifier que la note existe et appartient à cette réservation
    const existingNote = await prisma.bookingNote.findUnique({
      where: { id: noteId }
    });

    if (!existingNote) {
      throw new AppError('Note non trouvée', 404);
    }

    if (existingNote.bookingId !== id) {
      throw new AppError('Cette note n\'appartient pas à cette réservation', 403);
    }

    await prisma.bookingNote.delete({
      where: { id: noteId }
    });

    res.json({
      success: true,
      message: 'Note supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Note non trouvée', 404));
    } else {
      next(error);
    }
  }
};
