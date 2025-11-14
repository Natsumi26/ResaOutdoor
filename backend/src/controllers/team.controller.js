import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Récupérer tous les membres de l'équipe du leader connecté
 */
export const getTeamMembers = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    // Seuls les leaders et super_admin peuvent voir les membres de leur équipe
    if (userRole !== 'leader' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les leaders peuvent gérer une équipe.' });
    }

    let members;

    if (userRole === 'super_admin') {
      // Super admin voit tous les utilisateurs
      members = await prisma.user.findMany({
        select: {
          id: true,
          login: true,
          email: true,
          phone: true,
          role: true,
          teamLeaderId: true,
          stripeAccount: true,
          confidentialityPolicy: true,
          paymentMode: true,
          depositType: true,
          depositAmount: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Leader voit ses membres d'équipe
      members = await prisma.user.findMany({
        where: { teamLeaderId: userId },
        select: {
          id: true,
          login: true,
          email: true,
          phone: true,
          role: true,
          teamLeaderId: true,
          stripeAccount: true,
          confidentialityPolicy: true,
          paymentMode: true,
          depositType: true,
          depositAmount: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ members });
  } catch (error) {
    console.error('Erreur récupération membres équipe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


/**
 * Ajouter un membre à l'équipe
 */
export const addTeamMember = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const { login, email, phone, password, role } = req.body;

    // Seuls les leaders et super_admin peuvent ajouter des membres
    if (userRole !== 'leader' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les leaders peuvent ajouter des membres.' });
    }

    // Vérifier que les données requises sont présentes
    if (!login || !password) {
      return res.status(400).json({ error: 'Login et mot de passe requis.' });
    }

    // Vérifier que le login n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { login }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Ce login existe déjà.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouveau membre
    const newMember = await prisma.user.create({
      data: {
        login,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: role || 'employee',
        teamLeaderId: userId
      },
      select: {
        id: true,
        login: true,
        email: true,
        phone: true,
        role: true,
        teamLeaderId: true,
        createdAt: true
      }
    });

    res.status(201).json({ member: newMember, message: 'Membre ajouté avec succès' });
  } catch (error) {
    console.error('Erreur ajout membre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier un membre de l'équipe
 */
export const updateTeamMember = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const { memberId } = req.params;
    const {
      login,
      email,
      phone,
      role,
      password,
      stripeAccount,
      confidentialityPolicy,
      paymentMode,
      depositType,
      depositAmount
    } = req.body;

    // Seuls les leaders et super_admin peuvent modifier des membres
    if (userRole !== 'leader' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Récupérer le membre à modifier
    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Membre non trouvé.' });
    }

    // Vérifier que le leader ne modifie que ses propres membres
    if (userRole === 'leader' && member.teamLeaderId !== userId && member.id !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres membres d\'équipe ou votre propre compte.' });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (login) updateData.login = login;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role && (role === 'employee' || role === 'trainee' || role === 'leader')) updateData.role = role;

    // Si un nouveau mot de passe est fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Ajouter les champs de paiement pour les stagiaires
    if (role === 'trainee' || (member.role === 'trainee' && role === undefined)) {
      if (stripeAccount !== undefined) updateData.stripeAccount = stripeAccount;
      if (confidentialityPolicy !== undefined) updateData.confidentialityPolicy = confidentialityPolicy;
      if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
      if (depositType !== undefined) updateData.depositType = depositType;
      if (depositAmount !== undefined) updateData.depositAmount = depositAmount ? parseFloat(depositAmount) : null;
    }

    // Mettre à jour le membre
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        login: true,
        email: true,
        phone: true,
        role: true,
        teamLeaderId: true,
        stripeAccount: true,
        confidentialityPolicy: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        updatedAt: true
      }
    });

    res.json({ member: updatedMember, message: 'Membre modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification membre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un membre de l'équipe
 */
export const deleteTeamMember = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const { memberId } = req.params;

    // Seuls les leaders et super_admin peuvent supprimer des membres
    if (userRole !== 'leader' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Récupérer le membre à supprimer
    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Membre non trouvé.' });
    }

    // Vérifier que le leader ne supprime que ses propres membres
    if (userRole === 'leader' && member.teamLeaderId !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres membres d\'équipe.' });
    }

    // Empêcher la suppression de leaders ou super_admin
    if (member.role === 'leader' || member.role === 'super_admin') {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer un leader ou super admin.' });
    }

    // Supprimer le membre
    await prisma.user.delete({
      where: { id: memberId }
    });

    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les informations du leader de l'utilisateur connecté
 */
export const getMyLeader = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teamLeader: {
          select: {
            id: true,
            login: true,
            email: true,
            phone: true,
            role: true
          }
        }
      }
    });

    if (!user || !user.teamLeader) {
      return res.json({ leader: null });
    }

    res.json({ leader: user.teamLeader });
  } catch (error) {
    console.error('Erreur récupération leader:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
