import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.location.hash = '';
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E0D8] shadow-lg text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F2ED] text-[#5A634E] flex items-center justify-center mx-auto border border-[#E5E0D8]">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-serif font-bold text-[#4A4A3A]">
                Something went wrong
              </h2>
              <p className="text-xs text-[#7A7468] leading-relaxed">
                An unexpected display issue occurred. Your progress and study notes are safe.
              </p>
              {this.state.error?.message && (
                <div className="text-[11px] font-mono bg-[#F5F2ED] text-[#5A634E] p-2.5 rounded-xl border border-[#E5E0D8] overflow-x-auto text-left max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#5A634E] text-white text-xs font-bold hover:bg-[#484F3E] transition flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="py-2.5 px-4 rounded-xl border border-[#E5E0D8] bg-white text-[#4A4A3A] text-xs font-bold hover:bg-[#F5F2ED] transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
