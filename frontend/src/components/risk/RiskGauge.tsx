import React from 'react';
import { getRiskBand } from '../../theme/tokens';
import { formatNumber } from '../../utils/format';

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 180,
  showLabel = true,
}) => {
  const band = getRiskBand(score);
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle: 260 degrees
  const arcLength = circumference * (260 / 360);
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform rotate-[140deg] overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#CFC8B8"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-mono tracking-tight text-ink tabular-nums">
            {formatNumber(score, 1)}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted -mt-1">
            out of 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border"
            style={{
              backgroundColor: `color-mix(in srgb, ${band.color} 15%, var(--surface))`,
              color: band.code === 'extreme' ? 'var(--risk-5)' : 'var(--ink)',
              borderColor: `color-mix(in srgb, ${band.color} ${band.code === 'moderate' ? '60%' : '55%'}, var(--ink))`,
            }}
          >
            {band.label}
          </span>
          <p className="text-xs text-muted mt-1.5 max-w-xs">{band.description}</p>
        </div>
      )}
    </div>
  );
};
