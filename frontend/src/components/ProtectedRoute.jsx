import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Your role '{user.role}' does not have permission to access this page.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
