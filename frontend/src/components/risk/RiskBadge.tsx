import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame, Skull } from 'lucide-react';
import { getRiskBand } from '../../theme/tokens';

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
  const band = score !== undefined ? getRiskBand(score) : (bandCode ? getRiskBand(bandCode === 'safe' ? 10 : bandCode === 'moderate' ? 35 : bandCode === 'high' ? 60 : bandCode === 'veryhigh' ? 75 : 90) : getRiskBand(0));

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

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-bold tracking-wide border transition-all ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${band.color}18`,
        color: band.color,
        borderColor: `${band.color}45`,
      }}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{band.label}</span>
      {score !== undefined && (
        <span className="opacity-75 font-normal ml-0.5">({score.toFixed(0)})</span>
      )}
    </span>
  );
};
