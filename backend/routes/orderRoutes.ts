import express from 'express';
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus } from '../controllers/orderController';
import { protect, optionalProtect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Public (Handles both Guest & Auth internally)
router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Admin Routes
router.get('/admin/all', protect, admin, getAllOrders);
router.put('/admin/:id/status', protect, admin, updateOrderStatus);

export default router;
