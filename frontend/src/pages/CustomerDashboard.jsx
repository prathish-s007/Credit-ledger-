import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import API from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  FileDown,
  Printer,
} from 'lucide-react';

// ─── Reusable KPI card ────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, glow }) => (
  <div className={`relative bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-xl group hover:border-slate-700 transition-all duration-300`}>
    <div className={`absolute top-0 right-0 w-28 h-28 ${glow} rounded-full filter blur-3xl opacity-60`} />
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    <h3 className="text-3xl font-black text-white mt-1">{value}</h3>
    {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
  </div>
);

// ─── Credit usage gauge bar ───────────────────────────────────────────────────
const CreditGauge = ({ used, limit, percent }) => {
  const barColor = percent >= 100 ? 'from-rose-600 to-rose-500' :
                   percent >= 80  ? 'from-amber-600 to-amber-400' :
                                    'from-indigo-600 to-purple-500';
  const textColor = percent >= 100 ? 'text-rose-400' :
                    percent >= 80  ? 'text-amber-400' : 'text-indigo-400';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-400">Credit Utilisation</span>
        <span className={`font-black ${textColor}`}>{percent}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>₹0</span>
        <span>Used: ₹{used.toFixed(2)}</span>
        <span>Limit: ₹{limit.toFixed(2)}</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerDashboard = () => {
  const { user } = useApp();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting]       = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/customer-portal/summary');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const customerId = user?.id || user?._id;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await API.get(`/ledgers/customer/${customerId}/statement/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `my_statement_${new Date().toISOString().slice(0, 7)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (e) {
      alert('Error generating statement. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await API.get(`/ledgers/customer/${customerId}/statement/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const win  = window.open(url);
      if (win) win.addEventListener('load', () => win.print());
    } catch (e) {
      alert('Error opening print preview.');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading your account…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-500">
        <AlertCircle size={32} className="mx-auto mb-3 text-slate-600" />
        <p className="font-bold">Unable to load dashboard data.</p>
      </div>
    );
  }

  const { customer, metrics, chartData, recentActivity } = data;
  const balance = metrics.outstandingBalance || 0;
  const isOverLimit = metrics.creditLimit > 0 && balance >= metrics.creditLimit;

  return (
    <div className="space-y-8">

      {/* ── Hero Welcome Banner ────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/10 rounded-full filter blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl shadow-indigo-500/30 shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Customer Portal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">Hello, {customer?.name?.split(' ')[0]}!</h2>
              <p className="text-xs text-slate-400 mt-1">
                {customer?.shopOwner?.shopName || 'Your Shop'} · {customer?.mobileNumber}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/50 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading
                ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <FileDown size={13} />}
              <span>Download Statement</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center space-x-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {printing
                ? <span className="w-3.5 h-3.5 border-2 border-indigo-300/20 border-t-indigo-300 rounded-full animate-spin" />
                : <Printer size={13} />}
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Due Amount Alert (if any) ──────────────────────────────────────── */}
      {balance > 0 && (
        <div className={`flex items-start gap-4 p-5 rounded-2xl border ${
          isOverLimit
            ? 'bg-rose-500/8 border-rose-500/25 text-rose-300'
            : 'bg-amber-500/8 border-amber-500/20 text-amber-300'
        }`}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              {isOverLimit ? '⚠ Credit Limit Exceeded' : 'Payment Due'}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              You have an outstanding balance of <strong>₹{balance.toFixed(2)}</strong>.
              {isOverLimit && ' Your credit limit has been exceeded. Please contact your shop.'}
            </p>
          </div>
          <span className="text-2xl font-black shrink-0">₹{balance.toFixed(2)}</span>
        </div>
      )}

      {balance <= 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border bg-emerald-500/8 border-emerald-500/20 text-emerald-300">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-xs font-semibold">Your account is fully settled. No outstanding balance. 🎉</p>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          label="Outstanding Balance"
          value={`₹${balance.toFixed(2)}`}
          sub={balance > 0 ? 'Amount due to shop' : 'Fully settled'}
          icon={AlertCircle}
          color={balance > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}
          glow={balance > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}
        />
        <KpiCard
          label="Total Purchases"
          value={`₹${metrics.totalPurchases.toFixed(2)}`}
          sub={`${metrics.purchaseCount} order${metrics.purchaseCount !== 1 ? 's' : ''}`}
          icon={ShoppingBag}
          color="bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          glow="bg-indigo-500/10"
        />
        <KpiCard
          label="Total Payments"
          value={`₹${metrics.totalPayments.toFixed(2)}`}
          sub={`${metrics.paymentCount} settlement${metrics.paymentCount !== 1 ? 's' : ''}`}
          icon={DollarSign}
          color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          glow="bg-emerald-500/10"
        />
        <KpiCard
          label="Credit Limit"
          value={`₹${(metrics.creditLimit || 0).toFixed(2)}`}
          sub={`${metrics.creditUsagePercent}% utilised`}
          icon={CreditCard}
          color="bg-purple-500/10 border-purple-500/20 text-purple-400"
          glow="bg-purple-500/10"
        />
      </div>

      {/* ── Credit Gauge + Chart ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Credit Gauge Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white">Account Status</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Credit utilisation overview</p>
          </div>
          <CreditGauge
            used={balance}
            limit={metrics.creditLimit || 0}
            percent={metrics.creditUsagePercent || 0}
          />
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Account Number</span>
              <span className="text-slate-300 font-mono">{(customer?._id || '').slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Shop</span>
              <span className="text-slate-300 font-semibold truncate max-w-[140px]">{customer?.shopOwner?.shopName || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Contact</span>
              <span className="text-slate-300">{customer?.shopOwner?.mobileNumber || '—'}</span>
            </div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-white">Monthly Activity</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Purchases vs payments over the last 6 months</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="cPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11px' }}
                  formatter={(v) => [`₹${v.toFixed(2)}`]}
                />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#f87171" strokeWidth={2} fill="url(#cPurchases)" />
                <Area type="monotone" dataKey="payments"  name="Payments"  stroke="#34d399" strokeWidth={2} fill="url(#cPayments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-bold text-white">Recent Activity</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Your latest purchases and payments</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/my-ledger"
              className="flex items-center space-x-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>View Ledger</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Clock size={24} className="mx-auto mb-2" />
            <p className="text-xs font-semibold">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/30 border border-slate-800/60 hover:border-slate-700/60 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'purchase'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}>
                  {item.type === 'purchase' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.description}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    {item.reference && ` · ${item.reference}`}
                  </p>
                </div>
                <span className={`text-sm font-black shrink-0 ${
                  item.type === 'purchase' ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {item.type === 'purchase' ? '+' : '-'}₹{item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
