import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSettings, getSettingsByGuideId, updateSettings, updateLogo } from '../controllers/settings.controller.js';

const router = express.Router();

// Récupérer les paramètres de l'utilisateur connecté
router.get('/', authMiddleware, getSettings);

// Récupérer les paramètres d'un guide spécifique (sans auth - pour les clients)
router.get('/guide/:guideId', getSettingsByGuideId);

// Mettre à jour les paramètres de l'utilisateur connecté
router.put('/', authMiddleware, updateSettings);

// Mettre à jour uniquement le logo de l'utilisateur connecté
router.patch('/logo', authMiddleware, updateLogo);

export default router;
