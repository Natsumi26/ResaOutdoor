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

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Accès réservé aux administrateurs', 403);
  }
  next();
};
