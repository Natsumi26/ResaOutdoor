import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  addPayment,
  cancelBooking,
  moveBooking
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

export default router;
