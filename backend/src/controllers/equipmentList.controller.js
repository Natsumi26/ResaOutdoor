import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtenir toutes les listes de matériel pour l'utilisateur connecté
export const getAllEquipmentLists = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const equipmentLists = await prisma.equipmentList.findMany({
      where: { userId },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      equipmentLists
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir une liste de matériel par ID
export const getEquipmentListById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const equipmentList = await prisma.equipmentList.findFirst({
      where: {
        id,
        userId
      },
      include: {
        products: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!equipmentList) {
      throw new AppError('Liste de matériel non trouvée', 404);
    }

    res.json({
      success: true,
      equipmentList
    });
  } catch (error) {
    next(error);
  }
};

// Créer une nouvelle liste de matériel
export const createEquipmentList = async (req, res, next) => {
  try {
    const { name, items } = req.body;
    const userId = req.user.userId;
    
    if (!name || !items) {
      throw new AppError('Le nom et les éléments de la liste sont requis', 400);
    }

    const equipmentList = await prisma.equipmentList.create({
      data: {
        name,
        items,
        userId
      }
    });

    res.status(201).json({
      success: true,
      equipmentList
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une liste de matériel
export const updateEquipmentList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, items } = req.body;
    const userId = req.user.id;

    // Vérifier que la liste appartient à l'utilisateur
    const existingList = await prisma.equipmentList.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingList) {
      throw new AppError('Liste de matériel non trouvée', 404);
    }

    const equipmentList = await prisma.equipmentList.update({
      where: { id },
      data: {
        name,
        items
      }
    });

    res.json({
      success: true,
      equipmentList
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une liste de matériel
export const deleteEquipmentList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la liste appartient à l'utilisateur
    const existingList = await prisma.equipmentList.findFirst({
      where: {
        id,
        userId
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existingList) {
      throw new AppError('Liste de matériel non trouvée', 404);
    }

    // Vérifier si la liste est utilisée par des produits
    if (existingList._count.products > 0) {
      throw new AppError(`Impossible de supprimer cette liste car elle est utilisée par ${existingList._count.products} produit(s)`, 400);
    }

    await prisma.equipmentList.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Liste de matériel supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};
