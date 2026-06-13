import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  unit: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    default: 0,
    min: [0, 'Stock quantity cannot be negative'],
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopOwner',
    required: [true, 'Managing Shop Owner reference is required'],
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
export default Product;
