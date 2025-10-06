import express from 'express';
import { login, getCurrentUser } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
