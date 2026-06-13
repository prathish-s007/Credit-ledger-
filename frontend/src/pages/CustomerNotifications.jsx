import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import API from '../services/api';
import {
  Bell,
  AlertTriangle,
  CreditCard,
  Calendar,
  Info,
  IndianRupee,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmtDate = (d) => new Date(d).toLocaleString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const getTypeIcon = (type, size = 18) => {
  switch (type) {
    case 'credit_limit_warning':  return <CreditCard size={size} />;
    case 'payment_due_alert':     return <AlertTriangle size={size} />;
    case 'end_of_month_reminder': return <Calendar size={size} />;
    default:                      return <Info size={size} />;
  }
};

const getSeverityStyle = (severity) => {
  switch (severity) {
    case 'danger':  return { icon: 'bg-rose-500/10 border-rose-500/20 text-rose-400',    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    dot: 'bg-rose-500'   };
    case 'warning': return { icon: 'bg-amber-500/10 border-amber-500/20 text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400'  };
    case 'success': return { icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' };
    default:        return { icon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',    dot: 'bg-indigo-500' };
  }
};

const TYPE_LABELS = {
  credit_limit_warning:  'Credit Warning',
  payment_due_alert:     'Payment Due',
  end_of_month_reminder: 'Month Reminder',
  general:               'General',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerNotifications = () => {
  const { user } = useApp();
  const customerId = user?.id || user?._id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [summary, setSummary]             = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch ledger notifications (shop-owner generated, related to this customer)
        // We use the customer-portal summary to build an "alert-style" view
        const [summaryRes] = await Promise.all([
          API.get('/customer-portal/summary'),
        ]);

        const data = summaryRes.data;
        setSummary(data);

        // Build synthetic notification-style cards from metrics
        const syntheticNotifs = [];

        if (data.metrics.outstandingBalance > 0) {
          syntheticNotifs.push({
            _id:      'balance_alert',
            type:     'payment_due_alert',
            title:    'Outstanding Balance',
            message:  `You have an outstanding balance of ₹${data.metrics.outstandingBalance.toFixed(2)} pending settlement with ${data.customer?.shopOwner?.shopName || 'your shop'}.`,
            severity: data.metrics.outstandingBalance >= data.metrics.creditLimit && data.metrics.creditLimit > 0 ? 'danger' : 'warning',
            date:     new Date().toISOString(),
            isSystem: true,
          });
        }

        if (data.metrics.creditLimit > 0 && data.metrics.creditUsagePercent >= 80) {
          syntheticNotifs.push({
            _id:      'credit_warning',
            type:     'credit_limit_warning',
            title:    data.metrics.creditUsagePercent >= 100 ? 'Credit Limit Exceeded' : 'Credit Limit Warning',
            message:  `You have used ${data.metrics.creditUsagePercent}% of your ₹${data.metrics.creditLimit.toFixed(2)} credit limit.`,
            severity: data.metrics.creditUsagePercent >= 100 ? 'danger' : 'warning',
            date:     new Date().toISOString(),
            isSystem: true,
          });
        }

        // Latest purchase
        const latestPurchase = data.recentActivity?.find(a => a.type === 'purchase');
        if (latestPurchase) {
          syntheticNotifs.push({
            _id:      latestPurchase._id,
            type:     'general',
            title:    'Recent Purchase Recorded',
            message:  `A purchase of ₹${latestPurchase.amount.toFixed(2)} was recorded on ${new Date(latestPurchase.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}.`,
            severity: 'info',
            date:     latestPurchase.date,
            isSystem: false,
          });
        }

        // Latest payment
        const latestPayment = data.recentActivity?.find(a => a.type === 'payment');
        if (latestPayment) {
          syntheticNotifs.push({
            _id:      `pay_${latestPayment._id}`,
            type:     'general',
            title:    'Payment Settlement Confirmed',
            message:  `A payment of ₹${latestPayment.amount.toFixed(2)} was recorded: "${latestPayment.description}".`,
            severity: 'success',
            date:     latestPayment.date,
            isSystem: false,
          });
        }

        setNotifications(syntheticNotifs);
      } catch (e) {
        console.error('Failed to load customer notifications:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-semibold">Loading notifications…</p>
      </div>
    );
  }

  const balance      = summary?.metrics?.outstandingBalance || 0;
  const creditLimit  = summary?.metrics?.creditLimit || 0;
  const usagePercent = summary?.metrics?.creditUsagePercent || 0;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">My Account</span>
        <h2 className="text-2xl font-extrabold text-white mt-1">Notifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Account alerts and activity updates for your credit account.</p>
      </div>

      {/* ── Summary Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: IndianRupee, label: 'Balance Due',
            value: `₹${balance.toFixed(2)}`,
            color: balance > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          },
          {
            icon: CreditCard, label: 'Credit Limit',
            value: `₹${creditLimit.toFixed(2)}`,
            color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          },
          {
            icon: ShoppingBag, label: 'Total Purchases',
            value: summary?.metrics?.purchaseCount || 0,
            color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
          },
          {
            icon: CheckCircle2, label: 'Total Payments',
            value: summary?.metrics?.paymentCount || 0,
            color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}><Icon size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
              <p className="text-lg font-black text-white mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Credit Bar ─────────────────────────────────────────────────────── */}
      {creditLimit > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400">Credit Limit Usage</span>
            <span className={`text-xs font-black ${usagePercent >= 100 ? 'text-rose-400' : usagePercent >= 80 ? 'text-amber-400' : 'text-indigo-400'}`}>
              {usagePercent}% — ₹{balance.toFixed(2)} of ₹{creditLimit.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                usagePercent >= 100 ? 'from-rose-600 to-rose-500' :
                usagePercent >= 80  ? 'from-amber-500 to-amber-400' :
                                      'from-indigo-600 to-purple-500'
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Notification Cards ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center text-slate-600">
              <Bell size={28} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-400">All caught up!</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xs">
                No pending alerts. Your account balance is fully settled. 🎉
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((notif) => {
              const style = getSeverityStyle(notif.severity);
              return (
                <div
                  key={notif._id}
                  className="flex items-start gap-4 px-6 py-5 hover:bg-slate-800/25 transition-all"
                >
                  {/* Severity dot */}
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />

                  {/* Icon */}
                  <div className={`shrink-0 w-11 h-11 rounded-2xl border flex items-center justify-center mt-0.5 ${style.icon}`}>
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <p className="text-sm font-bold text-white">{notif.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${style.badge}`}>
                        {TYPE_LABELS[notif.type] || 'General'}
                      </span>
                      {notif.isSystem && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-slate-800/60 text-slate-500 border border-slate-700/50">
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1.5">{fmtDate(notif.date)} · {timeAgo(notif.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── All clear or settled note ──────────────────────────────────────── */}
      {balance <= 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border bg-emerald-500/8 border-emerald-500/20 text-emerald-300">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-xs font-semibold">
            Your account is fully settled with no outstanding balance. Thank you for your timely payments! 🙌
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
