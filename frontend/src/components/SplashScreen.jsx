import React from 'react';

const SplashScreen = ({ fadeOut }) => {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-all duration-800 ease-in-out ${
        fadeOut ? 'opacity-0 scale-98 blur-sm pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Premium radial background glow */}
      <div className="absolute w-[400px] h-[400px] bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse -z-10" />
      <div className="absolute w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-3xl animate-pulse delay-700 -z-10" />

      {/* Center Logo container */}
      <div className="relative flex flex-col items-center select-none">
        
        {/* Concentric pulsing rings behind logo */}
        <div className="absolute w-24 h-24 rounded-3xl border border-indigo-500/30 animate-splash-ring-expand -z-10" />
        <div className="absolute w-24 h-24 rounded-3xl border border-purple-500/20 animate-splash-ring-expand [animation-delay:1s] -z-10" />

        {/* Logo Badge */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-splash-scale-up animate-splash-pulse-glow">
          <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
            DL
          </span>
        </div>

        {/* Branding Title */}
        <h1 className="text-2xl font-black text-white uppercase tracking-[0.25em] mt-8 opacity-0 animate-splash-fade-in [animation-delay:300ms]">
          Credit Ledger
        </h1>
        
        {/* Branding Subtitle */}
        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-2 opacity-0 animate-splash-fade-in [animation-delay:500ms]">
          Smart Ledger & Debt Intelligence
        </p>

        {/* Progress Bar Loader Container */}
        <div className="mt-12 w-48 h-[3px] bg-slate-900 rounded-full overflow-hidden border border-slate-800/40 relative">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full animate-splash-progress" />
        </div>

        {/* Loading text status */}
        <span className="text-[8px] text-slate-500 font-bold tracking-[0.3em] uppercase mt-3.5 opacity-0 animate-splash-fade-in [animation-delay:750ms]">
          Securing Connection
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
