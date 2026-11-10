import React from 'react';

interface ProvenanceChipProps {
  label: string;
  value: string;
  sub?: string;
}

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({ label, value, sub }) => {
  return (
    <div className="flex flex-col p-3.5 rounded-[6px] bg-surface border border-border space-y-1">
      <span className="text-xs text-muted font-sans">
        {label}
      </span>
      <span className="text-xs sm:text-sm font-mono font-medium text-ink tabular-nums">
        {value}
      </span>
      {sub && <span className="text-xs text-muted font-sans">{sub}</span>}
    </div>
  );
};
