import React from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
}> = ({
  title = 'No Data Available',
  message = 'No active records found for the selected spatial filters.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-[8px]">
      <Database className="w-12 h-12 text-muted mb-3 opacity-60" />
      <h4 className="text-base font-semibold text-ink">{title}</h4>
      <p className="text-sm text-muted max-w-sm mt-1 mb-4">{message}</p>
      {action}
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
  title?: string;
}> = ({
  message = 'Failed to load telemetry from meteorological and risk services.',
  onRetry,
  title = 'Service Telemetry Error',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] border border-error/30 rounded-[8px]">
      <AlertTriangle className="w-12 h-12 text-error mb-3" />
      <h4 className="text-base font-semibold text-ink">{title}</h4>
      <p className="text-sm text-muted max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold tracking-wide transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
