import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSettings, updateSettings, updateLogo } from '../controllers/settings.controller.js';

const router = express.Router();

// Récupérer les paramètres
router.get('/', getSettings);

// Mettre à jour les paramètres
router.put('/', authMiddleware, updateSettings);

// Mettre à jour uniquement le logo
router.patch('/logo', authMiddleware, updateLogo);

export default router;
