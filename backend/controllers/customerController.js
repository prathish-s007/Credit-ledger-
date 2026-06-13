import Customer from '../models/Customer.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Add a Customer
// @route   POST /api/customers
// @access  Protected (Shop Owner Only)
export const createCustomer = asyncHandler(async (req, res, next) => {
  const { name, mobileNumber, email, address, creditLimit, password } = req.body;

  // Check if customer mobile number exists
  const mobileExists = await Customer.findOne({ mobileNumber });
  if (mobileExists) {
    throw new AppError('A customer with this mobile number already exists.', 400);
  }

  // Set default password if none provided
  const customerPassword = password || '123456';

  const customer = await Customer.create({
    name,
    mobileNumber,
    email,
    address,
    creditLimit: parseFloat(creditLimit) || 0,
    currentBalance: 0, // starts at zero balance
    password: customerPassword,
    shopOwner: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: customer,
  });
});

// @desc    Get All Customers (with Search, Pagination, Sort)
// @route   GET /api/customers
// @access  Protected (Shop Owner Only)
export const getCustomers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;

  // Search query object (restricted to current shop owner)
  const query = {
    shopOwner: req.user._id,
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobileNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Sort definition
  const sort = { [sortBy]: order };

  // Fetch matching customers
  const customers = await Customer.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-password');

  // Count total matching
  const totalCustomers = await Customer.countDocuments(query);

  // Calculate aggregated metrics for the current Shop Owner
  const allCustomersForShop = await Customer.find({ shopOwner: req.user._id });
  const totalOutstandingBalance = allCustomersForShop.reduce(
    (sum, cust) => sum + (cust.currentBalance || 0),
    0
  );
  const totalCreditLimit = allCustomersForShop.reduce(
    (sum, cust) => sum + (cust.creditLimit || 0),
    0
  );

  res.status(200).json({
    status: 'success',
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCustomers / limit),
      totalRecords: totalCustomers,
    },
    metrics: {
      totalCustomers: allCustomersForShop.length,
      totalOutstandingBalance,
      totalCreditLimit,
    },
    data: customers,
  });
});

// @desc    Get Customer by ID
// @route   GET /api/customers/:id
// @access  Protected (Shop Owner & Owner of that customer)
export const getCustomerById = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id).select('-password');

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  // Access check: Ensure the customer belongs to the logged-in Shop Owner
  if (customer.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this customer record.', 403);
  }

  res.status(200).json({
    status: 'success',
    data: customer,
  });
});

// @desc    Update a Customer
// @route   PUT /api/customers/:id
// @access  Protected (Shop Owner Only)
export const updateCustomer = asyncHandler(async (req, res, next) => {
  const { name, mobileNumber, email, address, creditLimit, currentBalance } = req.body;

  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  // Access check
  if (customer.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to modify this customer record.', 403);
  }

  // Check if updating mobile number to one already in use
  if (mobileNumber && mobileNumber !== customer.mobileNumber) {
    const mobileExists = await Customer.findOne({ mobileNumber });
    if (mobileExists) {
      throw new AppError('A customer with this mobile number already exists.', 400);
    }
  }

  // Update fields
  customer.name = name || customer.name;
  customer.mobileNumber = mobileNumber || customer.mobileNumber;
  customer.email = email !== undefined ? email : customer.email;
  customer.address = address !== undefined ? address : customer.address;
  customer.creditLimit = creditLimit !== undefined ? parseFloat(creditLimit) : customer.creditLimit;
  customer.currentBalance = currentBalance !== undefined ? parseFloat(currentBalance) : customer.currentBalance;

  const updatedCustomer = await customer.save();

  res.status(200).json({
    status: 'success',
    data: updatedCustomer,
  });
});

// @desc    Delete a Customer
// @route   DELETE /api/customers/:id
// @access  Protected (Shop Owner Only)
export const deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  // Access check
  if (customer.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this customer record.', 403);
  }

  await customer.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Customer deleted successfully.',
  });
});
