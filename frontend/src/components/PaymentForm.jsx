import React, { useState, useEffect } from 'react';
import { X, IndianRupee, AlertCircle, Save } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';

const PaymentForm = ({ isOpen, onClose, customerId, customerName, onSaveSuccess }) => {
  const isGlobal = !customerId;

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load customer dropdown options if called globally
  useEffect(() => {
    if (isOpen) {
      if (isGlobal) {
        const loadCustomers = async () => {
          try {
            const response = await API.get('/customers', { params: { limit: 100 } });
            setCustomers(response.data.data);
          } catch (err) {
            console.error('Failed to load customer list for payments:', err);
          }
        };
        loadCustomers();
        setSelectedCustomerId('');
      } else {
        setSelectedCustomerId(customerId);
      }

      setAmount('');
      setPaymentMethod('Cash');
      setRemarks('');
      setError('');
    }
  }, [isOpen, customerId, isGlobal]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const targetCustomerId = isGlobal ? selectedCustomerId : customerId;

    if (!targetCustomerId) {
      setError('Please select a customer.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid payment amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: targetCustomerId,
        amount: parsedAmount,
        paymentMethod,
        remarks: remarks.trim() || undefined,
      };

      await API.post('/payments', payload);
      toast.success('Payment recorded successfully!');
      onSaveSuccess();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error processing payment.';
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

      {/* Modal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-950/10">
          <div className="flex items-center space-x-2">
            <IndianRupee className="text-emerald-450" size={18} />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Payment</h3>
              <p className="text-[10px] text-slate-400">
                {isGlobal ? 'Settle balance for customer' : `Settle balance for ${customerName}`}
              </p>
            </div>
          </div>
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
            <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3.5 rounded-2xl text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Dropdown (Visible only in global mode) */}
          {isGlobal && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.mobileNumber}) - Bal: ₹{c.currentBalance?.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Payment Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all duration-300"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">Remarks / Notes</label>
            <input
              type="text"
              placeholder="E.g., Settle outstanding ledger invoice"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all duration-300"
            />
          </div>

          {/* Actions */}
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
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-550 hover:to-teal-550 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-550/15 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
              ) : (
                <>
                  <Save size={14} />
                  <span>Settle Payment</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
