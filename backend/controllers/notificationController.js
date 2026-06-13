import Notification from '../models/Notification.js';
import Customer from '../models/Customer.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── Helper: Create a notification ────────────────────────────────────────────
const createNotification = async ({ shopOwner, customer = null, type, title, message, severity = 'info', actionUrl = null }) => {
  return await Notification.create({ shopOwner, customer, type, title, message, severity, actionUrl });
};

// ─── @desc    Get all notifications for the logged-in shop owner ───────────────
// ─── @route   GET /api/notifications ──────────────────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = req.query.unreadOnly === 'true'
    ? { shopOwner: req.user._id, isRead: false }
    : { shopOwner: req.user._id };

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('customer', 'name mobileNumber');

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ shopOwner: req.user._id, isRead: false });

  res.status(200).json({
    status: 'success',
    unreadCount,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    },
    data: notifications,
  });
});

// ─── @desc    Get unread notification count only (for bell badge) ──────────────
// ─── @route   GET /api/notifications/unread-count ─────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const unreadCount = await Notification.countDocuments({ shopOwner: req.user._id, isRead: false });
  res.status(200).json({ status: 'success', unreadCount });
});

// ─── @desc    Mark a single notification as read ───────────────────────────────
// ─── @route   PATCH /api/notifications/:id/read ───────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, shopOwner: req.user._id });

  if (!notification) {
    throw new AppError('Notification not found.', 404);
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ status: 'success', data: notification });
});

// ─── @desc    Mark all notifications as read ──────────────────────────────────
// ─── @route   PATCH /api/notifications/read-all ───────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ shopOwner: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ status: 'success', message: 'All notifications marked as read.' });
});

// ─── @desc    Delete a single notification ────────────────────────────────────
// ─── @route   DELETE /api/notifications/:id ───────────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, shopOwner: req.user._id });

  if (!notification) {
    throw new AppError('Notification not found.', 404);
  }

  await notification.deleteOne();
  res.status(200).json({ status: 'success', message: 'Notification deleted.' });
});

// ─── @desc    Delete all notifications (clear all) ────────────────────────────
// ─── @route   DELETE /api/notifications ───────────────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const deleteAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ shopOwner: req.user._id });
  res.status(200).json({ status: 'success', message: 'All notifications cleared.' });
});

// ─── @desc    Generate system notifications (Credit Limit, Month End, Payment Due)
// ─── @route   POST /api/notifications/generate ────────────────────────────────
// ─── @access  Protected (shop_owner) ──────────────────────────────────────────
export const generateSystemNotifications = asyncHandler(async (req, res, next) => {
  const shopOwnerId = req.user._id;
  const generated = [];

  // Retrieve creditWarningThreshold setting, default to 80 if not set
  const threshold = req.user.creditWarningThreshold || 80;
  const thresholdFactor = threshold / 100;

  // Fetch all customers for this shop owner
  const customers = await Customer.find({ shopOwner: shopOwnerId });

  for (const customer of customers) {
    const balance = customer.currentBalance || 0;
    const limit = customer.creditLimit || 0;

    // 1. Credit Limit Warning — balance is ≥ threshold% of credit limit
    if (limit > 0 && balance >= limit * thresholdFactor) {
      const usagePercent = Math.round((balance / limit) * 100);
      const severity = balance >= limit ? 'danger' : 'warning';

      // Avoid duplicate unread notifications of same type for same customer
      const existingCreditWarning = await Notification.findOne({
        shopOwner: shopOwnerId,
        customer: customer._id,
        type: 'credit_limit_warning',
        isRead: false,
      });

      if (!existingCreditWarning) {
        const notif = await createNotification({
          shopOwner: shopOwnerId,
          customer: customer._id,
          type: 'credit_limit_warning',
          title: `Credit Limit ${balance >= limit ? 'Exceeded' : 'Warning'}: ${customer.name}`,
          message: `${customer.name} has used ${usagePercent}% of their credit limit. Current balance: Rs.${balance.toFixed(2)} / Rs.${limit.toFixed(2)}.`,
          severity,
          actionUrl: `/ledger/${customer._id}`,
        });
        generated.push(notif);
      }
    }

    // 2. Payment Due Alert — customer has outstanding balance > 0
    if (balance > 0) {
      const existingPaymentAlert = await Notification.findOne({
        shopOwner: shopOwnerId,
        customer: customer._id,
        type: 'payment_due_alert',
        isRead: false,
      });

      if (!existingPaymentAlert) {
        const notif = await createNotification({
          shopOwner: shopOwnerId,
          customer: customer._id,
          type: 'payment_due_alert',
          title: `Payment Due: ${customer.name}`,
          message: `${customer.name} has an outstanding balance of Rs.${balance.toFixed(2)} pending settlement.`,
          severity: 'warning',
          actionUrl: `/ledger/${customer._id}`,
        });
        generated.push(notif);
      }
    }
  }

  // 3. End of Month Reminder — fire once near the end of month (day 25+)
  const today = new Date();
  if (today.getDate() >= 25) {
    const existingMonthEnd = await Notification.findOne({
      shopOwner: shopOwnerId,
      type: 'end_of_month_reminder',
      isRead: false,
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 25),
      },
    });

    if (!existingMonthEnd) {
      const monthName = today.toLocaleString('default', { month: 'long' });
      const notif = await createNotification({
        shopOwner: shopOwnerId,
        customer: null,
        type: 'end_of_month_reminder',
        title: `End of ${monthName} — Generate Statements`,
        message: `It's the last week of ${monthName}. Remember to generate monthly billing statements and reconcile outstanding ledgers with your customers.`,
        severity: 'info',
        actionUrl: `/ledgers`,
      });
      generated.push(notif);
    }
  }

  res.status(201).json({
    status: 'success',
    message: `${generated.length} new notification(s) generated.`,
    data: generated,
  });
});
