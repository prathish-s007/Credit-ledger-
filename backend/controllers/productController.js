import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Add a Product
// @route   POST /api/products
// @access  Protected (Shop Owner Only)
export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, category, unit, price, stockQuantity } = req.body;

  const product = await Product.create({
    name,
    category,
    unit,
    price: parseFloat(price) || 0,
    stockQuantity: parseInt(stockQuantity, 10) || 0,
    shopOwner: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: product,
  });
});

// @desc    Get All Products (with Search, Pagination, Sort)
// @route   GET /api/products
// @access  Protected (Shop Owner Only)
export const getProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;

  // Filter to current shop owner
  const query = {
    shopOwner: req.user._id,
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const sort = { [sortBy]: order };

  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalProducts = await Product.countDocuments(query);

  // Dynamic stock management aggregation calculations for the Shop Owner
  const allProductsForShop = await Product.find({ shopOwner: req.user._id });
  
  let outOfStockCount = 0;
  let lowStockCount = 0;
  let totalValuation = 0;

  allProductsForShop.forEach((prod) => {
    const stock = prod.stockQuantity || 0;
    const price = prod.price || 0;

    if (stock === 0) {
      outOfStockCount++;
    } else if (stock < 10) {
      lowStockCount++;
    }
    totalValuation += stock * price;
  });

  res.status(200).json({
    status: 'success',
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
      totalRecords: totalProducts,
    },
    metrics: {
      totalProducts: allProductsForShop.length,
      outOfStockCount,
      lowStockCount,
      totalValuation,
    },
    data: products,
  });
});

// @desc    Get Product by ID
// @route   GET /api/products/:id
// @access  Protected (Shop Owner Only)
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  // Auth check
  if (product.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this product record.', 403);
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

// @desc    Update a Product
// @route   PUT /api/products/:id
// @access  Protected (Shop Owner Only)
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { name, category, unit, price, stockQuantity } = req.body;

  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  // Auth check
  if (product.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this product record.', 403);
  }

  product.name = name || product.name;
  product.category = category || product.category;
  product.unit = unit || product.unit;
  product.price = price !== undefined ? parseFloat(price) : product.price;
  product.stockQuantity = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : product.stockQuantity;

  const updatedProduct = await product.save();

  res.status(200).json({
    status: 'success',
    data: updatedProduct,
  });
});

// @desc    Delete a Product
// @route   DELETE /api/products/:id
// @access  Protected (Shop Owner Only)
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  // Auth check
  if (product.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this product record.', 403);
  }

  await product.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully.',
  });
});
