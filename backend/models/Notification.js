import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    shopOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopOwner',
      required: [true, 'Shop owner reference is required'],
    },
    // Optional: reference to the related customer
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    type: {
      type: String,
      enum: ['credit_limit_warning', 'payment_due_alert', 'end_of_month_reminder', 'general'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'danger', 'success'],
      default: 'info',
    },
    // Additional metadata for linking actions in the frontend
    actionUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast retrieval by shopOwner and read status
notificationSchema.index({ shopOwner: 1, isRead: 1 });
notificationSchema.index({ shopOwner: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
