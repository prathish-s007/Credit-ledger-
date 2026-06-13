import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Route security
router.use(protect);
router.use(authorize('shop_owner'));

router.get('/stats', getDashboardStats);

export default router;
