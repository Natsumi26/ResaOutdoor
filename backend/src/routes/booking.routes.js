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

router.use(authMiddleware);

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.post('/:id/payment', addPayment);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/move', moveBooking);
router.post('/:id/mark-product-details-sent', markProductDetailsSent);
router.delete('/:id', deleteBooking);

// Routes pour les notes
router.get('/:id/notes', getNotes);
router.post('/:id/notes', addNote);
router.put('/:id/notes/:noteId', updateNote);
router.delete('/:id/notes/:noteId', deleteNote);

export default router;
