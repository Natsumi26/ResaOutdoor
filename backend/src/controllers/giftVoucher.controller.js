import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Générer un code unique pour le bon cadeau
const generateVoucherCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Lister tous les bons cadeaux
export const getAllGiftVouchers = async (req, res, next) => {
  try {
    const { type } = req.query;

    const where = {};
    if (type) {
      where.type = type;
    }

    const vouchers = await prisma.giftVoucher.findMany({
      where,
      include: {
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 5 // Dernières 5 utilisations
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      vouchers
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir un bon cadeau par code avec historique d'utilisation
export const getGiftVoucherByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          orderBy: { usedAt: 'desc' }
        }
      }
    });

    if (!voucher) {
      throw new AppError('Code non trouvé', 404);
    }

    res.json({
      success: true,
      voucher
    });
  } catch (error) {
    next(error);
  }
};

// Créer un bon cadeau ou code promo
export const createGiftVoucher = async (req, res, next) => {
  try {
    const { amount, expiresAt, type = 'voucher', maxUsages, code: customCode } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Montant invalide', 400);
    }

    // Si un code personnalisé est fourni, vérifier qu'il n'existe pas déjà
    let code;
    if (customCode) {
      code = customCode.toUpperCase();
      const existing = await prisma.giftVoucher.findUnique({
        where: { code }
      });
      if (existing) {
        throw new AppError('Ce code existe déjà', 409);
      }
    } else {
      // Générer un code unique
      let isUnique = false;
      while (!isUnique) {
        code = generateVoucherCode();
        const existing = await prisma.giftVoucher.findUnique({
          where: { code }
        });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    const voucher = await prisma.giftVoucher.create({
      data: {
        code,
        amount: parseFloat(amount),
        type,
        maxUsages: maxUsages ? parseInt(maxUsages) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        usages: true
      }
    });

    res.status(201).json({
      success: true,
      voucher
    });
  } catch (error) {
    next(error);
  }
};

// Utiliser un bon cadeau ou code promo
export const useGiftVoucher = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { usedBy, bookingId } = req.body;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: true
      }
    });

    if (!voucher) {
      throw new AppError('Code non trouvé', 404);
    }

    // Vérifier l'expiration
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      throw new AppError('Ce code a expiré', 410);
    }

    // Vérifier le nombre d'utilisations pour les codes promos
    if (voucher.type === 'promo' && voucher.maxUsages !== null) {
      if (voucher.usageCount >= voucher.maxUsages) {
        throw new AppError('Ce code promo a atteint sa limite d\'utilisations', 409);
      }
    }

    // Pour les bons cadeaux (usage unique), vérifier s'il a déjà été utilisé
    if (voucher.type === 'voucher' && voucher.usageCount > 0) {
      throw new AppError('Ce bon cadeau a déjà été utilisé', 409);
    }

    // Enregistrer l'utilisation avec une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer une entrée d'utilisation
      await tx.promoCodeUsage.create({
        data: {
          voucherId: voucher.id,
          usedBy,
          bookingId
        }
      });

      // Incrémenter le compteur d'utilisations
      const updated = await tx.giftVoucher.update({
        where: { code: code.toUpperCase() },
        data: {
          usageCount: { increment: 1 }
        },
        include: {
          usages: {
            orderBy: { usedAt: 'desc' }
          }
        }
      });

      return updated;
    });

    res.json({
      success: true,
      voucher: result
    });
  } catch (error) {
    next(error);
  }
};

// Vérifier la validité d'un code promo (sans l'utiliser)
export const verifyPromoCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          orderBy: { usedAt: 'desc' }
        }
      }
    });

    if (!voucher) {
      return res.json({
        success: false,
        valid: false,
        message: 'Code non trouvé'
      });
    }

    // Vérifier l'expiration
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      return res.json({
        success: false,
        valid: false,
        message: 'Ce code a expiré',
        voucher
      });
    }

    // Vérifier le nombre d'utilisations
    let canUse = true;
    let message = 'Code valide';

    if (voucher.type === 'promo' && voucher.maxUsages !== null) {
      if (voucher.usageCount >= voucher.maxUsages) {
        canUse = false;
        message = 'Ce code promo a atteint sa limite d\'utilisations';
      }
    }

    if (voucher.type === 'voucher' && voucher.usageCount > 0) {
      canUse = false;
      message = 'Ce bon cadeau a déjà été utilisé';
    }

    res.json({
      success: true,
      valid: canUse,
      message,
      voucher: {
        ...voucher,
        remainingUses: voucher.maxUsages ? voucher.maxUsages - voucher.usageCount : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un bon cadeau
export const deleteGiftVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.giftVoucher.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Bon cadeau supprimé avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      next(new AppError('Bon cadeau non trouvé', 404));
    } else {
      next(error);
    }
  }
};
