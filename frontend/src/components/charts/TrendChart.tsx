import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
} from 'recharts';
import type { HourlyThermalItem } from '../../types';
import { TOKENS, RISK_SCALE } from '../../theme/tokens';

interface TrendChartProps {
  items: HourlyThermalItem[];
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ items, height = 320 }) => {
  if (!items || items.length === 0) return null;

  let peakPoint: { time: string; wbgt: number } = { time: '', wbgt: -Infinity };

  const data = items.slice(0, 36).map((item) => {
    let hourLabel = item.time;
    try {
      const d = new Date(item.time);
      hourLabel = `${d.getHours().toString().padStart(2, '0')}:00`;
    } catch {
      hourLabel = item.time.slice(11, 16);
    }

    if (item.wbgt_c > peakPoint.wbgt) {
      peakPoint = { time: hourLabel, wbgt: item.wbgt_c };
    }

    return {
      time: hourLabel,
      WBGT: item.wbgt_c,
      UTCI: item.utci_c,
      'Heat Index': item.heat_index_c,
      'Air Temp': item.temperature_c,
    };
  });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: -16, bottom: 0 }}>
          {/* Hairline horizontal grid lines only */}
          <CartesianGrid
            stroke={TOKENS.border}
            strokeDasharray="2 4"
            vertical={false}
          />

          {/* Threshold Band: WBGT ≥ 32°C (High Risk) at 6% opacity */}
          <ReferenceArea
            y1={32}
            y2={34}
            fill={RISK_SCALE.risk4}
            fillOpacity={0.06}
            strokeOpacity={0}
          />
          {/* Threshold Band: WBGT ≥ 34°C (Extreme Stress) at 6% opacity */}
          <ReferenceArea
            y1={34}
            fill={RISK_SCALE.risk5}
            fillOpacity={0.06}
            strokeOpacity={0}
          />

          <XAxis
            dataKey="time"
            stroke={TOKENS.muted}
            fontSize={11}
            tickLine={false}
            tick={{ fontFamily: 'IBM Plex Mono' }}
          />
          <YAxis
            stroke={TOKENS.muted}
            fontSize={11}
            unit="°C"
            domain={['dataMin - 1', 'dataMax + 2']}
            tickLine={false}
            tick={{ fontFamily: 'IBM Plex Mono' }}
          />

          {/* Peak annotation dot */}
          {peakPoint.time && (
            <ReferenceDot
              x={peakPoint.time}
              y={peakPoint.wbgt}
              r={4}
              fill={RISK_SCALE.risk4}
              stroke={TOKENS.bg}
              strokeWidth={2}
            />
          )}

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              return (
                <div className="rounded-[6px] bg-raised border border-border p-3 font-mono text-xs space-y-1.5 text-ink">
                  <div className="text-[10px] uppercase text-muted tracking-wider border-b border-border pb-1">
                    Hour: {label}
                  </div>
                  {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-ink">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}:
                      </span>
                      <span className="font-bold text-ink tabular-nums">
                        {Number(entry.value).toFixed(1)}°C
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />

          <Legend
            wrapperStyle={{
              fontSize: '11px',
              fontFamily: 'IBM Plex Mono',
              paddingTop: '12px',
              color: TOKENS.muted,
            }}
          />

          {/* WBGT Area with flat subtle fill */}
          <Area
            type="monotone"
            dataKey="WBGT"
            stroke={RISK_SCALE.risk4}
            strokeWidth={2}
            strokeLinecap="round"
            fill={RISK_SCALE.risk4}
            fillOpacity={0.08}
            name="WBGT (Work Index)"
          />

          {/* UTCI Line */}
          <Line
            type="monotone"
            dataKey="UTCI"
            stroke={RISK_SCALE.risk3}
            strokeWidth={2}
            strokeLinecap="round"
            dot={false}
            name="UTCI (Climate Stress)"
          />

          {/* Heat Index Line */}
          <Line
            type="monotone"
            dataKey="Heat Index"
            stroke={RISK_SCALE.risk2}
            strokeWidth={1.5}
            strokeLinecap="round"
            dot={false}
            name="Heat Index"
          />

          {/* Air Temp dry-bulb (dotted) */}
          <Line
            type="monotone"
            dataKey="Air Temp"
            stroke={TOKENS.muted}
            strokeWidth={1.5}
            strokeDasharray="2 4"
            dot={false}
            name="Air Temp (Dry-Bulb)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
