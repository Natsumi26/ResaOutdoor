import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  addPayment,
  cancelBooking,
  moveBooking,
  deleteBooking,
  markProductDetailsSent,
  getNotes,
  addNote,
  updateNote,
  deleteNote
} from '../controllers/booking.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Routes publiques (accessibles sans authentification)
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.post('/:id/cancel', cancelBooking);

// Routes protégées (authentification requise)
router.get('/', authMiddleware, getAllBookings);
router.post('/:id/payment', authMiddleware, addPayment);
router.post('/:id/move', authMiddleware, moveBooking);
router.post('/:id/mark-product-details-sent', authMiddleware, markProductDetailsSent);
router.delete('/:id', authMiddleware, deleteBooking);

// Routes pour les notes (protégées)
router.get('/:id/notes', authMiddleware, getNotes);
router.post('/:id/notes', authMiddleware, addNote);
router.put('/:id/notes/:noteId', authMiddleware, updateNote);
router.delete('/:id/notes/:noteId', authMiddleware, deleteNote);

export default router;
