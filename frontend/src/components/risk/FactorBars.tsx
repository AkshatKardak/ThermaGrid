import React from 'react';
import type { FactorContribution } from '../../types';
import { formatNumber } from '../../utils/format';

interface FactorBarsProps {
  factors?: FactorContribution[] | Record<string, any> | null;
  limit?: number;
}

export const FactorBars: React.FC<FactorBarsProps> = ({ factors, limit = 5 }) => {
  const safeList: FactorContribution[] = React.useMemo(() => {
    if (Array.isArray(factors)) {
      return factors;
    }
    if (factors && typeof factors === 'object') {
      return Object.entries(factors).map(([k, v]: [string, any]) => {
        if (v && typeof v === 'object') {
          return {
            name: typeof v.name === 'string' ? v.name : k.replace('_', ' '),
            share_pct: typeof v.share_pct === 'number' ? v.share_pct : 0,
            value_unit: typeof v.value_unit === 'string' ? v.value_unit : '',
          };
        }
        return {
          name: k.replace('_', ' '),
          share_pct: typeof v === 'number' ? v : 0,
          value_unit: '',
        };
      });
    }
    return [];
  }, [factors]);

  const displayed = safeList.slice(0, limit);

  if (displayed.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-xs text-muted">
        No factor attribution data available.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {displayed.map((factor, index) => {
        const nameStr = typeof factor?.name === 'string' ? factor.name : String(factor?.name ?? 'Factor');
        const unitStr = typeof factor?.value_unit === 'string' ? factor.value_unit : '';
        const pctNum = typeof factor?.share_pct === 'number' ? factor.share_pct : Number(factor?.share_pct) || 0;

        const barColor =
          pctNum > 30
            ? '#FF704F'
            : pctNum > 18
            ? '#D97706'
            : '#2FA37C';

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink font-medium">{nameStr}</span>
              <div className="flex items-center gap-2">
                {unitStr && <span className="font-mono text-[11px] text-muted">{unitStr}</span>}
                <span className="font-mono font-semibold text-ink w-12 text-right tabular-nums">
                  {formatNumber(pctNum, 1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(2, pctNum))}%`,
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
