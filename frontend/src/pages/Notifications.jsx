import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Bell,
  BellRing,
  AlertTriangle,
  CreditCard,
  Calendar,
  Info,
  Trash2,
  CheckCheck,
  Check,
  Zap,
  Filter,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  credit_limit_warning:  'Credit Limit Warning',
  payment_due_alert:     'Payment Due Alert',
  end_of_month_reminder: 'End of Month Reminder',
  general:               'General',
};

const getTypeIcon = (type, size = 18) => {
  switch (type) {
    case 'credit_limit_warning':  return <CreditCard size={size} />;
    case 'payment_due_alert':     return <AlertTriangle size={size} />;
    case 'end_of_month_reminder': return <Calendar size={size} />;
    default:                      return <Info size={size} />;
  }
};

const getSeverityClasses = (severity) => {
  switch (severity) {
    case 'danger':  return { container: 'border-rose-500/20',   icon: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    dot: 'bg-rose-500' };
    case 'warning': return { container: 'border-amber-500/20',  icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400' };
    case 'success': return { container: 'border-emerald-500/20',icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',dot: 'bg-emerald-500' };
    default:        return { container: 'border-indigo-500/20', icon: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' };
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── KPI Summary Card ─────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, colorClass, bgClass, borderClass }) => (
  <div className={`bg-slate-900 border ${borderClass} rounded-2xl p-5 flex items-center space-x-4`}>
    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <h3 className={`text-2xl font-black mt-0.5 ${colorClass}`}>{value}</h3>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (readFilter === 'unread') params.unreadOnly = 'true';

      const res = await API.get('/notifications', { params });
      let data = res.data.data || [];

      // Client-side type filter
      if (typeFilter !== 'all') {
        data = data.filter((n) => n.type === typeFilter);
      }
      if (readFilter === 'read') {
        data = data.filter((n) => n.isRead);
      }

      setNotifications(data);
      setUnreadCount(res.data.unreadCount || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
    } catch (_) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, readFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleMarkAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      setTotalRecords((t) => Math.max(0, t - 1));
    } catch (_) {}
  };

  const handleClearAll = async () => {
    try {
      await API.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setTotalRecords(0);
    } catch (_) {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await API.post('/notifications/generate');
      const count = res.data.data?.length || 0;
      await fetchNotifications();
      if (count === 0) {
        // Show a brief message — no alerts generated
      }
    } catch (_) {} finally {
      setGenerating(false);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) handleMarkAsRead(notif._id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  // ── Derived counts ──────────────────────────────────────────────────────────
  const creditWarnings = notifications.filter((n) => n.type === 'credit_limit_warning').length;
  const paymentAlerts  = notifications.filter((n) => n.type === 'payment_due_alert').length;
  const monthReminders = notifications.filter((n) => n.type === 'end_of_month_reminder').length;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Alert Centre</span>
          <h2 className="text-2xl font-extrabold text-white mt-1">Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">System-generated alerts for credit limits, overdue payments and monthly billing.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap size={14} className={generating ? 'animate-spin' : ''} />
            <span>{generating ? 'Scanning…' : 'Generate Alerts'}</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Mark All Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="flex items-center justify-center w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Unread"         value={unreadCount}    icon={BellRing}       colorClass="text-indigo-400" bgClass="bg-indigo-500/10" borderClass="border-indigo-500/20" />
        <KpiCard label="Credit Warnings" value={creditWarnings} icon={CreditCard}     colorClass="text-rose-400"   bgClass="bg-rose-500/10"   borderClass="border-rose-500/20" />
        <KpiCard label="Payment Alerts" value={paymentAlerts}  icon={AlertTriangle}  colorClass="text-amber-400"  bgClass="bg-amber-500/10"  borderClass="border-amber-500/20" />
        <KpiCard label="Month Reminders" value={monthReminders} icon={Calendar}       colorClass="text-emerald-400"bgClass="bg-emerald-500/10"borderClass="border-emerald-500/20" />
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center space-x-1 text-slate-500">
          <Filter size={13} />
          <span className="text-[11px] font-bold uppercase tracking-widest">Filter:</span>
        </div>

        {/* Read status */}
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => { setReadFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer capitalize ${
              readFilter === f
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
            }`}
          >
            {f}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-800" />

        {/* Type */}
        {[
          { key: 'all',                   label: 'All Types' },
          { key: 'credit_limit_warning',  label: 'Credit Limit' },
          { key: 'payment_due_alert',     label: 'Payment Due' },
          { key: 'end_of_month_reminder', label: 'Month End' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setTypeFilter(f.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              typeFilter === f.key
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-800/40 text-slate-500 hover:text-slate-300 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Notification List ───────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-semibold">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center text-slate-600">
              <Bell size={28} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-400">No notifications found</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xs">
                Click <strong className="text-amber-400">Generate Alerts</strong> to scan all customers for credit limit warnings, overdue payments, and month-end reminders.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap size={14} className={generating ? 'animate-spin' : ''} />
              <span>{generating ? 'Scanning…' : 'Generate Alerts'}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((notif) => {
              const styles = getSeverityClasses(notif.severity);
              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`relative flex items-start gap-4 px-6 py-5 transition-all duration-200 cursor-pointer group ${
                    notif.isRead ? 'hover:bg-slate-800/25' : 'bg-indigo-950/20 hover:bg-slate-800/30'
                  }`}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${styles.dot} shadow-sm`} />
                  )}

                  {/* Type icon */}
                  <div className={`shrink-0 w-11 h-11 rounded-2xl border flex items-center justify-center mt-0.5 ${styles.icon}`}>
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <p className={`text-sm font-bold leading-snug ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${styles.badge}`}>
                        {TYPE_LABELS[notif.type] || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      {notif.customer?.name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/70 text-slate-400 border border-slate-700/50">
                          👤 {notif.customer.name}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{formatDate(notif.createdAt)}</span>
                      <span className="text-[10px] text-slate-700">{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col items-end space-y-2">
                    {notif.actionUrl && (
                      <ChevronRight size={15} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                    )}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif._id); }}
                          title="Mark as read"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(notif._id); }}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/30">
            <span className="text-[11px] text-slate-500">{totalRecords} total notification{totalRecords !== 1 ? 's' : ''}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-[11px] text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
