import React from 'react';
import { AlertCircle } from 'lucide-react';

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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold tracking-wider uppercase bg-[#FF704F]/15 text-[#FF704F] border border-[#FF704F]/30 ${className}`}
      title="Calibrated simulation model value — not live physical sensor feed"
    >
      <AlertCircle className="w-3.5 h-3.5 animate-pulse text-[#FF704F]" />
      {label}
    </span>
  );
};
