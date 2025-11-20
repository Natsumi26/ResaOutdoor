import prisma from '../config/database.js';
import { DEFAULT_ACTIVITY_CONFIGS, getAvailableBrands } from '../utils/wetsuitSizeCharts.js';

/**
 * Récupérer la configuration d'une activité pour le guide connecté
 */
export const getActivityConfig = async (req, res) => {
  try {
    const { activityTypeId } = req.params;
    const userId = req.user.userId;

    // Chercher la config personnalisée du guide
    let config = await prisma.activityFormConfig.findUnique({
      where: {
        activityTypeId_userId: {
          activityTypeId,
          userId
        }
      }
    });

    // Si pas de config personnalisée, retourner la config par défaut
    if (!config) {
      const defaultConfig = DEFAULT_ACTIVITY_CONFIGS[activityTypeId];
      if (!defaultConfig) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }

      return res.json({
        activityTypeId,
        userId,
        fields: defaultConfig.fields,
        wetsuitBrand: defaultConfig.wetsuitBrand,
        isDefault: true
      });
    }

    res.json({
      ...config,
      isDefault: false
    });
  } catch (error) {
    console.error('Erreur récupération config activité:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
};

/**
 * Récupérer la configuration d'une activité pour un guide spécifique (endpoint public pour iframe)
 */
export const getActivityConfigPublic = async (req, res) => {
  try {
    const { activityTypeId } = req.params;
    const { guideId } = req.query;

    if (!guideId) {
      return res.status(400).json({ error: 'guideId requis' });
    }

    // Chercher la config personnalisée du guide
    let config = await prisma.activityFormConfig.findUnique({
      where: {
        activityTypeId_userId: {
          activityTypeId,
          userId: guideId
        }
      }
    });

    // Si pas de config personnalisée, retourner la config par défaut
    if (!config) {
      const defaultConfig = DEFAULT_ACTIVITY_CONFIGS[activityTypeId];
      if (!defaultConfig) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }

      return res.json({
        activityTypeId,
        fields: defaultConfig.fields,
        wetsuitBrand: defaultConfig.wetsuitBrand
      });
    }

    res.json({
      activityTypeId,
      fields: config.fields,
      wetsuitBrand: config.wetsuitBrand
    });
  } catch (error) {
    console.error('Erreur récupération config activité publique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
};

/**
 * Récupérer toutes les configurations d'activités pour le guide connecté
 */
export const getAllActivityConfigs = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Récupérer les configs personnalisées du guide
    const customConfigs = await prisma.activityFormConfig.findMany({
      where: { userId }
    });

    // Construire la liste complète avec defaults
    const allActivities = Object.keys(DEFAULT_ACTIVITY_CONFIGS);
    const result = allActivities.map(activityTypeId => {
      const customConfig = customConfigs.find(c => c.activityTypeId === activityTypeId);

      if (customConfig) {
        return {
          ...customConfig,
          isDefault: false
        };
      }

      return {
        activityTypeId,
        userId,
        fields: DEFAULT_ACTIVITY_CONFIGS[activityTypeId].fields,
        wetsuitBrand: DEFAULT_ACTIVITY_CONFIGS[activityTypeId].wetsuitBrand,
        isDefault: true
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur récupération configs activités:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des configurations' });
  }
};

/**
 * Mettre à jour ou créer la configuration d'une activité
 */
export const updateActivityConfig = async (req, res) => {
  try {
    const { activityTypeId } = req.params;
    const userId = req.user.userId;
    const { fields, wetsuitBrand } = req.body;

    // Valider que l'activité existe
    if (!DEFAULT_ACTIVITY_CONFIGS[activityTypeId]) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    // Valider la structure des champs
    const requiredFields = ['firstName', 'age', 'height', 'weight', 'shoeRental', 'shoeSize'];
    for (const field of requiredFields) {
      if (!fields[field] || typeof fields[field].enabled !== 'boolean') {
        return res.status(400).json({ error: `Configuration invalide pour le champ ${field}` });
      }
    }

    // Créer ou mettre à jour la config
    const config = await prisma.activityFormConfig.upsert({
      where: {
        activityTypeId_userId: {
          activityTypeId,
          userId
        }
      },
      update: {
        fields,
        wetsuitBrand: activityTypeId === 'canyoning' ? wetsuitBrand : null
      },
      create: {
        activityTypeId,
        userId,
        fields,
        wetsuitBrand: activityTypeId === 'canyoning' ? wetsuitBrand : null
      }
    });

    res.json({
      ...config,
      isDefault: false
    });
  } catch (error) {
    console.error('Erreur mise à jour config activité:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
  }
};

/**
 * Réinitialiser la configuration d'une activité aux valeurs par défaut
 */
export const resetActivityConfig = async (req, res) => {
  try {
    const { activityTypeId } = req.params;
    const userId = req.user.userId;

    // Supprimer la config personnalisée
    await prisma.activityFormConfig.deleteMany({
      where: {
        activityTypeId,
        userId
      }
    });

    // Retourner la config par défaut
    const defaultConfig = DEFAULT_ACTIVITY_CONFIGS[activityTypeId];
    if (!defaultConfig) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    res.json({
      activityTypeId,
      userId,
      fields: defaultConfig.fields,
      wetsuitBrand: defaultConfig.wetsuitBrand,
      isDefault: true
    });
  } catch (error) {
    console.error('Erreur réinitialisation config activité:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la configuration' });
  }
};

/**
 * Récupérer la liste des marques de combinaisons disponibles
 */
export const getWetsuitBrands = async (req, res) => {
  try {
    const brands = getAvailableBrands();
    res.json(brands);
  } catch (error) {
    console.error('Erreur récupération marques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des marques' });
  }
};
