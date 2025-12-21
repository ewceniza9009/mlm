import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getTasks, updateTaskStatus } from '../controllers/taskController';

const router = express.Router();

router.get('/', protect, getTasks);
router.patch('/:taskId/status', protect, updateTaskStatus);

export default router;
