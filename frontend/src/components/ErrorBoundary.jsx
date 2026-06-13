import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches render-time errors in the React tree.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 * Must be a class component (hooks cannot catch render errors).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in development; swap for an error reporting service in production
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught a render error:', error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full space-y-6">
            {/* Error icon */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle size={32} />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-extrabold text-white">Something went wrong</h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                An unexpected error occurred in the application. Try refreshing the page or click
                the button below to retry.
              </p>
            </div>

            {/* Error detail (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-auto max-h-40">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">
                  Error Details (dev only)
                </p>
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {/* Retry button */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <RefreshCw size={15} />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer"
              >
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
