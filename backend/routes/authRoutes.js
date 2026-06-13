import express from 'express';
import {
  registerShopOwner,
  loginShopOwner,
  loginCustomer,
  registerCustomer,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRegisterShopOwner,
  validateLoginShopOwner,
  validateLoginCustomer,
  validateCustomer,
} from '../middleware/validate.js';

const router = express.Router();

// POST /api/auth/register/shop-owner
router.post('/register/shop-owner', validateRegisterShopOwner, registerShopOwner);

// POST /api/auth/login/shop-owner
router.post('/login/shop-owner', validateLoginShopOwner, loginShopOwner);

// POST /api/auth/login/customer
router.post('/login/customer', validateLoginCustomer, loginCustomer);

// POST /api/auth/register/customer  (shop owner creates customers)
router.post('/register/customer', protect, validateCustomer, registerCustomer);

// GET /api/auth/me
router.get('/me', protect, getMe);

export default router;
