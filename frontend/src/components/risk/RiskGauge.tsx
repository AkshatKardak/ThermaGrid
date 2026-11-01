import React from 'react';
import { getRiskBand } from '../../theme/tokens';

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
            stroke="rgba(255, 255, 255, 0.08)"
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
          <span className="text-4xl font-extrabold font-mono tracking-tight" style={{ color: band.color }}>
            {score.toFixed(1)}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] -mt-1">
            out of 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold font-display uppercase tracking-wider border"
            style={{
              backgroundColor: `${band.color}20`,
              color: band.color,
              borderColor: `${band.color}40`,
            }}
          >
            {band.label}
          </span>
          <p className="text-xs text-[#8B9AA8] mt-1.5 max-w-xs">{band.description}</p>
        </div>
      )}
    </div>
  );
};
