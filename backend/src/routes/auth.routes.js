import express from 'express';
import { login, getCurrentUser, superLogin } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);

router.post('/super-login', superLogin);


export default router;
