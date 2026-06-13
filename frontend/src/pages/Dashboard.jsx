import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import API from '../services/api';
import CustomerDashboard from './CustomerDashboard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  Receipt,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useApp();

  const [loading, setLoading] = useState(true);
  
  // Shop Owner States
  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    outstandingAmount: 0,
    totalCreditGiven: 0,
    totalPaymentsReceived: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Customer States
  const [customerLedger, setCustomerLedger] = useState([]);
  const [customerMetrics, setCustomerMetrics] = useState({
    totalPurchases: 0,
    totalPayments: 0,
    outstandingBalance: 0,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === 'shop_owner') {
        const statsRes = await API.get('/dashboard/stats');
        setKpis(statsRes.data.kpis);
        setChartData(statsRes.data.charts);

        // Fetch recent purchases and payments to merge into a short recent transaction list
        const purRes = await API.get('/purchases', { params: { limit: 5 } });
        const payRes = await API.get('/payments', { params: { limit: 5 } });

        const purList = (purRes.data.data || []).map((p) => ({
          _id: p._id,
          date: p.createdAt,
          type: 'Purchase',
          customerName: p.customer?.name || 'Unknown',
          amount: p.totalAmount,
          method: 'On Credit',
          color: 'text-rose-400',
        }));

        const payList = (payRes.data.data || []).map((py) => ({
          _id: py._id,
          date: py.createdAt,
          type: 'Payment',
          customerName: py.customer?.name || 'Unknown',
          amount: py.amount,
          method: py.paymentMethod,
          color: 'text-emerald-400',
        }));

        const combined = [...purList, ...payList];
        combined.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentTransactions(combined.slice(0, 5));
      } else {
        // Customer Role Dashboard
        const ledgerRes = await API.get(`/ledgers/customer/${user.id || user._id}`);
        setCustomerLedger(ledgerRes.data.ledger);
        setCustomerMetrics(ledgerRes.data.metrics);
      }
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Loading ledger intelligence...</p>
      </div>
    );
  }

  // --- CUSTOMER DASHBOARD VIEW --- delegate to dedicated portal page
  if (user.role === 'customer') {
    return <CustomerDashboard />;
  }

  // --- ADMIN DASHBOARD VIEW ---
  return (
    <div className="space-y-8">
      {/* 1. KPIs cards panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Customers</p>
              <h3 className="text-2xl font-black text-white mt-1">{kpis.totalCustomers}</h3>
            </div>
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outstanding Credits</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">₹{kpis.outstandingAmount.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Total Credit Given */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gross Credit Given</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{kpis.totalCreditGiven.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Total Payments Received */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payments Received</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">₹{kpis.totalPaymentsReceived.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Analytical Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales vs Collections (Bar/Area) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Sales vs Collections</h4>
            <p className="text-[10px] text-slate-500 mt-1">Comparison of credit given (sales) vs debt collections</p>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Area type="monotone" dataKey="sales" name="Sales (₹)" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="collections" name="Collections (₹)" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollections)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outstanding Balance Trends (Line) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Outstanding Balance Trend</h4>
            <p className="text-[10px] text-slate-500 mt-1">Cumulative net credit outstanding over months</p>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="outstanding"
                  name="Outstanding (₹)"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 3, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Recent Transactions overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity Log</h4>
            <p className="text-[10px] text-slate-550 mt-1">Real-time ledger events stream</p>
          </div>
          <ArrowUpRight className="text-slate-500" size={16} />
        </div>

        <div className="space-y-3.5">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No recent transactions recorded</p>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-850"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase ${
                    tx.type === 'Purchase'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {tx.type[0]}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{tx.customerName}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {tx.type} • {tx.method}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-black ${tx.color}`}>
                  {tx.type === 'Purchase' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
