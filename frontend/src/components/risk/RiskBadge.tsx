import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame, Skull } from 'lucide-react';
import { getRiskBand } from '../../theme/tokens';
import { formatNumber } from '../../utils/format';

interface RiskBadgeProps {
  score?: number;
  bandCode?: 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme';
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  bandCode,
  size = 'md',
}) => {
  const band = score !== undefined
    ? getRiskBand(score)
    : bandCode
    ? getRiskBand(bandCode === 'safe' ? 10 : bandCode === 'moderate' ? 35 : bandCode === 'high' ? 60 : bandCode === 'veryhigh' ? 75 : 90)
    : getRiskBand(0);

  const icons = {
    safe: ShieldCheck,
    moderate: AlertCircle,
    high: AlertTriangle,
    veryhigh: Flame,
    extreme: Skull,
  };
  const Icon = icons[band.code];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  };

  // RISK-AS-TEXT Rule:
  // --risk-1 through --risk-4 may NEVER be used as text colour.
  // Numbers & status words in --ink. Low opacity fill. 1px border.
  // --risk-5 is the only exception (passes 5.14:1 contrast).
  const variantStyles = {
    safe: 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]',
    moderate: 'bg-[color-mix(in_srgb,var(--risk-2)_20%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-2)_60%,var(--ink))]',
    high: 'bg-[color-mix(in_srgb,var(--risk-3)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-3)_55%,var(--ink))]',
    veryhigh: 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]',
    extreme: 'bg-[color-mix(in_srgb,var(--risk-5)_16%,var(--surface))] text-risk-5 border-[color-mix(in_srgb,var(--risk-5)_55%,var(--ink))]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-[4px] font-mono font-medium tracking-wide border transition-all ${sizeClasses[size]} ${variantStyles[band.code]}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: band.color }}
      />
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: band.color }} />
      <span>{band.label}</span>
      {score !== undefined && (
        <span className="font-bold tabular-nums ml-0.5">({formatNumber(score, 0)})</span>
      )}
    </span>
  );
};
