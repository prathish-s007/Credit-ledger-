import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  name: {
    type: String,
    required: [true, 'Product name snapshot is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: [true, 'Price snapshot is required'],
    min: [0, 'Price cannot be negative'],
  },
  total: {
    type: Number,
    required: [true, 'Item total is required'],
    min: [0, 'Item total cannot be negative'],
  },
});

const purchaseSchema = new mongoose.Schema({
  purchaseId: {
    type: String,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer reference is required'],
  },
  products: [purchaseItemSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopOwner',
    required: [true, 'Managing Shop Owner reference is required'],
  },
}, {
  timestamps: true,
});

// Auto-generate a readable purchase ID before saving
purchaseSchema.pre('save', function(next) {
  if (!this.purchaseId) {
    this.purchaseId = `PUR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
