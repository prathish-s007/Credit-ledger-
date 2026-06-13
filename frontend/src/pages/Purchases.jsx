import React, { useState, useEffect } from 'react';
import PurchaseForm from '../components/PurchaseForm';
import API from '../services/api';
import {
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
} from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalSales: 0,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Selected purchase for viewing details
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await API.get('/purchases', {
        params: {
          search,
          page,
          limit,
        },
      });
      setPurchases(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalRecords(response.data.pagination.totalRecords);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error fetching purchase transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPurchases();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    setTimeout(fetchPurchases, 0);
  };

  const openDetailModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* 1. Metrics header summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Purchases</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{metrics.totalOrders}</h3>
            </div>
          </div>
        </div>

        {/* Gross Sales */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gross Credited Sales</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">₹{metrics.totalSales.toFixed(2)}</h3>
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
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-650/15 text-center shrink-0"
          >
            <Plus size={14} />
            <span>New Purchase</span>
          </button>
        </div>

        {/* 3. Purchases History Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                <th className="py-4 px-4">Purchase ID</th>
                <th className="py-4 px-4">Customer Details</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Items Count</th>
                <th className="py-4 px-4">Total Price</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="w-28 h-3.5 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-slate-800 rounded"></div>
                        <div className="w-16 h-2.5 bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="w-20 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-8 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-16 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="w-12 h-8 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-sm font-semibold text-slate-400">No purchase records found</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No transactions registered yet. Click the "New Purchase" button above to record your first transaction.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => {
                  const itemsCount = pur.products?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  return (
                    <tr key={pur._id} className="hover:bg-slate-850/20 transition-colors text-slate-350">
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">
                        {pur.purchaseId || pur._id?.substring(0, 12).toUpperCase()}
                      </td>
                      <td className="py-4 px-4">
                        <h4 className="text-xs font-bold text-white">{pur.customer?.name || 'Unknown User'}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{pur.customer?.mobileNumber || ''}</p>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {new Date(pur.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-450">{itemsCount} units</td>
                      <td className="py-4 px-4 text-xs font-bold text-indigo-400">₹{(pur.totalAmount || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(pur)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
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

      {/* Transaction Details Modal */}
      {isDetailOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)}></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-fade-in">
            <header className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-950/20">
              <div className="flex items-center space-x-2">
                <FileText className="text-indigo-400" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Purchase Invoice</h3>
                  <span className="text-[10px] font-mono text-slate-500">{selectedPurchase.purchaseId}</span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-6 space-y-6">
              {/* Customer summary */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer</span>
                  <span className="text-white font-bold block mt-1">{selectedPurchase.customer?.name || 'Unknown'}</span>
                  <span className="text-slate-450 block mt-0.5">{selectedPurchase.customer?.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date & Time</span>
                  <span className="text-slate-300 font-semibold block mt-1">
                    {new Date(selectedPurchase.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    {new Date(selectedPurchase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Purchased Items</h4>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/25">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 bg-slate-950/45 uppercase px-4 py-2">
                        <th className="py-2 px-4">Item</th>
                        <th className="py-2 px-4 w-16 text-center">Qty</th>
                        <th className="py-2 px-4">Price</th>
                        <th className="py-2 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-300">
                      {selectedPurchase.products?.map((item) => (
                        <tr key={item._id}>
                          <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4">₹{item.price?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-200">₹{(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Balance */}
              <div className="flex justify-between items-center bg-indigo-950/15 border border-indigo-905/30 px-5 py-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Total Credited</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Charged to Outstanding Balance</span>
                </div>
                <span className="text-xl font-black text-indigo-400">₹{selectedPurchase.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <footer className="bg-slate-950/50 px-6 py-4 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Invoice
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Cart modal */}
      <PurchaseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaveSuccess={fetchPurchases}
      />
    </div>
  );
};

export default Purchases;
