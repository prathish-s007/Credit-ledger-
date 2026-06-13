import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, ShoppingBag, Save } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';

const PurchaseForm = ({ isOpen, onClose, onSaveSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cart, setCart] = useState([]); // [{ product, quantity }]

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load Customers & Products options
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        try {
          const custRes = await API.get('/customers', { params: { limit: 100 } });
          const prodRes = await API.get('/products', { params: { limit: 100 } });
          setCustomers(custRes.data.data);
          setProducts(prodRes.data.data);
        } catch (err) {
          console.error('Failed to load transaction dropdown options:', err);
        }
      };

      loadOptions();
      setSelectedCustomerId('');
      setSelectedProductId('');
      setCart([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add Product to Cart
  const handleAddToCart = () => {
    setError('');
    if (!selectedProductId) return;

    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return;

    // Check if product is already in cart
    const existingIndex = cart.findIndex((item) => item.product._id === product._id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + 1;

      if (newQty > product.stockQuantity) {
        setError(`Cannot add more "${product.name}". Only ${product.stockQuantity} items in stock.`);
        return;
      }

      newCart[existingIndex].quantity = newQty;
      setCart(newCart);
    } else {
      if (product.stockQuantity < 1) {
        setError(`"${product.name}" is currently out of stock.`);
        return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }

    setSelectedProductId('');
  };

  // Adjust quantity
  const handleQtyChange = (index, value) => {
    setError('');
    const newCart = [...cart];
    const qty = parseInt(value, 10);
    const product = newCart[index].product;

    if (isNaN(qty) || qty <= 0) {
      newCart[index].quantity = 1;
    } else if (qty > product.stockQuantity) {
      setError(`Only ${product.stockQuantity} items of "${product.name}" are in stock.`);
      newCart[index].quantity = product.stockQuantity;
    } else {
      newCart[index].quantity = qty;
    }

    setCart(newCart);
  };

  // Remove from cart
  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  // Calculate cart totals
  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    // Verify stock counts one more time locally
    for (const item of cart) {
      if (item.quantity > item.product.stockQuantity) {
        setError(`Insufficient stock for "${item.product.name}". Available: ${item.product.stockQuantity}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
      };

      await API.post('/purchases', payload);
      toast.success('Purchase recorded successfully!');
      onSaveSuccess();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error executing purchase transaction.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-white">Record Purchase Order</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Form Body (Scrollable content) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
          {error && (
            <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3.5 rounded-2xl text-xs shrink-0">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 shrink-0">
            {/* Customer Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.mobileNumber}) - Bal: ₹{c.currentBalance?.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Select Product</label>
              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id} disabled={p.stockQuantity <= 0}>
                      {p.name} (₹{p.price?.toFixed(2)}) - Stock: {p.stockQuantity} {p.unit} {p.stockQuantity <= 0 ? '(Out of stock)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-4 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cart Table Area (Flexible height) */}
          <div className="flex-1 min-h-[150px] border border-slate-800 rounded-2xl overflow-hidden flex flex-col bg-slate-950/40">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/80">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4 w-28">Quantity</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/45">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 px-4 text-center">
                        <div className="max-w-xs mx-auto space-y-2 text-slate-550">
                          <ShoppingBag size={24} className="mx-auto text-slate-650" />
                          <p className="text-xs font-semibold">Shopping Cart is Empty</p>
                          <p className="text-[10px] leading-relaxed">
                            Pick products from the dropdown above and click "Add" to list items in this order.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={item.product._id} className="text-slate-300 text-xs">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>
                            <span>{item.product.name}</span>
                            <span className="block text-[9px] font-bold text-indigo-400 mt-0.5">
                              Stock: {item.product.stockQuantity} {item.product.unit}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">₹{item.product.price?.toFixed(2)}</td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="1"
                            max={item.product.stockQuantity}
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-center text-xs text-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer Banner */}
            {cart.length > 0 && (
              <footer className="border-t border-slate-850 bg-slate-950/80 px-6 py-4 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Total:</span>
                <span className="text-xl font-black text-indigo-400">₹{calculateCartTotal().toFixed(2)}</span>
              </footer>
            )}
          </div>

          {/* Form Actions Footer */}
          <footer className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-550/15 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
              ) : (
                <>
                  <Save size={14} />
                  <span>Submit Purchase</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default PurchaseForm;
