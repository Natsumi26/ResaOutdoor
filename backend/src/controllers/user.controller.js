import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Lister tous les utilisateurs (admin seulement)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        stripeAccount: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// Créer un utilisateur (admin seulement)
export const createUser = async (req, res, next) => {
  try {
    const { login, password, email, stripeAccount, role } = req.body;

    if (!login || !password) {
      throw new AppError('Login et mot de passe requis', 400);
    }

    // Vérifier si le login existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { login }
    });

    if (existingUser) {
      throw new AppError('Ce login existe déjà', 409);
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
        email,
        stripeAccount,
        role: role || 'guide'
      },
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        stripeAccount: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Modifier un utilisateur (admin seulement)
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { login, password, email, stripeAccount, role } = req.body;

    const updateData = {
      ...(login && { login }),
      ...(email && { email }),
      ...(stripeAccount !== undefined && { stripeAccount }),
      ...(role && { role })
    };

    // Si un nouveau mot de passe est fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        stripeAccount: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Utilisateur non trouvé', 404));
    } else {
      next(error);
    }
  }
};

// Supprimer un utilisateur (admin seulement)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Empêcher la suppression du compte admin principal
    const user = await prisma.user.findUnique({ where: { id } });

    if (user && user.login === 'canyonlife') {
      throw new AppError('Impossible de supprimer le compte administrateur principal', 403);
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Utilisateur non trouvé', 404));
    } else {
      next(error);
    }
  }
};
