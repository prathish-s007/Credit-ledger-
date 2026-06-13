import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  CreditCard,
  Calendar,
  Info,
  Trash2,
  Zap,
  ChevronRight,
} from 'lucide-react';

// ─── Icon & colour helpers ────────────────────────────────────────────────────
const getTypeIcon = (type, size = 16) => {
  switch (type) {
    case 'credit_limit_warning':  return <CreditCard size={size} />;
    case 'payment_due_alert':     return <AlertTriangle size={size} />;
    case 'end_of_month_reminder': return <Calendar size={size} />;
    default:                      return <Info size={size} />;
  }
};

const getSeverityClasses = (severity) => {
  switch (severity) {
    case 'danger':  return { icon: 'bg-rose-500/15 text-rose-400 border-rose-500/25', dot: 'bg-rose-500', badge: 'text-rose-400' };
    case 'warning': return { icon: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dot: 'bg-amber-400', badge: 'text-amber-400' };
    case 'success': return { icon: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-500', badge: 'text-emerald-400' };
    default:        return { icon: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25', dot: 'bg-indigo-500', badge: 'text-indigo-400' };
  }
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // ── Poll unread count every 60 seconds ─────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await API.get('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (_) {/* silently ignore */}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Fetch full list when panel opens ───────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/notifications', { params: { limit: 25 } });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (_) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // ── Close panel when clicking outside ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleClearAll = async () => {
    try {
      await API.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await API.post('/notifications/generate');
      await fetchNotifications();
    } catch (_) {} finally {
      setGenerating(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      API.patch(`/notifications/${notification._id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700/80 hover:border-indigo-500/40 transition-all duration-300 cursor-pointer group"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="text-indigo-400 group-hover:animate-bounce" />
        ) : (
          <Bell size={18} />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[9px] font-black shadow-lg shadow-rose-500/40 border border-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[380px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col max-h-[540px] animate-fade-in">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BellRing size={15} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Notifications</h4>
                {unreadCount > 0 && (
                  <p className="text-[10px] text-slate-500">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {/* Generate alerts button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                title="Scan & generate alerts"
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer disabled:opacity-40"
              >
                <Zap size={13} className={generating ? 'animate-spin' : ''} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Clear all"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <p className="text-xs text-slate-500">Loading alerts…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 space-y-4 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-600">
                  <Bell size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400">All caught up!</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    No notifications yet. Click ⚡ to scan for credit warnings and payment alerts.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const styles = getSeverityClasses(notif.severity);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative flex items-start gap-3 px-4 py-4 transition-all duration-200 cursor-pointer group ${
                      notif.isRead
                        ? 'hover:bg-slate-800/30'
                        : 'bg-indigo-500/4 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    )}

                    {/* Icon */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5 ${styles.icon}`}>
                      {getTypeIcon(notif.type, 15)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-snug truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.customer?.name && (
                        <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800/70 text-slate-400 border border-slate-700/50">
                          {notif.customer.name}
                        </span>
                      )}
                    </div>

                    {/* Action buttons (shown on hover) */}
                    <div className="shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          title="Mark as read"
                          className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                        >
                          <Check size={11} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif._id, e)}
                        title="Delete"
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>

                    {notif.actionUrl && (
                      <ChevronRight size={12} className="shrink-0 text-slate-700 group-hover:text-slate-500 mt-3 transition-colors" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 shrink-0 bg-slate-950/30">
              <button
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="w-full text-center text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
