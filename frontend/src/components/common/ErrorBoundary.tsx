import { Component, type ErrorInfo, type ReactNode } from 'react';

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
        <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-surface border border-border rounded-[8px] p-8 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <span className="w-3 h-3 rounded-full bg-error" />
              <h2 className="text-xl font-bold font-display text-ink">Application Notice</h2>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              ThermaGrid encountered an unhandled interface exception. This is prevented from crashing the platform completely.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-raised rounded-[6px] border border-border text-[11px] font-mono text-error overflow-x-auto max-h-40">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold rounded-[6px] transition-colors cursor-pointer"
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
