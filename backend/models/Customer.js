import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  address: {
    type: String,
    trim: true,
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative'],
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopOwner',
    required: [true, 'Managing Shop Owner reference is required'],
  },
  role: {
    type: String,
    enum: ['customer'],
    default: 'customer',
  },
}, {
  timestamps: true,
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password method
customerSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
