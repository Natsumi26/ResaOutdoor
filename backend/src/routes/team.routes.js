import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getMyLeader
} from '../controllers/team.controller.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Récupérer les membres de l'équipe
router.get('/members', getTeamMembers);

// Ajouter un membre à l'équipe
router.post('/members', addTeamMember);

// Modifier un membre de l'équipe
router.put('/members/:memberId', updateTeamMember);

// Supprimer un membre de l'équipe
router.delete('/members/:memberId', deleteTeamMember);

// Récupérer mon leader
router.get('/my-leader', getMyLeader);

export default router;
