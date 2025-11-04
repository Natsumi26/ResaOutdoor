import prisma from '../config/database.js';

// Récupérer les paramètres de l'utilisateur connecté
export const getSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    // Si pas d'utilisateur connecté, retourner des settings vides
    if (!userId) {
      return res.status(200).json({ settings: null });
    }

    // Récupérer les settings de l'utilisateur
    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    // Si aucun settings n'existe pour cet utilisateur, créer un enregistrement par défaut
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId
        }
      });
    }

    res.status(200).json({ settings });
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
};

// Mettre à jour les paramètres de l'utilisateur connecté
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const {
      companyName,
      companyPhone,
      companyEmail,
      website,
      logo,
      slogan,
      primaryColor,
      secondaryColor,
      clientButtonColor,
      clientAccentColor
    } = req.body;

    // Récupérer les settings de l'utilisateur
    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Créer si n'existe pas
      settings = await prisma.settings.create({
        data: {
          userId,
          companyName,
          companyPhone,
          companyEmail,
          website,
          logo,
          slogan,
          primaryColor,
          secondaryColor,
          clientButtonColor,
          clientAccentColor
        }
      });
    } else {
      // Mettre à jour uniquement les champs fournis
      settings = await prisma.settings.update({
        where: { userId },
        data: {
          ...(companyName !== undefined && { companyName }),
          ...(companyPhone !== undefined && { companyPhone }),
          ...(companyEmail !== undefined && { companyEmail }),
          ...(website !== undefined && { website }),
          ...(logo !== undefined && { logo }),
          ...(slogan !== undefined && { slogan }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(clientButtonColor !== undefined && { clientButtonColor }),
          ...(clientAccentColor !== undefined && { clientAccentColor })
        }
      });
    }

    res.status(200).json({
      message: 'Paramètres mis à jour avec succès',
      settings
    });
  } catch (error) {
    console.error('Erreur mise à jour settings:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
};

// Mettre à jour uniquement le logo de l'utilisateur connecté
export const updateLogo = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const { logo } = req.body;

    if (!logo) {
      return res.status(400).json({ error: 'URL du logo requise' });
    }

    // Récupérer ou créer les settings de l'utilisateur
    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          logo
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { userId },
        data: { logo }
      });
    }

    res.status(200).json({
      message: 'Logo mis à jour avec succès',
      settings
    });
  } catch (error) {
    console.error('Erreur mise à jour logo:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du logo' });
  }
};
