import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';

const ProductForm = ({ isOpen, onClose, productData, onSaveSuccess }) => {
  const isEdit = !!productData;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState('0');
  const [stockQuantity, setStockQuantity] = useState('0');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && productData) {
        setName(productData.name || '');
        setCategory(productData.category || '');
        setUnit(productData.unit || 'pcs');
        setPrice(productData.price?.toString() || '0');
        setStockQuantity(productData.stockQuantity?.toString() || '0');
      } else {
        setName('');
        setCategory('');
        setUnit('pcs');
        setPrice('0');
        setStockQuantity('0');
      }
      setError('');
    }
  }, [isOpen, productData, isEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Input Validations
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!unit.trim()) {
      setError('Unit of measurement is required.');
      return;
    }
    if (parseFloat(price) < 0) {
      setError('Price cannot be negative.');
      return;
    }
    if (parseInt(stockQuantity, 10) < 0) {
      setError('Stock quantity cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        category,
        unit,
        price: parseFloat(price) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
      };

      if (isEdit) {
        await API.put(`/products/${productData._id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await API.post('/products', payload);
        toast.success('Product added successfully!');
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error saving product information.';
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? 'Edit Product Details' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Product Name</label>
            <input
              type="text"
              placeholder="Fresh Apple"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Category</label>
            <input
              type="text"
              placeholder="Groceries, Hardware, etc."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Unit */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Unit</label>
              <input
                type="text"
                placeholder="kg, pcs, liter"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="2.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>

            {/* Stock */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Stock Qty</label>
              <input
                type="number"
                placeholder="50"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-800">
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
                  <span>{isEdit ? 'Save Changes' : 'Add Product'}</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
