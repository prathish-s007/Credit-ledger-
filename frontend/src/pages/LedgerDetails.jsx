import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import PaymentForm from '../components/PaymentForm';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Plus,
  Receipt,
  RotateCcw,
  Sliders,
  TrendingDown,
  TrendingUp,
  FileDown,
  Printer,
} from 'lucide-react';

const LedgerDetails = () => {
  const { id: customerId } = useParams();

  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Aggregated totals
  const [metrics, setMetrics] = useState({
    totalPurchases: 0,
    totalPayments: 0,
    outstandingBalance: 0,
  });

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [printingPDF, setPrintingPDF] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/ledgers/customer/${customerId}`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setCustomer(response.data.customer);
      setLedger(response.data.ledger);
      setOpeningBalance(response.data.openingBalance);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error fetching customer ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [customerId]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLedger();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(async () => {
      setLoading(true);
      try {
        const response = await API.get(`/ledgers/customer/${customerId}`);
        setCustomer(response.data.customer);
        setLedger(response.data.ledger);
        setOpeningBalance(response.data.openingBalance);
        setMetrics(response.data.metrics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  // 1. Download statement PDF (Axios blob request passing token)
  const handleDownloadStatement = async () => {
    setDownloadingPDF(true);
    try {
      const response = await API.get(`/ledgers/customer/${customerId}/statement/pdf`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        responseType: 'blob', // required to read binary stream
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.download = `statement_${customer?.name.replace(/\s+/g, '_') || 'ledger'}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadLink.href);
    } catch (err) {
      console.error('Failed to download PDF statement:', err);
      alert('Error generating statement PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // 2. Open statement PDF in new print-ready window
  const handlePrintStatement = async () => {
    setPrintingPDF(true);
    try {
      const response = await API.get(`/ledgers/customer/${customerId}/statement/pdf`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobURL = window.URL.createObjectURL(blob);
      const printWindow = window.open(blobURL);
      
      // Auto-trigger window printing once loaded
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (err) {
      console.error('Failed to print statement:', err);
      alert('Error opening print preview module.');
    } finally {
      setPrintingPDF(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-455 hover:text-white transition-colors shrink-0">
        <ArrowLeft size={14} />
        <Link to="/ledgers">Back to Customer Ledgers</Link>
      </div>

      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-400">
            {customer?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{customer?.name}</h2>
            <p className="text-xs text-slate-400 mt-1">Mobile: {customer?.mobileNumber} • {customer?.email || 'No Email'}</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handlePrintStatement}
            disabled={printingPDF}
            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="Print Invoice"
          >
            {printingPDF ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            ) : (
              <Printer size={14} />
            )}
            <span>Print Bill</span>
          </button>

          <button
            onClick={handleDownloadStatement}
            disabled={downloadingPDF}
            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="Download Statement PDF"
          >
            {downloadingPDF ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            ) : (
              <FileDown size={14} />
            )}
            <span>Statement</span>
          </button>

          <button
            onClick={() => setIsPaymentOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-550 hover:to-teal-550 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-550/15"
          >
            <Plus size={14} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Purchases (Debit) */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-455">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Purchases</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{loading ? '...' : `₹${metrics.totalPurchases.toFixed(2)}`}</h3>
            </div>
          </div>
        </div>

        {/* Total Payments (Credit) */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payments</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{loading ? '...' : `₹${metrics.totalPayments.toFixed(2)}`}</h3>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Outstanding Debt</p>
              <h3 className={`text-3xl font-extrabold mt-1 ${metrics.outstandingBalance > 0 ? 'text-rose-455' : 'text-slate-200'}`}>
                {loading ? '...' : `₹${metrics.outstandingBalance.toFixed(2)}`}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">From Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">To Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-slate-955 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Sliders size={14} />
              <span>Apply Filter</span>
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white p-2.5 rounded-xl transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chronological Ledger Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                <th className="py-4 px-4">Transaction Date</th>
                <th className="py-4 px-4">Description</th>
                <th className="py-4 px-4">Reference</th>
                <th className="py-4 px-4">Debit (+)</th>
                <th className="py-4 px-4">Credit (-)</th>
                <th className="py-4 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="w-24 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-32 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-20 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-12 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-12 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="w-16 h-3 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                <>
                  {(startDate || endDate) && (
                    <tr className="bg-slate-950/20 text-slate-500 font-semibold text-xs">
                      <td className="py-3.5 px-4" colSpan="3">
                        Opening Balance (Forward balance from prior transactions)
                      </td>
                      <td className="py-3.5 px-4">-</td>
                      <td className="py-3.5 px-4">-</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-400">
                        ₹{openingBalance.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 px-4 text-center">
                        <div className="max-w-sm mx-auto space-y-2 text-slate-500">
                          <Receipt size={24} className="mx-auto text-slate-650" />
                          <p className="text-xs font-bold">No Ledger Entries Recorded</p>
                          <p className="text-[10px] leading-relaxed">
                            No purchases or payments occurred during the specified timeframe.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry) => {
                      const isPurchase = entry.type === 'purchase';
                      return (
                        <tr key={entry._id} className="hover:bg-slate-850/20 transition-colors text-slate-350 text-xs">
                          <td className="py-3.5 px-4 text-slate-450">
                            {new Date(entry.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide mr-3 ${
                              isPurchase
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-455'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                              {entry.type}
                            </span>
                            <span className="font-semibold text-slate-200">{entry.description}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{entry.reference}</td>
                          <td className="py-3.5 px-4 font-bold text-rose-400">
                            {entry.debit > 0 ? `+₹${entry.debit.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            {entry.credit > 0 ? `-₹${entry.credit.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-white">
                            ₹{entry.remainingBalance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentForm
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        customerId={customerId}
        customerName={customer?.name}
        onSaveSuccess={fetchLedger}
      />
    </div>
  );
};

export default LedgerDetails;
