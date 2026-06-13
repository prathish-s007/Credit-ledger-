import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Record a Customer Payment
// @route   POST /api/payments
// @access  Protected (Shop Owner Only)
export const createPayment = asyncHandler(async (req, res, next) => {
  const { customerId, amount, paymentMethod, remarks } = req.body;

  if (!customerId || !amount || parseFloat(amount) <= 0) {
    throw new AppError('Please provide customer ID and a valid payment amount.', 400);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  // Auth check
  if (customer.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to record payments for this customer.', 403);
  }

  // Process balance adjustment (subtract payment amount)
  const paymentAmount = parseFloat(amount);
  customer.currentBalance -= paymentAmount;
  await customer.save();

  // Save payment receipt log
  const payment = await Payment.create({
    customer: customerId,
    amount: paymentAmount,
    paymentMethod: paymentMethod || 'Cash',
    remarks: remarks || '',
    shopOwner: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: payment,
  });
});

// @desc    Get All Payments (with Search by Customer & Pagination)
// @route   GET /api/payments
// @access  Protected (Shop Owner Only)
export const getPayments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  // First search matching customers
  let customerQuery = { shopOwner: req.user._id };
  if (search) {
    customerQuery.name = { $regex: search, $options: 'i' };
  }
  const matchingCustomers = await Customer.find(customerQuery).select('_id');
  const customerIds = matchingCustomers.map((c) => c._id);

  // Query payments matching those customer IDs
  const query = {
    shopOwner: req.user._id,
    customer: { $in: customerIds },
  };

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('customer', 'name mobileNumber');

  const totalPayments = await Payment.countDocuments(query);

  // Calculate aggregated metrics
  const allPaymentsForShop = await Payment.find({ shopOwner: req.user._id });
  const totalCollected = allPaymentsForShop.reduce((sum, p) => sum + (p.amount || 0), 0);

  res.status(200).json({
    status: 'success',
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalPayments / limit),
      totalRecords: totalPayments,
    },
    metrics: {
      totalPaymentsCount: allPaymentsForShop.length,
      totalCollected,
    },
    data: payments,
  });
});
