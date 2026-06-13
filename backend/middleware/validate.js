import mongoose from 'mongoose';

/**
 * Request Validation Middleware
 *
 * Pure JavaScript validation (no extra libraries).
 * Each exported function validates req.body for a specific endpoint
 * and calls next() if valid, or returns a 422 with field-level errors.
 */

// ─── Helper ───────────────────────────────────────────────────────────────────
const fail = (res, errors) =>
  res.status(422).json({
    status:  'fail',
    message: 'Validation failed. Please check your input.',
    errors,
  });

const isEmail = (str) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

const isMobile = (str) =>
  /^[6-9]\d{9}$/.test(str); // Indian 10-digit mobile

// ─── Auth Validators ──────────────────────────────────────────────────────────

/**
 * Validate Shop Owner Registration
 */
export const validateRegisterShopOwner = (req, res, next) => {
  const { name, shopName, email, mobileNumber, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });

  if (!shopName || shopName.trim().length < 2)
    errors.push({ field: 'shopName', message: 'Shop name must be at least 2 characters.' });

  if (!email || !isEmail(email))
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });

  if (!mobileNumber || !isMobile(mobileNumber))
    errors.push({ field: 'mobileNumber', message: 'Please provide a valid 10-digit Indian mobile number.' });

  if (!password || password.length < 6)
    errors.push({ field: 'password', message: 'Password must be at least 6 characters.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

/**
 * Validate Shop Owner Login
 */
export const validateLoginShopOwner = (req, res, next) => {
  const { emailOrMobile, password } = req.body;
  const errors = [];

  if (!emailOrMobile || !emailOrMobile.trim())
    errors.push({ field: 'emailOrMobile', message: 'Email or mobile number is required.' });

  if (!password)
    errors.push({ field: 'password', message: 'Password is required.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

/**
 * Validate Customer Login
 */
export const validateLoginCustomer = (req, res, next) => {
  const { mobileNumber, password } = req.body;
  const errors = [];

  if (!mobileNumber || !isMobile(mobileNumber))
    errors.push({ field: 'mobileNumber', message: 'A valid 10-digit mobile number is required.' });

  if (!password)
    errors.push({ field: 'password', message: 'Password is required.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

// ─── Customer Validators ──────────────────────────────────────────────────────

/**
 * Validate Create/Update Customer
 */
export const validateCustomer = (req, res, next) => {
  const { name, mobileNumber, password, creditLimit, currentBalance } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push({ field: 'name', message: 'Customer name must be at least 2 characters.' });

  if (!mobileNumber || !isMobile(mobileNumber))
    errors.push({ field: 'mobileNumber', message: 'Please provide a valid 10-digit mobile number.' });

  // Only require password for creation (POST); not for updates (PUT)
  if (req.method === 'POST' && (!password || password.length < 6))
    errors.push({ field: 'password', message: 'Password must be at least 6 characters.' });

  if (creditLimit !== undefined && (isNaN(Number(creditLimit)) || Number(creditLimit) < 0))
    errors.push({ field: 'creditLimit', message: 'Credit limit must be a non-negative number.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

// ─── Product Validators ───────────────────────────────────────────────────────

/**
 * Validate Create/Update Product
 */
export const validateProduct = (req, res, next) => {
  const { name, price, stockQuantity } = req.body;
  const errors = [];

  if (!name || name.trim().length < 1)
    errors.push({ field: 'name', message: 'Product name is required.' });

  if (price === undefined || isNaN(Number(price)) || Number(price) < 0)
    errors.push({ field: 'price', message: 'Price must be a non-negative number.' });

  if (stockQuantity !== undefined && (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0))
    errors.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative number.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

// ─── Purchase Validators ──────────────────────────────────────────────────────

/**
 * Validate Create Purchase
 */
export const validatePurchase = (req, res, next) => {
  const { customerId, items } = req.body;
  const errors = [];

  if (!customerId || !customerId.trim())
    errors.push({ field: 'customerId', message: 'Customer is required.' });

  if (!Array.isArray(items) || items.length === 0)
    errors.push({ field: 'items', message: 'At least one product item is required.' });
  else {
    items.forEach((item, idx) => {
      if (!item.productId)
        errors.push({ field: `items[${idx}].productId`, message: 'Product ID is required.' });
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) < 1)
        errors.push({ field: `items[${idx}].quantity`, message: 'Quantity must be at least 1.' });
    });
  }

  if (errors.length > 0) return fail(res, errors);
  next();
};

// ─── Payment Validators ───────────────────────────────────────────────────────

/**
 * Validate Create Payment
 */
export const validatePayment = (req, res, next) => {
  const { customerId, amount, paymentMethod } = req.body;
  const errors = [];

  if (!customerId || !customerId.trim())
    errors.push({ field: 'customerId', message: 'Customer is required.' });

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    errors.push({ field: 'amount', message: 'Payment amount must be greater than zero.' });

  const validMethods = ['Cash', 'UPI', 'Bank Transfer'];
  if (paymentMethod && !validMethods.includes(paymentMethod))
    errors.push({ field: 'paymentMethod', message: `Payment method must be one of: ${validMethods.join(', ')}.` });

  if (errors.length > 0) return fail(res, errors);
  next();
};

/**
 * Validate MongoDB ObjectId Parameters
 * Ensures route params (e.g. :id, :customerId) represent valid ObjectIds.
 */
export const validateObjectId = (req, res, next) => {
  const keys = ['id', 'customerId', 'productId', 'purchaseId'];
  for (const key of keys) {
    const val = req.params[key];
    if (val && !mongoose.Types.ObjectId.isValid(val)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid identifier format: ${val}`,
      });
    }
  }
  next();
};

/**
 * Validate Update Shop Owner Profile
 */
export const validateUpdateProfile = (req, res, next) => {
  const { name, shopName, email, mobileNumber } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });

  if (!shopName || shopName.trim().length < 2)
    errors.push({ field: 'shopName', message: 'Shop name must be at least 2 characters.' });

  if (!email || !isEmail(email))
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });

  if (!mobileNumber || !isMobile(mobileNumber))
    errors.push({ field: 'mobileNumber', message: 'Please provide a valid 10-digit Indian mobile number.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

/**
 * Validate Change Password
 */
export const validateUpdatePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword || !currentPassword.trim())
    errors.push({ field: 'currentPassword', message: 'Current password is required.' });

  if (!newPassword || newPassword.length < 6)
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters.' });

  if (newPassword !== confirmPassword)
    errors.push({ field: 'confirmPassword', message: 'Confirmation password does not match.' });

  if (errors.length > 0) return fail(res, errors);
  next();
};

/**
 * Validate Warning Threshold Update
 */
export const validateUpdateThreshold = (req, res, next) => {
  const { creditWarningThreshold } = req.body;
  const errors = [];
  const validThresholds = [70, 80, 90, 100];

  if (creditWarningThreshold === undefined || !validThresholds.includes(Number(creditWarningThreshold))) {
    errors.push({
      field: 'creditWarningThreshold',
      message: `Credit warning threshold must be one of: ${validThresholds.join('%, ')}%.`,
    });
  }

  if (errors.length > 0) return fail(res, errors);
  next();
};
