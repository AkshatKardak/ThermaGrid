import React from 'react';
import type { FactorContribution } from '../../types';

interface FactorBarsProps {
  factors: FactorContribution[];
  limit?: number;
}

export const FactorBars: React.FC<FactorBarsProps> = ({ factors, limit = 5 }) => {
  const displayed = factors.slice(0, limit);

  return (
    <div className="space-y-3.5">
      {displayed.map((factor, index) => {
        // Strict usage law: Heat scale for risk values, never amethyst
        const barColor =
          factor.share_pct > 30
            ? '#FF704F'
            : factor.share_pct > 18
            ? '#F59E0B'
            : '#2FA37C';

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#D7E0E7] font-medium">{factor.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#8B9AA8]">{factor.value_unit}</span>
                <span className="font-mono font-semibold text-[#D7E0E7] w-12 text-right tabular-nums">
                  {factor.share_pct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(2, factor.share_pct))}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
