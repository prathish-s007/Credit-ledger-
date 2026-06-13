import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateProduct, validateObjectId } from '../middleware/validate.js';

const router = express.Router();

// All product routes require authentication and shop_owner role
router.use(protect);
router.use(authorize('shop_owner'));

router.route('/')
  .post(validateProduct, createProduct)
  .get(getProducts);

router.route('/:id')
  .all(validateObjectId)
  .get(getProductById)
  .put(validateProduct, updateProduct)
  .delete(deleteProduct);

export default router;
