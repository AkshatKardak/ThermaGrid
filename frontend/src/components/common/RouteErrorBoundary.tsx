import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto my-8">
          <Card className="p-6 bg-surface border border-border space-y-4">
            <div className="flex items-center gap-2 text-error">
              <AlertCircle className="w-5 h-5 text-error" />
              <h3 className="font-display font-bold text-base text-ink">
                {this.props.title || 'Telemetry Interface Unavailable'}
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              An unexpected data schema degradation occurred while rendering this panel. The issue has been logged and degraded gracefully.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-raised rounded-[6px] text-[11px] font-mono text-muted overflow-x-auto border border-border">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-accent text-on-accent text-xs font-mono font-medium hover:bg-accent-hover transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Render
            </button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
