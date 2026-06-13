import Customer from '../models/Customer.js';
import Purchase from '../models/Purchase.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get Admin Dashboard Stats & Chart Series Data
// @route   GET /api/dashboard/stats
// @access  Protected (Shop Owner Only)
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const shopOwnerId = req.user._id;

  // 1. KPI Cards Calculations
  // Total Customers
  const totalCustomers = await Customer.countDocuments({ shopOwner: shopOwnerId });

  // Outstanding Amount (sum of current balances)
  const customers = await Customer.find({ shopOwner: shopOwnerId });
  const outstandingAmount = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  // Total Credit Given (Sum of all-time purchases)
  const allPurchases = await Purchase.find({ shopOwner: shopOwnerId });
  const totalCreditGiven = allPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  // Total Payments Received (Sum of all-time payments)
  const allPayments = await Payment.find({ shopOwner: shopOwnerId });
  const totalPaymentsReceived = allPayments.reduce((sum, py) => sum + (py.amount || 0), 0);

  // 2. 6-Month Chart Data aggregation (Sales vs Collections vs Balance Trend)
  const monthsData = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Define 6-month window start
  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - 5);
  windowStart.setDate(1);
  windowStart.setHours(0, 0, 0, 0);

  // Calculate opening cumulative outstanding balance before the 6-month window starts
  const prePurchases = await Purchase.find({
    shopOwner: shopOwnerId,
    createdAt: { $lt: windowStart },
  });
  const prePayments = await Payment.find({
    shopOwner: shopOwnerId,
    createdAt: { $lt: windowStart },
  });

  const prePurchasesSum = prePurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const prePaymentsSum = prePayments.reduce((sum, py) => sum + (py.amount || 0), 0);
  let cumulativeBalance = prePurchasesSum - prePaymentsSum;

  // Loop through the 6 months in chronological order
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    // Adjust target month
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Query sales (purchases) in target month
    const monthlyPurchases = await Purchase.find({
      shopOwner: shopOwnerId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Query collections (payments) in target month
    const monthlyPayments = await Payment.find({
      shopOwner: shopOwnerId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const sales = monthlyPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const collections = monthlyPayments.reduce((sum, py) => sum + (py.amount || 0), 0);

    // Update running cumulative outstanding balance
    cumulativeBalance += sales - collections;

    monthsData.push({
      month: `${monthNames[month]} ${year.toString().substring(2)}`,
      sales,
      collections,
      outstanding: Math.max(0, cumulativeBalance),
    });
  }

  res.status(200).json({
    status: 'success',
    kpis: {
      totalCustomers,
      outstandingAmount,
      totalCreditGiven,
      totalPaymentsReceived,
    },
    charts: monthsData,
  });
});
