import express from 'express';
import { getProductAvailability, getSessionAvailableProducts } from '../controllers/availability.controller.js';

const router = express.Router();

// GET /api/availability/product?productId=xxx&date=2025-10-15
router.get('/product', getProductAvailability);

// GET /api/availability/session/:sessionId
router.get('/session/:sessionId', getSessionAvailableProducts);

export default router;
