import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) {
      throw new AppError('Token manquant. Authentification requise.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Token invalide', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expiré', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Si le token est invalide, on continue quand même sans user
        req.user = null;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware pour vérifier si l'utilisateur est admin (super_admin ou leader)
export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'leader') {
    throw new AppError('Accès réservé aux administrateurs', 403);
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est super_admin uniquement
export const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    throw new AppError('Accès réservé aux super administrateurs', 403);
  }
  next();
};

// Middleware pour vérifier si l'utilisateur peut créer des sessions (pas trainee)
export const canCreateSessions = (req, res, next) => {
  if (req.user.role === 'trainee') {
    throw new AppError('Les stagiaires ne peuvent pas créer de sessions', 403);
  }
  next();
};
