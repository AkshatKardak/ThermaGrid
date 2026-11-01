import React from 'react';

interface ProvenanceChipProps {
  label: string;
  value: string;
  sub?: string;
}

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({ label, value, sub }) => {
  return (
    <div className="flex flex-col p-3 rounded-[8px] bg-[#1F3445]/50 border border-white/6 space-y-1">
      <span className="text-[10px] font-mono uppercase tracking-[0.10em] text-[#5F7183]">
        {label}
      </span>
      <span className="text-xs font-mono font-semibold text-[#D7E0E7]">{value}</span>
      {sub && <span className="text-[10px] font-mono text-[#8B9AA8]">{sub}</span>}
    </div>
  );
};
