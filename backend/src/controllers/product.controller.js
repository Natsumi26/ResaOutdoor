import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Lister tous les produits
export const getAllProducts = async (req, res, next) => {
  try {
    const { guideId, categoryId } = req.query;

    const where = {};
    if (guideId) where.guideId = guideId;
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where,
      include: {
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        category: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir un produit par ID
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        category: true
      }
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// Créer un produit
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      shortDescription,
      longDescription,
      priceIndividual,
      priceGroup,
      duration,
      color,
      level,
      maxCapacity,
      autoCloseHoursBefore,
      postBookingMessage,
      wazeLink,
      googleMapsLink,
      images,
      guideId: bodyGuideId,
      categoryId
    } = req.body;

    if (!name || !priceIndividual || !duration || !level || !maxCapacity || !categoryId) {
      throw new AppError('Champs requis manquants', 400);
    }

    // Si admin fournit un guideId, l'utiliser; sinon utiliser l'utilisateur connecté
    let guideId;
    if (req.user.role === 'admin' && bodyGuideId) {
      guideId = bodyGuideId;
    } else {
      guideId = req.user.userId;
    }

    const product = await prisma.product.create({
      data: {
        name,
        shortDescription,
        longDescription,
        priceIndividual: parseFloat(priceIndividual),
        priceGroup: priceGroup || null,
        duration: parseInt(duration),
        color: color || '#93C5FD',
        level,
        maxCapacity: parseInt(maxCapacity),
        autoCloseHoursBefore: autoCloseHoursBefore ? parseInt(autoCloseHoursBefore) : null,
        postBookingMessage,
        wazeLink,
        googleMapsLink,
        images: images || [],
        guideId,
        categoryId
      },
      include: {
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        category: true
      }
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// Modifier un produit
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Vérifier que le produit existe et appartient au guide (sauf si admin)
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Seul l'admin ou le guide propriétaire peut modifier
    if (req.user.role !== 'admin' && existingProduct.guideId !== req.user.userId) {
      throw new AppError('Vous ne pouvez modifier que vos propres produits', 403);
    }

    // Supprimer les champs qui ne doivent pas être modifiés
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.guide;
    delete updateData.category;

    // Convertir les types si nécessaire
    if (updateData.priceIndividual) {
      updateData.priceIndividual = parseFloat(updateData.priceIndividual);
    }
    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration);
    }
    if (updateData.maxCapacity) {
      updateData.maxCapacity = parseInt(updateData.maxCapacity);
    }
    if (updateData.autoCloseHoursBefore) {
      updateData.autoCloseHoursBefore = parseInt(updateData.autoCloseHoursBefore);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        category: true
      }
    });

    res.json({
      success: true,
      product
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Produit non trouvé', 404));
    } else {
      next(error);
    }
  }
};

// Supprimer un produit
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le produit existe et appartient au guide (sauf si admin)
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Seul l'admin ou le guide propriétaire peut supprimer
    if (req.user.role !== 'admin' && existingProduct.guideId !== req.user.userId) {
      throw new AppError('Vous ne pouvez supprimer que vos propres produits', 403);
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Produit non trouvé', 404));
    } else {
      next(error);
    }
  }
};
