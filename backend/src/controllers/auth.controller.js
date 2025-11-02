import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export const login = async (req, res, next) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      throw new AppError('Login et mot de passe requis', 400);
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        email: true,
        role: true,
        teamName: true,
        stripeAccount: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        practiceActivities: true,
        confidentialityPolicy:true
      }
    });

    if (!user) {
      throw new AppError('Identifiants incorrects', 401);
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Identifiants incorrects', 401);
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        login: user.login,
        role: user.role,
        teamName: user.teamName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Réponse (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        teamName: true,
        stripeAccount: true,
        createdAt: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        practiceActivities: true,
        confidentialityPolicy:true
      }
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
