import express from 'express';
import { getAllSessions, getSessionById, createSession, updateSession, deleteSession, searchAvailableProducts } from '../controllers/session.controller.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Route publique pour la recherche client (sans authentification requise)
router.get('/search/available', optionalAuth, searchAvailableProducts);

// Routes protégées
router.use(authMiddleware);

router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
