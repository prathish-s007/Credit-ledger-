import Purchase from '../models/Purchase.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get Chronological Ledger for a Customer (with Date Range Filter & Running Balance)
// @route   GET /api/ledgers/customer/:customerId
// @access  Protected (Shop Owner Only)
export const getCustomerLedger = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  const { startDate, endDate } = req.query;

  // 1. Verify Customer
  const customer = await Customer.findById(customerId).select('-password');
  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  // Auth verification (allows managing shop owner or the customer themselves)
  if (
    customer.shopOwner.toString() !== req.user._id.toString() &&
    customer._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to access ledger for this customer.', 403);
  }

  // 2. Compute Opening/Forward Balance before Start Date (if startDate is provided)
  let openingBalance = 0;
  const start = startDate ? new Date(startDate) : null;
  
  if (start) {
    const prePurchases = await Purchase.find({
      customer: customerId,
      createdAt: { $lt: start },
    });
    const prePayments = await Payment.find({
      customer: customerId,
      createdAt: { $lt: start },
    });

    const prePurchasesSum = prePurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const prePaymentsSum = prePayments.reduce((sum, py) => sum + (py.amount || 0), 0);
    openingBalance = prePurchasesSum - prePaymentsSum;
  }

  // 3. Build Date Filter Query
  const dateQuery = {};
  if (start) {
    dateQuery.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateQuery.$lte = end;
  }

  const filterApplied = startDate || endDate;
  const baseQuery = { customer: customerId };
  if (filterApplied) {
    baseQuery.createdAt = dateQuery;
  }

  // 4. Fetch Purchases and Payments in Date Range
  const purchases = await Purchase.find(baseQuery);
  const payments = await Payment.find(baseQuery);

  // 5. Format into standardized ledger entries
  const purchaseEntries = purchases.map((p) => ({
    _id: p._id,
    date: p.createdAt,
    type: 'purchase',
    description: `Purchase: ${p.products?.length || 0} item(s)`,
    reference: p.purchaseId,
    debit: p.totalAmount || 0, // debit increases debt
    credit: 0,
  }));

  const paymentEntries = payments.map((py) => ({
    _id: py._id,
    date: py.createdAt,
    type: 'payment',
    description: `Payment: ${py.paymentMethod}`,
    reference: py.remarks || 'Receipt Payment',
    debit: 0,
    credit: py.amount || 0, // credit reduces debt
  }));

  // 6. Merge and Sort chronologically
  const ledger = [...purchaseEntries, ...paymentEntries];
  ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

  // 7. Calculate Running balances
  let runningBalance = openingBalance;
  const ledgerWithBalances = ledger.map((entry) => {
    runningBalance = runningBalance + entry.debit - entry.credit;
    return {
      ...entry,
      remainingBalance: runningBalance,
    };
  });

  // Sort descending for display (most recent at top)
  ledgerWithBalances.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 8. Fetch overall metrics (All-Time)
  const allPurchases = await Purchase.find({ customer: customerId });
  const allPayments = await Payment.find({ customer: customerId });

  const totalPurchases = allPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPayments = allPayments.reduce((sum, py) => sum + (py.amount || 0), 0);

  res.status(200).json({
    status: 'success',
    customer,
    openingBalance,
    ledger: ledgerWithBalances,
    metrics: {
      totalPurchases,
      totalPayments,
      outstandingBalance: customer.currentBalance,
    },
  });
});
