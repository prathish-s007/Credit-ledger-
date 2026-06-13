import React from 'react';
import { X, Phone, Mail, MapPin, IndianRupee, Award, Calendar } from 'lucide-react';

const CustomerProfileModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const creditLimit = customer.creditLimit || 0;
  const currentBalance = customer.currentBalance || 0;
  const remainingCredit = Math.max(0, creditLimit - currentBalance);

  // Utilization calculation
  const utilizationPercentage = creditLimit > 0
    ? Math.min(100, Math.round((currentBalance / creditLimit) * 100))
    : 0;

  // Determine utilization indicator color
  let progressColor = 'bg-emerald-500';
  if (utilizationPercentage > 85) {
    progressColor = 'bg-rose-500';
  } else if (utilizationPercentage > 50) {
    progressColor = 'bg-amber-550';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-fade-in">
        {/* Top Header Card */}
        <div className="relative bg-gradient-to-tr from-indigo-950/40 to-slate-900 p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-400 shadow-md">
              {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{customer.name}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/40 text-indigo-400 border border-indigo-500/10 uppercase mt-1">
                Customer Record
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 space-y-6">
          {/* Contact Details */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contact details</h4>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3 text-xs text-slate-350">
                <Phone size={14} className="text-indigo-400 shrink-0" />
                <span>{customer.mobileNumber}</span>
              </div>
              {customer.email && (
                <div className="flex items-center space-x-3 text-xs text-slate-350">
                  <Mail size={14} className="text-indigo-400 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start space-x-3 text-xs text-slate-350">
                  <MapPin size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Balance Cards */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left">Credit Ledger Summary</h4>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1">Outstanding Balance</span>
                <span className="text-lg font-black text-rose-400">₹{currentBalance.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1">Total Credit Limit</span>
                <span className="text-lg font-black text-white">₹{creditLimit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="space-y-2 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400">Credit Utilization</span>
              <span className="font-bold text-slate-200">{utilizationPercentage}%</span>
            </div>
            
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                style={{ width: `${utilizationPercentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
              <span>Remaining Pool: ₹{remainingCredit.toFixed(2)}</span>
              <span>Capacity: ₹{creditLimit.toFixed(2)}</span>
            </div>
          </div>

          {/* Profile metadata */}
          <div className="flex justify-between items-center text-[10px] text-slate-550 border-t border-slate-800 pt-4">
            <div className="flex items-center space-x-1.5">
              <Calendar size={11} />
              <span>Created: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Award size={11} />
              <span>ID: {customer._id?.substring(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <footer className="bg-slate-950/50 px-6 py-4 flex justify-end border-t border-slate-800">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-650/15"
          >
            Close Profile
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CustomerProfileModal;
