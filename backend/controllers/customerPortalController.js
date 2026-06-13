import Purchase from '../models/Purchase.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── @desc    Get logged-in customer's own profile + balance ──────────────────
// ─── @route   GET /api/customer-portal/profile ────────────────────────────────
// ─── @access  Protected (customer) ────────────────────────────────────────────
export const getMyProfile = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.user._id)
    .select('-password')
    .populate('shopOwner', 'name shopName mobileNumber email');

  if (!customer) {
    throw new AppError('Customer profile not found.', 404);
  }

  res.status(200).json({ status: 'success', data: customer });
});

// ─── @desc    Get logged-in customer's purchase history ───────────────────────
// ─── @route   GET /api/customer-portal/purchases ──────────────────────────────
// ─── @access  Protected (customer) ────────────────────────────────────────────
export const getMyPurchases = asyncHandler(async (req, res, next) => {
  const page  = parseInt(req.query.page, 10)  || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip  = (page - 1) * limit;

  const { startDate, endDate } = req.query;
  const query = { customer: req.user._id };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [purchases, total] = await Promise.all([
    Purchase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Purchase.countDocuments(query),
  ]);

  const allPurchases = await Purchase.find({ customer: req.user._id });
  const totalSpent = allPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0);

  res.status(200).json({
    status: 'success',
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    },
    totalSpent,
    data: purchases,
  });
});

// ─── @desc    Get logged-in customer's payment history ────────────────────────
// ─── @route   GET /api/customer-portal/payments ───────────────────────────────
// ─── @access  Protected (customer) ────────────────────────────────────────────
export const getMyPayments = asyncHandler(async (req, res, next) => {
  const page  = parseInt(req.query.page, 10)  || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip  = (page - 1) * limit;

  const { startDate, endDate } = req.query;
  const query = { customer: req.user._id };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  const allPayments = await Payment.find({ customer: req.user._id });
  const totalPaid = allPayments.reduce((s, p) => s + (p.amount || 0), 0);

  res.status(200).json({
    status: 'success',
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    },
    totalPaid,
    data: payments,
  });
});

// ─── @desc    Get dashboard summary for the logged-in customer ────────────────
// ─── @route   GET /api/customer-portal/summary ────────────────────────────────
// ─── @access  Protected (customer) ────────────────────────────────────────────
export const getMySummary = asyncHandler(async (req, res, next) => {
  const customerId = req.user._id;

  const customer = await Customer.findById(customerId)
    .select('-password')
    .populate('shopOwner', 'name shopName mobileNumber email');

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  const [allPurchases, allPayments, recentPurchases, recentPayments] = await Promise.all([
    Purchase.find({ customer: customerId }),
    Payment.find({ customer: customerId }),
    Purchase.find({ customer: customerId }).sort({ createdAt: -1 }).limit(5),
    Payment.find({ customer: customerId }).sort({ createdAt: -1 }).limit(5),
  ]);

  const totalSpent   = allPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalPaid    = allPayments.reduce((s, p)  => s + (p.amount || 0), 0);

  // Monthly chart data — last 6 months
  const now      = new Date();
  const months   = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key:    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label:  d.toLocaleString('default', { month: 'short' }),
      start:  new Date(d.getFullYear(), d.getMonth(), 1),
      end:    new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });

  const chartData = months.map(({ label, start, end }) => {
    const purchases = allPurchases
      .filter(p => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end)
      .reduce((s, p) => s + p.totalAmount, 0);

    const payments = allPayments
      .filter(p => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end)
      .reduce((s, p) => s + p.amount, 0);

    return { month: label, purchases: +purchases.toFixed(2), payments: +payments.toFixed(2) };
  });

  res.status(200).json({
    status: 'success',
    customer,
    metrics: {
      totalPurchases:      totalSpent,
      totalPayments:       totalPaid,
      outstandingBalance:  customer.currentBalance,
      creditLimit:         customer.creditLimit,
      creditUsagePercent:  customer.creditLimit > 0
        ? Math.min(100, Math.round((customer.currentBalance / customer.creditLimit) * 100))
        : 0,
      purchaseCount:  allPurchases.length,
      paymentCount:   allPayments.length,
    },
    chartData,
    recentActivity: [...recentPurchases.map(p => ({
      _id: p._id, date: p.createdAt, type: 'purchase',
      description: `Purchase: ${p.products?.length || 0} item(s)`,
      reference: p.purchaseId, amount: p.totalAmount,
    })), ...recentPayments.map(p => ({
      _id: p._id, date: p.createdAt, type: 'payment',
      description: `Payment via ${p.paymentMethod}`,
      reference: p.remarks || 'Settlement', amount: p.amount,
    }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
  });
});
