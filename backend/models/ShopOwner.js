import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const shopOwnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
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
  role: {
    type: String,
    enum: ['shop_owner'],
    default: 'shop_owner',
  },
  creditWarningThreshold: {
    type: Number,
    enum: [70, 80, 90, 100],
    default: 80,
  },
}, {
  timestamps: true,
});

// Hash password before saving
shopOwnerSchema.pre('save', async function(next) {
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
shopOwnerSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const ShopOwner = mongoose.model('ShopOwner', shopOwnerSchema);
export default ShopOwner;
