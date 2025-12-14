import express from 'express';
import * as authController from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Register Route
router.post('/register', authController.register);

// Login Route
router.post('/login', authController.login);

// Profile Routes
router.put('/profile', protect, authController.updateProfile);

// Public Referrer Lookup
router.get('/resolve/:username', authController.resolveReferrer);

export default router;