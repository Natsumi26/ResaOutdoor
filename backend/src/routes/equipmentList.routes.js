import express from 'express';
import { getAllEquipmentLists, getEquipmentListById, createEquipmentList, updateEquipmentList, deleteEquipmentList } from '../controllers/equipmentList.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

router.get('/', getAllEquipmentLists);
router.get('/:id', getEquipmentListById);
router.post('/', createEquipmentList);
router.put('/:id', updateEquipmentList);
router.delete('/:id', deleteEquipmentList);

export default router;
