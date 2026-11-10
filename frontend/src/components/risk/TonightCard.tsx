import React from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { useNightRisk } from '../../hooks/useNightRisk';
import { Card } from '../ui/Card';
import { TYPOGRAPHY } from '../../theme/typography';
import { RISK_SCALE } from '../../theme/tokens';

interface TonightCardProps {
  locationId: number;
}

export const TonightCard: React.FC<TonightCardProps> = ({ locationId }) => {
  const { data, isLoading } = useNightRisk(locationId);

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="h-6 w-1/3 bg-border/40 rounded animate-pulse" />
        <div className="h-28 bg-border/40 rounded-[6px] animate-pulse" />
      </Card>
    );
  }

  if (!data?.available || data.night_min_c === null) {
    return (
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
          <Moon className="w-4 h-4 text-muted" />
          <span>Overnight Thermal Recovery</span>
        </div>
        <h3 className={`${TYPOGRAPHY.h3} text-ink`}>Tonight</h3>
        <div className="p-4 rounded-[6px] bg-raised border border-border text-xs text-muted">
          {data?.message || "Tonight's data not yet available — updates every model cycle."}
        </div>
      </Card>
    );
  }

  const hourly = data.hourly_overnight || [];

  // Compute SVG curve points for 20:00 to 06:00
  const svgWidth = 360;
  const svgHeight = 90;
  const temps = hourly.map((h) => h.temp_c);
  const minT = Math.min(22, ...temps);
  const maxT = Math.max(34, ...temps);
  const tRange = maxT - minT || 1;

  const points = hourly.map((h, i) => {
    const x = (i / Math.max(1, hourly.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - 20 - ((h.temp_c - minT) / tRange) * (svgHeight - 35);
    return { x, y, ...h };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

  // 25C threshold line Y position
  const y25 = svgHeight - 20 - ((25.0 - minT) / tRange) * (svgHeight - 35);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-700 ${
        data.tropical_night ? 'border-l-4' : ''
      }`}
      style={{
        borderLeftColor: data.tropical_night ? RISK_SCALE.risk4 : undefined,
      }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-4 h-4 text-muted" />
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted">
                Overnight Biometeorology
              </span>
            </div>
            <h3 className={`${TYPOGRAPHY.h3} text-ink flex items-center gap-2`}>
              <span>Tonight's Heat Recovery</span>
              {data.tropical_night ? (
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase font-semibold bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] text-ink border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-4" />
                  Tropical Night
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase font-semibold bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] text-ink border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-1" />
                  Adequate Cooling
                </span>
              )}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-muted uppercase block">Night Minimum</span>
            <span className="text-2xl font-mono font-bold text-ink tabular-nums">
              {data.night_min_c.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* SVG Overnight Curve (20:00 -> 06:00) */}
        <div className="bg-raised p-3 rounded-[6px] border border-border space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-muted px-1">
            <span>20:00 (Sunset)</span>
            <span className="text-muted">25°C Tropical Night Baseline</span>
            <span>06:00 (Dawn)</span>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-24 overflow-visible"
          >
            {/* 25°C threshold dashed line */}
            {y25 >= 0 && y25 <= svgHeight && (
              <g>
                <line
                  x1="10"
                  y1={y25}
                  x2={svgWidth - 10}
                  y2={y25}
                  stroke={RISK_SCALE.risk3}
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={svgWidth - 36}
                  y={y25 - 4}
                  fill={RISK_SCALE.risk3}
                  fontSize="9"
                  fontFamily="monospace"
                  opacity="0.8"
                >
                  25°C
                </text>
              </g>
            )}

            {/* Path curve */}
            <motion.path
              d={pathD}
              fill="none"
              stroke={data.tropical_night ? RISK_SCALE.risk4 : RISK_SCALE.risk1}
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Hourly sample points */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="#FBF9F4"
                  stroke={data.tropical_night ? RISK_SCALE.risk4 : RISK_SCALE.risk1}
                  strokeWidth="2"
                />
                {idx % 2 === 0 && (
                  <text
                    x={p.x}
                    y={svgHeight - 2}
                    textAnchor="middle"
                    fill="var(--muted)"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {p.time}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Guidance Checklist */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
            Night Sleep & Protection Guidance
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.guidance.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-[6px] bg-raised border border-border text-xs text-ink"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
