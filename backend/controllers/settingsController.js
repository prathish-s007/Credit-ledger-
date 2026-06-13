import ShopOwner from '../models/ShopOwner.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Update Shop Owner Profile Settings
// @route   PUT /api/settings/profile
// @access  Protected (Shop Owner Only)
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, shopName, email, mobileNumber } = req.body;
  const shopOwnerId = req.user._id;

  // 1. Check if email is already in use by another shop owner
  const existingEmail = await ShopOwner.findOne({ 
    email: email.toLowerCase(), 
    _id: { $ne: shopOwnerId } 
  });
  if (existingEmail) {
    throw new AppError('Email address is already registered to another shop owner.', 400);
  }

  // 2. Check if mobile number is already in use by another shop owner
  const existingMobile = await ShopOwner.findOne({ 
    mobileNumber, 
    _id: { $ne: shopOwnerId } 
  });
  if (existingMobile) {
    throw new AppError('Mobile number is already registered to another shop owner.', 400);
  }

  // 3. Find and update the shop owner
  const shopOwner = await ShopOwner.findById(shopOwnerId);
  if (!shopOwner) {
    throw new AppError('Shop owner account not found.', 404);
  }

  shopOwner.name = name;
  shopOwner.shopName = shopName;
  shopOwner.email = email;
  shopOwner.mobileNumber = mobileNumber;

  await shopOwner.save();

  // Return updated shop owner details (excluding password)
  const updatedUser = {
    id: shopOwner._id,
    _id: shopOwner._id,
    name: shopOwner.name,
    shopName: shopOwner.shopName,
    email: shopOwner.email,
    mobileNumber: shopOwner.mobileNumber,
    role: shopOwner.role,
    creditWarningThreshold: shopOwner.creditWarningThreshold,
  };

  res.status(200).json({
    status: 'success',
    message: 'Profile settings updated successfully.',
    data: updatedUser,
  });
});

// @desc    Change Shop Owner Password
// @route   PUT /api/settings/password
// @access  Protected (Shop Owner Only)
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const shopOwnerId = req.user._id;

  // 1. Fetch shop owner with password (since select('-password') was used in auth)
  const shopOwner = await ShopOwner.findById(shopOwnerId);
  if (!shopOwner) {
    throw new AppError('Shop owner account not found.', 404);
  }

  // 2. Verify current password
  const isMatch = await shopOwner.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  // 3. Save new password (pre-save hook will hash it)
  shopOwner.password = newPassword;
  await shopOwner.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully.',
  });
});

// @desc    Update Credit Limit Warning Threshold Setting
// @route   PUT /api/settings/threshold
// @access  Protected (Shop Owner Only)
export const updateThreshold = asyncHandler(async (req, res, next) => {
  const { creditWarningThreshold } = req.body;
  const shopOwnerId = req.user._id;

  const shopOwner = await ShopOwner.findById(shopOwnerId);
  if (!shopOwner) {
    throw new AppError('Shop owner account not found.', 404);
  }

  shopOwner.creditWarningThreshold = Number(creditWarningThreshold);
  await shopOwner.save();

  res.status(200).json({
    status: 'success',
    message: 'Credit warning threshold updated successfully.',
    data: {
      creditWarningThreshold: shopOwner.creditWarningThreshold,
    },
  });
});
