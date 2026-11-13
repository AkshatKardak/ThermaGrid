import React from 'react';

export interface DataStatusBadgeProps {
  isDemo?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({
  isDemo = false,
  variant = 'light',
  className = '',
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] border text-xs font-mono select-none shrink-0 whitespace-nowrap ${
        isDark
          ? 'bg-panel-dark text-raised border-border/60'
          : 'bg-raised text-ink border-border'
      } ${className}`}
      style={{ whiteSpace: 'nowrap' }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isDemo ? 'bg-muted' : isDark ? 'bg-accent' : 'bg-accent'
        }`}
        style={!isDemo && isDark ? { backgroundColor: '#8FB3D9' } : undefined}
        aria-hidden="true"
      />
      <span className={isDark ? 'text-raised font-medium' : 'text-ink font-medium'}>
        {isDemo ? 'Demo data' : 'Live'}
      </span>
    </div>
  );
};
