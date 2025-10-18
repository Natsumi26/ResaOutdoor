import express from 'express';
import { getAllResellers, createReseller, updateReseller, deleteReseller } from '../controllers/reseller.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllResellers);
router.post('/', createReseller);
router.put('/:id', updateReseller);
router.delete('/:id', deleteReseller);

export default router;
