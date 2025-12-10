import express from 'express';
import * as genealogyController from '../controllers/genealogyController';

import { protect } from '../middleware/authMiddleware';
import * as placementController from '../controllers/placementController';

const router = express.Router();

router.get('/tree', genealogyController.getTree);
router.get('/upline', genealogyController.getUpline);

// Holding Tank
router.get('/holding-tank', protect, placementController.getHoldingTank);
router.post('/place-member', protect, placementController.placeUserManually);

// Search
router.get('/search-downline', protect, genealogyController.searchDownline);

export default router;