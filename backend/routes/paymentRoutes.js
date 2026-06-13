import express from 'express';
import { createPayment, getPayments } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validatePayment } from '../middleware/validate.js';

const router = express.Router();

// All payment routes require authentication and shop_owner role
router.use(protect);
router.use(authorize('shop_owner'));

router.route('/')
  .post(validatePayment, createPayment)
  .get(getPayments);

export default router;
