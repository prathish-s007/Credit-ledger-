import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Store,
  Shield,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-react';

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-center gap-4 py-4 border-b border-slate-800/60 last:border-0">
    <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-500 shrink-0">
      <Icon size={15} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-semibold text-slate-200 mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-600 italic font-normal">Not provided</span>}
      </p>
    </div>
  </div>
);

// ─── Stat Badge ───────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, color }) => (
  <div className={`flex flex-col items-center p-4 rounded-2xl border ${color} text-center`}>
    <span className="text-xs font-black">{value}</span>
    <span className="text-[10px] font-semibold mt-0.5 opacity-70">{label}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/customer-portal/profile');
        setProfile(res.data.data);
      } catch (e) {
        console.error('Failed to load customer profile:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-semibold">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={32} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-500 font-semibold">Unable to load your profile.</p>
      </div>
    );
  }

  const balance      = profile.currentBalance || 0;
  const limit        = profile.creditLimit || 0;
  const usagePercent = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;
  const isOverLimit  = limit > 0 && balance >= limit;
  const initials     = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';

  const barColor = usagePercent >= 100 ? 'from-rose-600 to-rose-500' :
                   usagePercent >= 80  ? 'from-amber-500 to-amber-400' :
                                         'from-indigo-600 to-purple-500';

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950/40 to-purple-950/30 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-indigo-500/8 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/8 rounded-full filter blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/30">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          </div>

          {/* Name & Role */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Customer</span>
              <span className="w-1 h-1 rounded-full bg-indigo-600" />
              <span className="text-[10px] font-semibold text-slate-600">Account Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{profile.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{profile.mobileNumber}</p>
            {profile.email && <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <StatBadge
              label="Balance Due"
              value={`₹${balance.toFixed(2)}`}
              color={balance > 0 ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}
            />
            <StatBadge
              label="Credit Limit"
              value={`₹${limit.toFixed(2)}`}
              color="bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Personal Information ─ */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Personal Details</h3>
              <p className="text-[10px] text-slate-500">Your registered account information</p>
            </div>
          </div>

          <InfoRow icon={User}   label="Full Name"      value={profile.name} />
          <InfoRow icon={Phone}  label="Mobile Number"  value={profile.mobileNumber} mono />
          <InfoRow icon={Mail}   label="Email Address"  value={profile.email} />
          <InfoRow icon={MapPin} label="Address"        value={profile.address} />
          <InfoRow icon={Shield} label="Account ID"     value={(profile._id || '').toUpperCase()} mono />
        </div>

        {/* ── Credit + Shop Info ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Credit Account Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <CreditCard size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Credit Account</h3>
                <p className="text-[10px] text-slate-500">Balance and utilisation</p>
              </div>
            </div>

            {/* Balance display */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outstanding Balance</p>
              <p className={`text-4xl font-black mt-2 ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₹{balance.toFixed(2)}
              </p>
              {balance <= 0 && (
                <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ No outstanding dues</p>
              )}
            </div>

            {/* Credit gauge */}
            {limit > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400">Credit Utilisation</span>
                  <span className={`text-[11px] font-black ${isOverLimit ? 'text-rose-400' : usagePercent >= 80 ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {usagePercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Used: ₹{balance.toFixed(2)}</span>
                  <span>Limit: ₹{limit.toFixed(2)}</span>
                </div>
              </div>
            )}

            {isOverLimit && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold leading-relaxed">
                  Your credit limit has been exceeded. Please contact your shop to settle your balance.
                </p>
              </div>
            )}
          </div>

          {/* Shop Information */}
          {profile.shopOwner && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Store size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Your Shop</h3>
                  <p className="text-[10px] text-slate-500">Managed by your shop owner</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{profile.shopOwner.shopName || 'Shop'}</p>
                    <p className="text-[10px] text-slate-500">Managed by {profile.shopOwner.name}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-800/50">
                  {profile.shopOwner.mobileNumber && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone size={11} className="text-slate-600" />
                      <span className="text-slate-400">{profile.shopOwner.mobileNumber}</span>
                    </div>
                  )}
                  {profile.shopOwner.email && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail size={11} className="text-slate-600" />
                      <span className="text-slate-400">{profile.shopOwner.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
