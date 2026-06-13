import express from 'express';
import {
  getMyProfile,
  getMyPurchases,
  getMyPayments,
  getMySummary,
} from '../controllers/customerPortalController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes — authenticated customer only
router.use(protect);
router.use(authorize('customer'));

// GET /api/customer-portal/summary   — full dashboard data (metrics + chart + recent)
router.get('/summary', getMySummary);

// GET /api/customer-portal/profile   — own profile details
router.get('/profile', getMyProfile);

// GET /api/customer-portal/purchases — own purchase history (paginated, date-filterable)
router.get('/purchases', getMyPurchases);

// GET /api/customer-portal/payments  — own payment history (paginated, date-filterable)
router.get('/payments', getMyPayments);

export default router;
