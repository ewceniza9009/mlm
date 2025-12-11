import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getEarningsOverTime, getRecruitGrowth } from '../controllers/analyticsController';

const router = express.Router();

router.get('/earnings', protect, getEarningsOverTime);
router.get('/growth', protect, getRecruitGrowth);

export default router;
