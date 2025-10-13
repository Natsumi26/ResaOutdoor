import express from 'express';
import {
  getParticipantsByBooking,
  upsertParticipants,
  getSessionWetsuitSummary,
  getSessionPrintHTML,
  deleteParticipant
} from '../controllers/participant.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/participants/booking/:bookingId - Obtenir les participants d'une réservation
router.get('/booking/:bookingId', getParticipantsByBooking);

// POST /api/participants/booking/:bookingId - Créer/Mettre à jour les participants d'une réservation
router.post('/booking/:bookingId', upsertParticipants);

// GET /api/participants/session/:sessionId/wetsuit-summary - Obtenir la synthèse des combinaisons pour une session
router.get('/session/:sessionId/wetsuit-summary', getSessionWetsuitSummary);

// GET /api/participants/session/:sessionId/print - Obtenir une page HTML imprimable pour une session
router.get('/session/:sessionId/print', getSessionPrintHTML);

// DELETE /api/participants/:id - Supprimer un participant
router.delete('/:id', deleteParticipant);

export default router;
