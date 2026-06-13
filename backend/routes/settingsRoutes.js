import express from 'express';
import { 
  updateProfile, 
  changePassword, 
  updateThreshold 
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { 
  validateUpdateProfile, 
  validateUpdatePassword, 
  validateUpdateThreshold 
} from '../middleware/validate.js';

const router = express.Router();

// Apply shop owner security access middleware on all settings routes
router.use(protect);
router.use(authorize('shop_owner'));

// PUT /api/settings/profile
router.put('/profile', validateUpdateProfile, updateProfile);

// PUT /api/settings/password
router.put('/password', validateUpdatePassword, changePassword);

// PUT /api/settings/threshold
router.put('/threshold', validateUpdateThreshold, updateThreshold);

export default router;
