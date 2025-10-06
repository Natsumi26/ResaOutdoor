import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Lister toutes les catégories
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// Créer une catégorie
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Le nom de la catégorie est requis', 400);
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une catégorie
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json({
      success: true,
      category
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Catégorie non trouvée', 404));
    } else {
      next(error);
    }
  }
};

// Supprimer une catégorie
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier qu'il n'y a pas de produits associés
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (category && category._count.products > 0) {
      throw new AppError('Impossible de supprimer une catégorie contenant des produits', 409);
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Catégorie non trouvée', 404));
    } else {
      next(error);
    }
  }
};
