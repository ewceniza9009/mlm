import express from 'express';
import { getMyWallet, requestWithdrawal, getPendingWithdrawals, processWithdrawal, transferFunds } from '../controllers/walletController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getMyWallet);
router.post('/withdraw', protect, requestWithdrawal);
router.post('/transfer', protect, transferFunds);

// Admin Routes
router.get('/admin/withdrawals', protect, admin, getPendingWithdrawals);
router.post('/admin/process-withdrawal', protect, admin, processWithdrawal);

export default router;