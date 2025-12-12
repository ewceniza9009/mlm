import express from 'express';
import { createProduct, deleteProduct, getAllProducts, getShopProducts, getShopStatus, updateProduct, getPublicProducts, restockProduct } from '../controllers/productController';

import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Public / Shop
router.get('/status', protect, getShopStatus); // Check if enabled
router.get('/shop', protect, getShopProducts); // Users see active products
router.get('/public', getPublicProducts); // Guests see active products (if enabled)

// Admin
router.get('/', protect, admin, getAllProducts);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.patch('/:id/restock', protect, admin, restockProduct);
router.delete('/:id', protect, admin, deleteProduct);


export default router;
