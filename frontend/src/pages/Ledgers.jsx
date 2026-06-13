import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CustomerForm from '../components/CustomerForm';
import CustomerProfileModal from '../components/CustomerProfileModal';
import API from '../services/api';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Users,
  TrendingUp,
  Wallet,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';

const Ledgers = () => {
  const { user } = useApp();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // 5 rows per page

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Aggregated metric stats
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalOutstandingBalance: 0,
    totalCreditLimit: 0,
  });

  // Modal control states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // for edit or view
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/customers', {
        params: {
          search,
          sortBy,
          order,
          page,
          limit,
        },
      });
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalRecords(response.data.pagination.totalRecords);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error fetching customer records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search and page resets
  useEffect(() => {
    fetchCustomers();
  }, [sortBy, order, page]);

  // Handle immediate search submissions or clear page index on input change
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    // Directly trigger load since state update occurs on next tick
    setTimeout(fetchCustomers, 0);
  };

  const handleDelete = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
      try {
        await API.delete(`/customers/${customerId}`);
        fetchCustomers();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete customer.');
      }
    }
  };

  const openAddModal = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const openProfileModal = (customer) => {
    setSelectedCustomer(customer);
    setIsProfileOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Metrics Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Accounts</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{metrics.totalCustomers}</h3>
            </div>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outstanding Credits</p>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-1">₹{metrics.totalOutstandingBalance.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Total Credit Limit Capacity */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregate Limits</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">₹{metrics.totalCreditLimit.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter, Sort and Actions Panel */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
            <Search className="text-slate-500 mr-2 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search by Name or Mobile Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-sm text-slate-200 placeholder-slate-600"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-slate-500 hover:text-white text-xs px-2"
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-4 shrink-0">
            {/* Sort selection */}
            <div className="flex items-center space-x-2 text-xs bg-slate-950/60 border border-slate-800 rounded-2xl px-3 py-2">
              <SlidersHorizontal size={14} className="text-slate-500" />
              <select
                value={`${sortBy}-${order}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field);
                  setOrder(dir);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none text-slate-350 cursor-pointer font-semibold"
              >
                <option value="createdAt-desc" className="bg-slate-900 text-slate-200">Newest Created</option>
                <option value="name-asc" className="bg-slate-900 text-slate-200">Alphabetical (A-Z)</option>
                <option value="name-desc" className="bg-slate-900 text-slate-200">Alphabetical (Z-A)</option>
                <option value="currentBalance-desc" className="bg-slate-900 text-slate-200">Outstanding (High-Low)</option>
                <option value="currentBalance-asc" className="bg-slate-900 text-slate-200">Outstanding (Low-High)</option>
                <option value="creditLimit-desc" className="bg-slate-900 text-slate-200">Credit Limit (High-Low)</option>
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-650/15"
            >
              <Plus size={14} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* 3. Customer Ledger Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                <th className="py-4 px-4">Customer Details</th>
                <th className="py-4 px-4">Mobile</th>
                <th className="py-4 px-4">Credit Limit</th>
                <th className="py-4 px-4">Balance</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {loading ? (
                // Skeletons
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800"></div>
                        <div className="space-y-2">
                          <div className="w-28 h-3.5 bg-slate-800 rounded"></div>
                          <div className="w-20 h-2.5 bg-slate-800 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="w-24 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-16 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-16 h-3 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="w-24 h-8 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                // Empty Table
                <tr>
                  <td colSpan="5" className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-sm font-semibold text-slate-400">No customer records found</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        There are no matching entries. Click the "Add Customer" button above to register a new ledger account.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Table Rows
                customers.map((cust) => {
                  const isOverLimit = cust.currentBalance > cust.creditLimit;
                  return (
                    <tr key={cust._id} className="hover:bg-slate-850/20 transition-colors text-slate-300">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-extrabold text-indigo-400">
                            {cust.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{cust.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{cust.email || 'No Email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium">{cust.mobileNumber}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-400">₹{(cust.creditLimit || 0).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-extrabold ${
                          isOverLimit
                            ? 'text-rose-450'
                            : cust.currentBalance > 0
                            ? 'text-indigo-400'
                            : 'text-slate-400'
                        }`}>
                          ₹{(cust.currentBalance || 0).toFixed(2)}
                        </span>
                        {isOverLimit && (
                          <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md ml-2">
                            Limit Exceeded
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Link
                            to={`/ledger/${cust._id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Ledger Sheet"
                          >
                            <BookOpen size={14} />
                          </Link>
                          <button
                            onClick={() => openProfileModal(cust)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(cust._id, cust.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Actions */}
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

      {/* Forms and Overlay Modals */}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customerData={selectedCustomer}
        onSaveSuccess={fetchCustomers}
      />

      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default Ledgers;
