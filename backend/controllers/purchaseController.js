import Purchase from '../models/Purchase.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create a Purchase (Automatic Stock Deduction & Customer Balance Update)
// @route   POST /api/purchases
// @access  Protected (Shop Owner Only)
export const createPurchase = asyncHandler(async (req, res, next) => {
  const { customerId, items } = req.body; // items is [{ productId, quantity }]

  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Please provide a customer and at least one item.', 400);
  }

  // 1. Verify Customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  if (customer.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to record purchases for this customer.', 403);
  }

  // 2. Validate all product stock levels first before saving anything
  const verifiedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const { productId, quantity } = item;
    const parsedQty = parseInt(quantity, 10);

    if (!productId || isNaN(parsedQty) || parsedQty <= 0) {
      throw new AppError('Invalid product selection or quantity.', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(`Product with ID ${productId} not found.`, 404);
    }

    if (product.shopOwner.toString() !== req.user._id.toString()) {
      throw new AppError(`Not authorized to access product "${product.name}".`, 403);
    }

    // Check stock
    if (product.stockQuantity < parsedQty) {
      throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${parsedQty}`, 400);
    }

    const itemTotal = product.price * parsedQty;
    totalAmount += itemTotal;

    verifiedItems.push({
      productDocument: product,
      purchaseItem: {
        product: product._id,
        name: product.name,
        quantity: parsedQty,
        price: product.price,
        total: itemTotal,
      },
    });
  }

  // 3. Process database updates sequentially
  const savedProducts = [];
  for (const item of verifiedItems) {
    const { productDocument, purchaseItem } = item;
    productDocument.stockQuantity -= purchaseItem.quantity;
    await productDocument.save();
    savedProducts.push(purchaseItem);
  }

  // 4. Update Customer balance
  customer.currentBalance += totalAmount;
  await customer.save();

  // 5. Create Purchase log
  const purchase = await Purchase.create({
    customer: customerId,
    products: savedProducts,
    totalAmount,
    shopOwner: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: purchase,
  });
});

// @desc    Get All Purchases (with Search by Customer & Pagination)
// @route   GET /api/purchases
// @access  Protected (Shop Owner Only)
export const getPurchases = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  // First search for matching customers for this shop owner
  let customerQuery = { shopOwner: req.user._id };
  if (search) {
    customerQuery.name = { $regex: search, $options: 'i' };
  }
  const matchingCustomers = await Customer.find(customerQuery).select('_id');
  const customerIds = matchingCustomers.map(c => c._id);

  // Build purchase query matching those customer IDs
  const query = {
    shopOwner: req.user._id,
    customer: { $in: customerIds },
  };

  const purchases = await Purchase.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('customer', 'name mobileNumber');

  const totalPurchases = await Purchase.countDocuments(query);

  // Calculate gross metrics for this Shop Owner
  const allPurchasesForShop = await Purchase.find({ shopOwner: req.user._id });
  const totalSales = allPurchasesForShop.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  res.status(200).json({
    status: 'success',
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalPurchases / limit),
      totalRecords: totalPurchases,
    },
    metrics: {
      totalOrders: allPurchasesForShop.length,
      totalSales,
    },
    data: purchases,
  });
});

// @desc    Get Purchase by ID
// @route   GET /api/purchases/:id
// @access  Protected (Shop Owner Only)
export const getPurchaseById = asyncHandler(async (req, res, next) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('customer', 'name mobileNumber email address');

  if (!purchase) {
    throw new AppError('Purchase record not found.', 404);
  }

  if (purchase.shopOwner.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this purchase record.', 403);
  }

  res.status(200).json({
    status: 'success',
    data: purchase,
  });
});
