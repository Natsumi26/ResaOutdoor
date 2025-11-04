import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSettings, updateSettings, updateLogo } from '../controllers/settings.controller.js';

const router = express.Router();

// Récupérer les paramètres de l'utilisateur connecté
router.get('/', authMiddleware, getSettings);

// Mettre à jour les paramètres de l'utilisateur connecté
router.put('/', authMiddleware, updateSettings);

// Mettre à jour uniquement le logo de l'utilisateur connecté
router.patch('/logo', authMiddleware, updateLogo);

export default router;
