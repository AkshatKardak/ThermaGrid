import React from 'react';
import { motion } from 'framer-motion';
import { Moon, AlertCircle, CheckCircle, Info, Wind } from 'lucide-react';
import { useNightRisk } from '../../hooks/useNightRisk';
import { Card } from '../ui/Card';
import { getRiskBand, THEME_COLORS } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';

interface TonightCardProps {
  locationId: number;
}

export const TonightCard: React.FC<TonightCardProps> = ({ locationId }) => {
  const { data, isLoading } = useNightRisk(locationId);

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="h-6 w-1/3 bg-white/5 rounded animate-pulse" />
        <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
      </Card>
    );
  }

  if (!data?.available || data.night_min_c === null) {
    return (
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B9AA8] uppercase tracking-wider">
          <Moon className="w-4 h-4 text-[#8B9AA8]" />
          <span>Overnight Thermal Recovery</span>
        </div>
        <h3 className={`${TYPOGRAPHY.h3} text-white`}>Tonight</h3>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8B9AA8]">
          {data?.message || "Tonight's data not yet available — updates every model cycle."}
        </div>
      </Card>
    );
  }

  const bandDef = getRiskBand(data.tropical_night ? 75 : 30);
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
        borderLeftColor: data.tropical_night ? THEME_COLORS.heatScale.veryhigh : undefined,
      }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-4 h-4 text-[#8B9AA8]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8B9AA8]">
                Overnight Biometeorology
              </span>
            </div>
            <h3 className={`${TYPOGRAPHY.h3} text-white flex items-center gap-2`}>
              <span>Tonight's Heat Recovery</span>
              {data.tropical_night ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#FF704F]/20 text-[#FF704F] border border-[#FF704F]/40">
                  Tropical Night
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#2FA37C]/20 text-[#2FA37C] border border-[#2FA37C]/40">
                  Adequate Cooling
                </span>
              )}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-[#8B9AA8] uppercase block">Night Minimum</span>
            <span
              className="text-2xl font-mono font-bold"
              style={{
                color: data.night_min_c >= 25.0 ? THEME_COLORS.heatScale.veryhigh : THEME_COLORS.heatScale.safe,
              }}
            >
              {data.night_min_c.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* SVG Overnight Curve (20:00 -> 06:00) */}
        <div className="bg-[#0B141B] p-3 rounded-xl border border-white/10 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#8B9AA8] px-1">
            <span>20:00 (Sunset)</span>
            <span className="text-[#F59E0B]">25°C Tropical Night Baseline</span>
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
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={svgWidth - 36}
                  y={y25 - 4}
                  fill="#F59E0B"
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
              stroke={data.tropical_night ? '#FF704F' : '#2FA37C'}
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
                  fill="#0B141B"
                  stroke={data.tropical_night ? '#FF704F' : '#2FA37C'}
                  strokeWidth="2"
                />
                {idx % 2 === 0 && (
                  <text
                    x={p.x}
                    y={svgHeight - 2}
                    textAnchor="middle"
                    fill="#5F7183"
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
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
            Night Sleep & Protection Guidance
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.guidance.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-[#D7E0E7]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#8FB3D9] mt-1.5 shrink-0" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
