import express from 'express';
import * as walletController from '../controllers/walletController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, walletController.getMyWallet);
router.post('/withdraw', protect, walletController.requestWithdrawal);
router.post('/process', protect, admin, walletController.processWithdrawal);

export default router;