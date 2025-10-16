import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lister tous les produits
export const getAllProducts = async (req, res, next) => {
  try {
    const { guideId, categoryId } = req.query;

    const where = {};

    // Si non-admin, filtrer automatiquement par guide connecté
    if (req.user.role !== 'admin') {
      where.guideId = req.user.userId;
    } else if (guideId) {
      // Si admin et guideId fourni en query, filtrer par ce guide
      where.guideId = guideId;
    }

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
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    // Si une date est fournie, ne garder que les produits avec au moins une session
    if (req.query.date) {
      products = products.filter(p => p.sessions && p.sessions.length > 0);
    }
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
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    console.log(product)
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
      region,
      maxCapacity,
      autoCloseHoursBefore,
      postBookingMessage,
      wazeLink,
      googleMapsLink,
      websiteLink,
      images,
      guideId: bodyGuideId,
      categoryIds // Tableau d'IDs de catégories (peut être vide)
    } = req.body;

    if (!name || !priceIndividual || !duration || !level || !maxCapacity) {
      throw new AppError('Champs requis manquants', 400);
    }

    // Si admin fournit un guideId, l'utiliser; sinon utiliser l'utilisateur connecté
    let guideId;
    if (req.user.role === 'admin' && bodyGuideId) {
      guideId = bodyGuideId;
    } else {
      guideId = req.user.userId;
    }

    // Préparer les données de création
    const productData = {
      name,
      shortDescription,
      longDescription,
      priceIndividual: parseFloat(priceIndividual),
      priceGroup: priceGroup || null,
      duration: parseInt(duration),
      color: color || '#93C5FD',
      level,
      region: region || 'annecy',
      maxCapacity: parseInt(maxCapacity),
      autoCloseHoursBefore: autoCloseHoursBefore ? parseInt(autoCloseHoursBefore) : null,
      postBookingMessage,
      wazeLink,
      googleMapsLink,
      websiteLink,
      images: images || [],
      guideId
    };

    // Ajouter les catégories si fournies
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      productData.categories = {
        create: categoryIds.map(catId => ({
          categoryId: catId
        }))
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        guide: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
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
    const { categoryIds, ...updateData } = req.body;

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
    delete updateData.categories;

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

    // Gérer la mise à jour des catégories si fournie
    if (categoryIds !== undefined) {
      // Supprimer toutes les catégories existantes
      await prisma.productCategory.deleteMany({
        where: { productId: id }
      });

      // Ajouter les nouvelles catégories (si le tableau n'est pas vide)
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: categoryIds.map(catId => ({
            productId: id,
            categoryId: catId
          }))
        });
      }
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
        categories: {
          include: {
            category: true
          }
        }
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

    // Suppression des images
    if (Array.isArray(existingProduct.images)) {
      existingProduct.images.forEach((imgPath) => {
        const fileName = path.basename(imgPath);
        console.log(fileName)
        const fullPath = path.join(__dirname, '../../uploads', fileName);
        console.log(fullPath)
        fs.unlink(fullPath, (err) => {
          if (err) console.error(`Erreur suppression image ${imgPath}:`, err);
        });
      });
    }

    await prisma.productCategory.deleteMany({
      where: { productId: id }
    });

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
