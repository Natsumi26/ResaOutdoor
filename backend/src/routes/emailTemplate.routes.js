import express from 'express';
import {
  getAllTemplates,
  getTemplateByType,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAvailableVariables
} from '../controllers/emailTemplate.controller.js';

const router = express.Router();

// Routes publiques
router.get('/variables', getAvailableVariables);

// Routes protégées (authentification requise)
router.get('/', getAllTemplates);
router.get('/:type', getTemplateByType);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
