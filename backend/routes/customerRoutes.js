import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCustomer, validateObjectId } from '../middleware/validate.js';

const router = express.Router();

// All customer routes require authentication and shop_owner role
router.use(protect);
router.use(authorize('shop_owner'));

router.route('/')
  .post(validateCustomer, createCustomer)
  .get(getCustomers);

router.route('/:id')
  .all(validateObjectId)
  .get(getCustomerById)
  .put(validateCustomer, updateCustomer)
  .delete(deleteCustomer);

export default router;
