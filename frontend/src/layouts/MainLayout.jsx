import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogOut, LayoutDashboard, Notebook, Settings as SettingsIcon, Package, ShoppingCart, IndianRupee, BellRing, BookOpen, UserCircle, Bell, Menu, X } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    // ── Shop Owner ──────────────────────────────────────────
    { name: 'Dashboard',      path: '/',               icon: LayoutDashboard, roles: ['shop_owner'] },
    { name: 'Ledgers',        path: '/ledgers',         icon: Notebook,        roles: ['shop_owner'] },
    { name: 'Products',       path: '/products',        icon: Package,         roles: ['shop_owner'] },
    { name: 'Purchases',      path: '/purchases',       icon: ShoppingCart,    roles: ['shop_owner'] },
    { name: 'Payments',       path: '/payments',        icon: IndianRupee,      roles: ['shop_owner'] },
    { name: 'Notifications',  path: '/notifications',   icon: BellRing,        roles: ['shop_owner'] },
    { name: 'Settings',       path: '/settings',        icon: SettingsIcon,    roles: ['shop_owner'] },
    // ── Customer ─────────────────────────────────────────────
    { name: 'My Account',     path: '/',               icon: LayoutDashboard, roles: ['customer'] },
    { name: 'My Ledger',      path: '/my-ledger',      icon: BookOpen,        roles: ['customer'] },
    { name: 'My Profile',     path: '/my-profile',     icon: UserCircle,      roles: ['customer'] },
    { name: 'Notifications',  path: '/my-notifications', icon: Bell,          roles: ['customer'] },
    { name: 'Settings',       path: '/settings',        icon: SettingsIcon,   roles: ['customer'] },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
            DL
          </div>
          <span className="font-bold text-slate-200 tracking-wider text-sm">CREDIT LEDGER</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-6 space-y-8 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Mobile Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">
              DL
            </div>
            <div>
              <h1 className="text-md font-bold tracking-wider uppercase text-indigo-400">Credit Ledger</h1>
              <p className="text-xs text-slate-500 font-medium">Enterprise Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-2">
          {navItems
            .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
            .map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-650/25'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        {/* User Card with Logout */}
        <div className="border-t border-slate-800 pt-6 space-y-4">
          <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                {getInitials(user?.name)}
              </div>
              <div className="truncate max-w-[110px]">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Guest User'}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                  {user?.role === 'shop_owner' ? 'Shop Owner' : 'Customer'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-950 p-6 md:p-10 overflow-y-auto min-h-[calc(100vh-68px)] md:min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">System Active</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
              {user?.role === 'shop_owner' ? `${user.shopName || 'Digital'} Ledger` : 'Customer Ledger Portal'}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification Bell — shop owners only */}
            {user?.role === 'shop_owner' && <NotificationBell />}
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-400 shadow-xl shadow-black/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Session Active</span>
            </div>
          </div>
        </header>

        <section className="animate-fade-in">{children}</section>
      </main>
    </div>
  );
};

export default MainLayout;
