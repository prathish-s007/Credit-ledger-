import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogIn, Phone, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState('shop_owner'); // shop_owner or customer
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');

  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setApiError('');

    // Client-side validations
    if (role === 'shop_owner') {
      if (!emailOrMobile.trim()) {
        setValidationError('Please enter your email or mobile number.');
        return;
      }
    } else {
      if (!mobileNumber.trim()) {
        setValidationError('Please enter your mobile number.');
        return;
      }
      if (!/^\d{10}$/.test(mobileNumber)) {
        setValidationError('Mobile number must be a valid 10-digit number.');
        return;
      }
    }

    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await loginUser(role, emailOrMobile, mobileNumber, password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.message || 'Login failed. Please verify credentials.';
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

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30 mx-auto">
            DL
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400">Access your digital credit ledgers</p>
        </div>

        {/* Role Toggles */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('shop_owner');
              setValidationError('');
              setApiError('');
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              role === 'shop_owner'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>Shop Owner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('customer');
              setValidationError('');
              setApiError('');
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              role === 'customer'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>Customer</span>
          </button>
        </div>

        {/* Error Banners */}
        {(validationError || apiError) && (
          <div className="mb-6 flex items-start space-x-2.5 bg-rose-500/10 border border-rose-550/20 text-rose-450 p-3 rounded-2xl text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{validationError || apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {role === 'shop_owner' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email or Mobile</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="name@email.com or 10-digit number"
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
          )}

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

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-550/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {role === 'shop_owner' && (
          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have a shop account?{' '}
            <Link to="/register" className="text-indigo-400 font-bold hover:underline transition-all">
              Register here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
