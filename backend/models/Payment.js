import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer reference is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0'],
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer'],
    default: 'Cash',
  },
  remarks: {
    type: String,
    trim: true,
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopOwner',
    required: [true, 'Managing Shop Owner reference is required'],
  },
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
