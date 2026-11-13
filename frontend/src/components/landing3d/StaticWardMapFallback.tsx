import React from 'react';
import { getRiskHex } from './palette';

export interface StaticWardItem {
  ward_code?: string;
  ward_name: string;
  risk_score?: number;
}

export interface StaticWardMapFallbackProps {
  wards: StaticWardItem[];
}

export const StaticWardMapFallback: React.FC<StaticWardMapFallbackProps> = ({ wards }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4 bg-panel-dark text-raised select-none">
      <svg
        viewBox="0 0 260 160"
        className="w-full max-w-[240px] h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle grid lines in --muted (#5E645F) at low opacity */}
        <line x1="20" y1="40" x2="240" y2="40" stroke="#5E645F" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="20" y1="80" x2="240" y2="80" stroke="#5E645F" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="20" y1="120" x2="240" y2="120" stroke="#5E645F" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="80" y1="20" x2="80" y2="140" stroke="#5E645F" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="140" y1="20" x2="140" y2="140" stroke="#5E645F" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="200" y1="20" x2="200" y2="140" stroke="#5E645F" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />

        {/* 5 Extruded Ward Blocks projected statically */}
        {wards.slice(0, 5).map((w, i) => {
          const x = 36 + i * 44;
          const score = w.risk_score || 50;
          const h = 20 + (score / 100) * 48;
          const y = 130 - h;
          const color = getRiskHex(score);

          return (
            <g key={w.ward_code || i}>
              <title>{`${w.ward_name} · Risk: ${Math.round(score)}/100 · surveyed polygon`}</title>
              {/* Front Face */}
              <rect
                x={x}
                y={y}
                width="32"
                height={h}
                fill={color}
                stroke="#CFC8B8"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
              {/* Isometric Top Face */}
              <polygon
                points={`${x},${y} ${x + 8},${y - 8} ${x + 40},${y - 8} ${x + 32},${y}`}
                fill={color}
                stroke="#CFC8B8"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
              {/* Isometric Right Face */}
              <polygon
                points={`${x + 32},${y} ${x + 40},${y - 8} ${x + 40},${y - 8 + h} ${x + 32},${y + h}`}
                fill={color}
                fillOpacity="0.85"
                stroke="#CFC8B8"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
            </g>
          );
        })}
      </svg>
      <div className="text-[10px] font-mono text-raised/60 pt-2">
        Static Isometric Projection · {wards.length} Wards Monitored
      </div>
    </div>
  );
};
