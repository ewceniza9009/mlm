import express from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController';
import { protect, optionalProtect } from '../middleware/authMiddleware';

const router = express.Router();

// Public (Handles both Guest & Auth internally)
router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getMyOrders);

export default router;
