import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import API from '../services/api';
import { toast } from 'react-hot-toast';
import {
  Building2,
  KeyRound,
  ShieldAlert,
  Save,
  AlertCircle,
  User,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

const Settings = () => {
  const { user, setUser } = useApp();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'threshold'

  // Tab 1: Profile Form State
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Tab 2: Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Tab 3: Threshold Form State
  const [threshold, setThreshold] = useState(80);
  const [thresholdLoading, setThresholdLoading] = useState(false);

  // Initialize profile inputs from AppContext user on mount / user change
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setShopName(user.shopName || '');
      setEmail(user.email || '');
      setMobileNumber(user.mobileNumber || '');
      setThreshold(user.creditWarningThreshold || 80);
    }
  }, [user]);

  // Handle profile form save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    const errors = {};

    // Validate inputs locally first
    if (!name.trim()) errors.name = 'Full name is required.';
    if (!shopName.trim()) errors.shopName = 'Shop name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!mobileNumber.trim() || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      errors.mobileNumber = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      toast.error('Please correct errors in the profile form.');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await API.put('/settings/profile', {
        name,
        shopName,
        email,
        mobileNumber,
      });

      // Update state in context so visuals update globally
      setUser(response.data.data);
      toast.success('Profile settings updated successfully!');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error updating profile settings.';
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setProfileErrors(backendErrors);
      }
      toast.error(errMsg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change save
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    const errors = {};

    if (!currentPassword) errors.currentPassword = 'Current password is required.';
    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      toast.error('Please verify your password inputs.');
      return;
    }

    setPasswordLoading(true);
    try {
      await API.put('/settings/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success('Password updated successfully!');
      // Clear forms on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error changing password.';
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setPasswordErrors(backendErrors);
      }
      toast.error(errMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle warning threshold save
  const handleThresholdSubmit = async (e) => {
    e.preventDefault();
    setThresholdLoading(true);
    try {
      const response = await API.put('/settings/threshold', {
        creditWarningThreshold: Number(threshold),
      });

      // Sync user threshold setting inside context
      setUser({
        ...user,
        creditWarningThreshold: response.data.data.creditWarningThreshold,
      });

      toast.success('Credit warning threshold setting updated!');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error setting credit threshold.';
      toast.error(errMsg);
    } finally {
      setThresholdLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Administration</span>
        <h2 className="text-2xl font-extrabold text-white mt-1">System Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure shop profiles, security credentials, and credit utilization alert settings.
        </p>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Panel */}
        <div className="md:col-span-1 flex flex-row md:flex-col bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 gap-2 h-fit shrink-0 overflow-x-auto">
          {[
            { id: 'profile',   label: 'Shop Details', icon: Building2 },
            { id: 'password',  label: 'Security',     icon: KeyRound },
            { id: 'threshold', label: 'Alert Limits', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-650/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area Panel */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl" />

          {/* ───────────────── TAB 1: PROFILE FORM ───────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider">Shop & Owner Details</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Manage registration information displayed on invoice statements.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={12} className="text-indigo-400" />
                      <span>Owner Name</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                        profileErrors.name ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    {profileErrors.name && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {profileErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Shop Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={12} className="text-indigo-400" />
                      <span>Shop Name</span>
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                        profileErrors.shopName ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    {profileErrors.shopName && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {profileErrors.shopName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail size={12} className="text-indigo-400" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                        profileErrors.email ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    {profileErrors.email && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {profileErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={12} className="text-indigo-400" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                        profileErrors.mobileNumber ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    {profileErrors.mobileNumber && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {profileErrors.mobileNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-650/15 disabled:opacity-50 transition-all"
                  >
                    {profileLoading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───────────────── TAB 2: CHANGE PASSWORD ───────────────── */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider">Account Password</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Change the password used to log in to the shop owner admin panel.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={12} className="text-indigo-400" />
                    <span>Current Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full max-w-md bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                      passwordErrors.currentPassword ? 'border-rose-500/60' : 'border-slate-800'
                    }`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock size={12} className="text-indigo-400" />
                      <span>New Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                        passwordErrors.newPassword ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock size={12} className="text-indigo-400" />
                      <span>Confirm New Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all ${
                        passwordErrors.confirmPassword ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-650/15 disabled:opacity-50 transition-all"
                  >
                    {passwordLoading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───────────────── TAB 3: THRESHOLD SETTING ───────────────── */}
          {activeTab === 'threshold' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider">Credit limit alert limits</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Adjust the threshold percentage that triggers dashboard credit warning highlights and unread notification alerts.
                </p>
              </div>

              <form onSubmit={handleThresholdSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">
                    Choose Warning Level
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[70, 80, 90, 100].map((level) => {
                      const isSelected = threshold === level;
                      return (
                        <div
                          key={level}
                          onClick={() => setThreshold(level)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                            isSelected
                              ? 'bg-indigo-600/10 border-indigo-500/80 text-white shadow-xl shadow-indigo-550/5'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-lg font-black">{level}%</span>
                          <span className="text-[9px] font-bold uppercase tracking-wide opacity-60 mt-1">
                            {level === 100 ? 'Limit Hit' : 'Warning'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-950/35 border border-slate-800/80 p-4 rounded-2xl flex items-start space-x-3 text-xs text-slate-400">
                  <ShieldAlert size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-bold text-slate-200">What does this do?</p>
                    <p className="mt-1">
                      If set to <strong className="text-indigo-400">{threshold}%</strong>, you will receive warnings and notifications whenever a customer utilizes {threshold}% or more of their total credit limit. Settings are checked automatically when scanning transactions.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={thresholdLoading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-650/15 disabled:opacity-50 transition-all"
                  >
                    {thresholdLoading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Update Alert Setting</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
