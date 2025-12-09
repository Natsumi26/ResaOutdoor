import express from 'express';
import { login, getCurrentUser, superLogin, requestPasswordReset, verifyResetToken, resetPassword, verifyTwoFactorCode, refresh, logout } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);

router.post('/super-login', superLogin);

// Routes de réinitialisation de mot de passe
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Route de vérification 2FA
router.post('/verify-2fa', verifyTwoFactorCode);


export default router;
