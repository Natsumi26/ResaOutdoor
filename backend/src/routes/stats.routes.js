import express from 'express';
import {
  getGlobalStats,
  getDailyStats,
  getRecentBookings
} from '../controllers/stats.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/global', getGlobalStats);
router.get('/daily', getDailyStats);
router.get('/recent-bookings', getRecentBookings);

export default router;
