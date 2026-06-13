import express from 'express';
import { getCustomerLedger } from '../controllers/ledgerController.js';
import { generateCustomerStatementPDF } from '../controllers/pdfController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';

const router = express.Router();

// Route security
router.use(protect);
router.use(authorize('shop_owner', 'customer'));


router.get('/customer/:customerId', validateObjectId, getCustomerLedger);
router.get('/customer/:customerId/statement/pdf', validateObjectId, generateCustomerStatementPDF);

export default router;
