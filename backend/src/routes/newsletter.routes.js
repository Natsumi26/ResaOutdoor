import express from 'express';
import {
  subscribe,
  unsubscribe,
  getAll,
  deleteSubscriber,
  sendNewsletterEmail,
  sendTestEmail
} from '../controllers/newsletter.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Routes publiques
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Routes protégées (guides uniquement)
router.get('/', authMiddleware, getAll);
router.delete('/:id', authMiddleware, deleteSubscriber);
router.post('/send', authMiddleware, sendNewsletterEmail);
router.post('/test-send', authMiddleware, sendTestEmail);

export default router;
