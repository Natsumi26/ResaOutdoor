import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getActivityConfig,
  getActivityConfigPublic,
  getAllActivityConfigs,
  updateActivityConfig,
  resetActivityConfig,
  getWetsuitBrands
} from '../controllers/activityConfig.controller.js';

const router = express.Router();

// Routes publiques (pour iframe client)
router.get('/public/:activityTypeId', getActivityConfigPublic);
router.get('/wetsuit-brands', getWetsuitBrands);

// Routes authentifiées
router.get('/', authMiddleware, getAllActivityConfigs);
router.get('/:activityTypeId', authMiddleware, getActivityConfig);
router.put('/:activityTypeId', authMiddleware, updateActivityConfig);
router.delete('/:activityTypeId', authMiddleware, resetActivityConfig);

export default router;
