import prisma from '../config/database.js';

// Récupérer les paramètres (il n'y en a qu'un seul enregistrement)
export const getSettings = async (req, res) => {
  try {
    // Récupérer le premier (et seul) enregistrement de settings
    let settings = await prisma.settings.findFirst();

    // Si aucun settings n'existe, créer un enregistrement par défaut
    if (!settings) {
      settings = await prisma.settings.create({
        data: {}
      });
    }

    res.status(200).json({ settings });
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
};

// Mettre à jour les paramètres
export const updateSettings = async (req, res) => {
  try {
    const {
      companyName,
      companyPhone,
      companyEmail,
      website,
      logo,
      primaryColor,
      secondaryColor,
      clientButtonColor,
      clientAccentColor
    } = req.body;

    // Récupérer ou créer le settings
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Créer si n'existe pas
      settings = await prisma.settings.create({
        data: {
          companyName,
          companyPhone,
          companyEmail,
          website,
          logo,
          primaryColor,
          secondaryColor,
          clientButtonColor,
          clientAccentColor
        }
      });
    } else {
      // Mettre à jour
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...(companyName !== undefined && { companyName }),
          ...(companyPhone !== undefined && { companyPhone }),
          ...(companyEmail !== undefined && { companyEmail }),
          ...(website !== undefined && { website }),
          ...(logo !== undefined && { logo }),
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

// Mettre à jour uniquement le logo
export const updateLogo = async (req, res) => {
  try {
    const { logo } = req.body;

    if (!logo) {
      return res.status(400).json({ error: 'URL du logo requise' });
    }

    // Récupérer ou créer le settings
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: { logo }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
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
