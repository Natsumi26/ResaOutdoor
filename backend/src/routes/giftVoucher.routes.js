import express from 'express';
import {
  getAllGiftVouchers,
  getGiftVoucherByCode,
  createGiftVoucher,
  useGiftVoucher,
  verifyPromoCode,
  deleteGiftVoucher
} from '../controllers/giftVoucher.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/:code/verify', verifyPromoCode);

router.use(authMiddleware);

router.get('/', getAllGiftVouchers);
router.get('/:code', getGiftVoucherByCode);
router.post('/', createGiftVoucher);
router.post('/:code/use', useGiftVoucher);
router.delete('/:id', deleteGiftVoucher);

export default router;
