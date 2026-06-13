import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';

const CustomerForm = ({ isOpen, onClose, customerData, onSaveSuccess }) => {
  const isEdit = !!customerData;

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && customerData) {
        setName(customerData.name || '');
        setMobileNumber(customerData.mobileNumber || '');
        setEmail(customerData.email || '');
        setAddress(customerData.address || '');
        setCreditLimit(customerData.creditLimit?.toString() || '0');
        setCurrentBalance(customerData.currentBalance?.toString() || '0');
        setPassword('');
      } else {
        setName('');
        setMobileNumber('');
        setEmail('');
        setAddress('');
        setCreditLimit('10000');
        setCurrentBalance('0');
        setPassword('');
      }
      setError('');
    }
  }, [isOpen, customerData, isEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!mobileNumber.trim() || !/^\d{10}$/.test(mobileNumber)) {
      setError('A valid 10-digit mobile number is required.');
      return;
    }
    if (email.trim() && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please provide a valid email format.');
      return;
    }
    if (parseFloat(creditLimit) < 0) {
      setError('Credit limit cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        mobileNumber,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: parseFloat(creditLimit) || 0,
      };

      if (isEdit) {
        payload.currentBalance = parseFloat(currentBalance) || 0;
        await API.put(`/customers/${customerData._id}`, payload);
        toast.success('Customer updated successfully!');
      } else {
        payload.password = password.trim() || '123456'; // Default temporary password
        await API.post('/customers', payload);
        toast.success('Customer created successfully!');
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error saving customer information.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? 'Edit Customer Details' : 'Add New Customer'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Mobile Number</label>
              <input
                type="tel"
                placeholder="10-digit number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Email (Optional)</label>
              <input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>

            {/* Credit Limit */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Credit Limit (₹)</label>
              <input
                type="number"
                placeholder="10000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Physical Address</label>
            <input
              type="text"
              placeholder="123 Main St, Suite A"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
            />
          </div>

          {isEdit ? (
            /* Current Balance (only editable during edit mode) */
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Outstanding Balance (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
            </div>
          ) : (
            /* Initial password setup (only during add mode) */
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
                Initial Login Password
              </label>
              <input
                type="text"
                placeholder="Enter password (default: 123456)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Note: Used by the customer to sign in to their mobile portal.
              </span>
            </div>
          )}

          {/* Footer Actions */}
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
                  <span>{isEdit ? 'Save Changes' : 'Create Customer'}</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
