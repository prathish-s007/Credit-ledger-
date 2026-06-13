import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserPlus, User, ShoppingBag, Mail, Phone, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Register = () => {
  const { registerShopOwner } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setApiError('');

    // Input Validations
    if (!name.trim() || !shopName.trim() || !email.trim() || !mobileNumber.trim() || !password) {
      setValidationError('All fields are required.');
      return;
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      setValidationError('Mobile number must be a valid 10-digit number.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerShopOwner(name, shopName, email, mobileNumber, password);
      toast.success('Registration successful! Welcome.');
      navigate('/');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background blur decorators */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-550/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30 mx-auto">
            DL
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Shop Account</h2>
          <p className="text-sm text-slate-400">Register as a Shop Owner to start tracking credits</p>
        </div>

        {/* Error Banners */}
        {(validationError || apiError) && (
          <div className="mb-6 flex items-start space-x-2.5 bg-rose-500/10 border border-rose-550/20 text-rose-450 p-3 rounded-2xl text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{validationError || apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Shop Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shop Name</label>
              <div className="relative">
                <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Acme General Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-550/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {submitting ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:underline transition-all">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
