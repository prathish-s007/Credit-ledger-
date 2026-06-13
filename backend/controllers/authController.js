import jwt from 'jsonwebtoken';
import ShopOwner from '../models/ShopOwner.js';
import Customer from '../models/Customer.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register Shop Owner
// @route   POST /api/auth/register/shop-owner
// @access  Public
export const registerShopOwner = asyncHandler(async (req, res, next) => {
  const { name, shopName, email, mobileNumber, password } = req.body;

  // Check if email or mobile exists
  const emailExists = await ShopOwner.findOne({ email });
  const mobileExists = await ShopOwner.findOne({ mobileNumber });

  if (emailExists || mobileExists) {
    throw new AppError('A shop owner with this email or mobile number already exists.', 400);
  }

  // Create shop owner
  const shopOwner = await ShopOwner.create({
    name,
    shopName,
    email,
    mobileNumber,
    password,
  });

  const token = generateToken(shopOwner._id, 'shop_owner');

  res.status(201).json({
    status: 'success',
    token,
    user: {
      id: shopOwner._id,
      name: shopOwner.name,
      shopName: shopOwner.shopName,
      email: shopOwner.email,
      mobileNumber: shopOwner.mobileNumber,
      role: shopOwner.role,
    },
  });
});

// @desc    Login Shop Owner
// @route   POST /api/auth/login/shop-owner
// @access  Public
export const loginShopOwner = asyncHandler(async (req, res, next) => {
  const { emailOrMobile, password } = req.body;

  if (!emailOrMobile || !password) {
    throw new AppError('Please provide email/mobile and password.', 400);
  }

  // Search by email or mobile
  const shopOwner = await ShopOwner.findOne({
    $or: [
      { email: emailOrMobile.toLowerCase() },
      { mobileNumber: emailOrMobile }
    ],
  });

  if (!shopOwner || !(await shopOwner.comparePassword(password))) {
    throw new AppError('Invalid credentials.', 401);
  }

  const token = generateToken(shopOwner._id, 'shop_owner');

  res.status(200).json({
    status: 'success',
    token,
    user: {
      id: shopOwner._id,
      name: shopOwner.name,
      shopName: shopOwner.shopName,
      email: shopOwner.email,
      mobileNumber: shopOwner.mobileNumber,
      role: shopOwner.role,
    },
  });
});

// @desc    Login Customer
// @route   POST /api/auth/login/customer
// @access  Public
export const loginCustomer = asyncHandler(async (req, res, next) => {
  const { mobileNumber, password } = req.body;

  if (!mobileNumber || !password) {
    throw new AppError('Please provide mobile number and password.', 400);
  }

  const customer = await Customer.findOne({ mobileNumber });

  if (!customer || !(await customer.comparePassword(password))) {
    throw new AppError('Invalid credentials.', 401);
  }

  const token = generateToken(customer._id, 'customer');

  res.status(200).json({
    status: 'success',
    token,
    user: {
      id: customer._id,
      name: customer.name,
      mobileNumber: customer.mobileNumber,
      role: customer.role,
    },
  });
});

// @desc    Register Customer
// @route   POST /api/auth/register/customer
// @access  Public
export const registerCustomer = asyncHandler(async (req, res, next) => {
  const { name, mobileNumber, password } = req.body;

  const mobileExists = await Customer.findOne({ mobileNumber });

  if (mobileExists) {
    throw new AppError('A customer with this mobile number already exists.', 400);
  }

  const customer = await Customer.create({
    name,
    mobileNumber,
    password,
  });

  const token = generateToken(customer._id, 'customer');

  res.status(201).json({
    status: 'success',
    token,
    user: {
      id: customer._id,
      name: customer.name,
      mobileNumber: customer.mobileNumber,
      role: customer.role,
    },
  });
});

// @desc    Get Current User
// @route   GET /api/auth/me
// @access  Protected
export const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});
