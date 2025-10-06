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
    const { isUsed } = req.query;

    const where = {};
    if (isUsed !== undefined) {
      where.isUsed = isUsed === 'true';
    }

    const vouchers = await prisma.giftVoucher.findMany({
      where,
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

// Obtenir un bon cadeau par code
export const getGiftVoucherByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      throw new AppError('Bon cadeau non trouvé', 404);
    }

    res.json({
      success: true,
      voucher
    });
  } catch (error) {
    next(error);
  }
};

// Créer un bon cadeau
export const createGiftVoucher = async (req, res, next) => {
  try {
    const { amount, expiresAt } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Montant invalide', 400);
    }

    // Générer un code unique
    let code;
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

    const voucher = await prisma.giftVoucher.create({
      data: {
        code,
        amount: parseFloat(amount),
        expiresAt: expiresAt ? new Date(expiresAt) : null
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

// Utiliser un bon cadeau
export const useGiftVoucher = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { usedBy } = req.body;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      throw new AppError('Bon cadeau non trouvé', 404);
    }

    if (voucher.isUsed) {
      throw new AppError('Ce bon cadeau a déjà été utilisé', 409);
    }

    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      throw new AppError('Ce bon cadeau a expiré', 410);
    }

    const updatedVoucher = await prisma.giftVoucher.update({
      where: { code: code.toUpperCase() },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy
      }
    });

    res.json({
      success: true,
      voucher: updatedVoucher
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
