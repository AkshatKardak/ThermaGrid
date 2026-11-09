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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#1F3445]/50 border border-white/5 rounded-xl">
      <Database className="w-12 h-12 text-[#8B9AA8] mb-3 opacity-60" />
      <h4 className="text-base font-semibold text-[#D7E0E7]">{title}</h4>
      <p className="text-sm text-[#8B9AA8] max-w-sm mt-1 mb-4">{message}</p>
      {action}
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = 'Failed to load telemetry from meteorological and risk services.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#C31D3C]/10 border border-[#C31D3C]/30 rounded-xl">
      <AlertTriangle className="w-12 h-12 text-[#FF704F] mb-3" />
      <h4 className="text-base font-semibold text-[#D7E0E7]">Service Telemetry Error</h4>
      <p className="text-sm text-[#8B9AA8] max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7FA6C9] hover:bg-[#5C82A3] text-white text-xs font-semibold tracking-wide transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
