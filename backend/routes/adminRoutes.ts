import express from 'express';
import { getSystemStats, runCommissionRun, getSystemLogs } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Stats Endpoint
router.get('/stats', protect, admin, getSystemStats);

// Logs Endpoint (THIS WAS MISSING OR NOT SAVED)
router.get('/logs', protect, admin, getSystemLogs);

// Payout Endpoint
router.post('/run-commissions', protect, admin, runCommissionRun);

export default router;