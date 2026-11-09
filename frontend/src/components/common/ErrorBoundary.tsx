import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in ThermaGrid UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#101820] text-[#D7E0E7] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#1F3445] border border-white/10 rounded-[14px] p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF704F]">
              <span className="w-3 h-3 rounded-full bg-[#FF704F] animate-pulse" />
              <h2 className="text-xl font-bold font-display text-white">Application Notice</h2>
            </div>
            <p className="text-xs text-[#8B9AA8] leading-relaxed">
              ThermaGrid encountered an unhandled interface exception. This is prevented from crashing the platform completely.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-[#101820] rounded-[8px] border border-white/6 text-[11px] font-mono text-[#FF704F] overflow-x-auto max-h-40">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#7FA6C9] hover:bg-[#5C82A3] text-white text-xs font-mono font-semibold rounded-[8px] transition-all cursor-pointer"
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
