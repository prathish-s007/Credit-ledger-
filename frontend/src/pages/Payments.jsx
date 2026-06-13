import React, { useState, useEffect } from 'react';
import PaymentForm from '../components/PaymentForm';
import API from '../services/api';
import {
  Plus,
  Search,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  FileText,
  Calendar,
} from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [metrics, setMetrics] = useState({
    totalPaymentsCount: 0,
    totalCollected: 0,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await API.get('/payments', {
        params: {
          search,
          page,
          limit,
        },
      });
      setPayments(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalRecords(response.data.pagination.totalRecords);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error fetching payments list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    setTimeout(fetchPayments, 0);
  };

  return (
    <div className="space-y-8">
      {/* 1. Metrics header summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {/* Total Payments Count */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settle Transactions</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{metrics.totalPaymentsCount}</h3>
            </div>
          </div>
        </div>

        {/* Total Collected Amount */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Collected</p>
              <h3 className="text-3xl font-extrabold text-emerald-450 mt-1">₹{metrics.totalCollected.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls and Actions Panel */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
            <Search className="text-slate-500 mr-2 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search by Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-sm text-slate-200 placeholder-slate-650"
            />
            {search && (
              <button type="button" onClick={handleClearSearch} className="text-slate-500 hover:text-white text-xs px-2">
                Clear
              </button>
            )}
          </form>

          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-550 hover:to-teal-550 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-650/15 text-center shrink-0"
          >
            <Plus size={14} />
            <span>Record Payment</span>
          </button>
        </div>

        {/* 3. Payments History Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                <th className="py-4 px-4">Receipt ID</th>
                <th className="py-4 px-4">Customer Details</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Method</th>
                <th className="py-4 px-4">Remarks</th>
                <th className="py-4 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="w-24 h-3.5 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-slate-800 rounded"></div>
                        <div className="w-16 h-2.5 bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="w-20 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-12 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-28 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="w-16 h-3 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-sm font-semibold text-slate-400">No payment records found</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No transactions registered yet. Click the "Record Payment" button above to credit your first ledger.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((py) => (
                  <tr key={py._id} className="hover:bg-slate-850/20 transition-colors text-slate-350 text-xs">
                    <td className="font-mono text-slate-450 uppercase">
                      {py._id?.substring(0, 12).toUpperCase()}
                    </td>
                    <td className="py-4 px-4">
                      <h4 className="font-bold text-white">{py.customer?.name || 'Unknown'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{py.customer?.mobileNumber || ''}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {new Date(py.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block bg-slate-950/65 border border-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-300">
                        {py.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 truncate max-w-xs">{py.remarks || '-'}</td>
                    <td className="py-4 px-4 text-right font-black text-emerald-400">
                      -₹{(py.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-850">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              Showing page {page} of {totalPages} ({totalRecords} records total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <PaymentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaveSuccess={fetchPayments}
      />
    </div>
  );
};

export default Payments;
