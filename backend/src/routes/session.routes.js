import express from 'express';
import { getAllSessions, getSessionById, createSession, updateSession, deleteSession, searchAvailableProducts, getNextAvailableDates } from '../controllers/session.controller.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Routes publiques pour les clients (sans authentification requise)
router.get('/search/available', optionalAuth, searchAvailableProducts);
router.get('/next-available', optionalAuth, getNextAvailableDates);
router.get('/',optionalAuth, getAllSessions);
router.get('/:id',optionalAuth, getSessionById);

// Routes protégées
router.use(authMiddleware);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
