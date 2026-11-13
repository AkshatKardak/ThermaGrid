import React from 'react';

interface DemoBadgeProps {
  label?: string;
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  label = 'DEMO DATA',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-mono font-medium tracking-wider uppercase bg-surface text-ink border border-border ${className}`}
      title="Calibrated synthetic model value — not live physical sensor feed"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      {label}
    </span>
  );
};
