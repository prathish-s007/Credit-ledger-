import express from 'express';
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
} from '../controllers/purchaseController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validatePurchase, validateObjectId } from '../middleware/validate.js';

const router = express.Router();

// All purchase routes require authentication and shop_owner role
router.use(protect);
router.use(authorize('shop_owner'));

router.route('/')
  .post(validatePurchase, createPurchase)
  .get(getPurchases);

router.route('/:id')
  .all(validateObjectId)
  .get(getPurchaseById);

export default router;
