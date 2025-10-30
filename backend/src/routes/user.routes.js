import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent authentification + admin
router.use(authMiddleware);


router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
