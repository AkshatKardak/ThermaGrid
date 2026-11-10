import React from 'react';

interface ProvenanceChipProps {
  label: string;
  value: string;
  sub?: string;
}

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({ label, value, sub }) => {
  return (
    <div className="flex flex-col p-3.5 rounded-[8px] bg-[#203A45]/40 border border-white/[0.075] space-y-1">
      <span className="text-xs text-[#6B7C8A] font-sans">
        {label}
      </span>
      <span className="text-xs sm:text-sm font-mono font-medium text-[#D8E8E6] tabular-nums">
        {value}
      </span>
      {sub && <span className="text-xs text-[#93A3B0] font-sans">{sub}</span>}
    </div>
  );
};
