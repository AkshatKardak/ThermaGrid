import React, { useState, useMemo } from 'react';
import { getRiskBand, TOKENS, RISK_SCALE } from '../../theme/tokens';
import { formatNumber } from '../../utils/format';

interface ClockHourItem {
  hour: number;
  hourFormatted: string;
  wbgt: number;
  risk_score: number;
  color: string;
}

interface ClockDayItem {
  day: string;
  hours: ClockHourItem[];
}

interface RadialHeatClockProps {
  data: ClockDayItem[];
  currentHour?: number;
}

interface TooltipInfo {
  day: string;
  hourFormatted: string;
  risk: number;
  wbgt: number;
  band: string;
  x: number;
  y: number;
}

export const RadialHeatClock: React.FC<RadialHeatClockProps> = ({
  data,
  currentHour: propCurrentHour,
}) => {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const currentHour = useMemo(() => {
    if (typeof propCurrentHour === 'number') return propCurrentHour;
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }, [propCurrentHour]);

  // Dimensions
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;

  // Concentric Rings definition
  const rings = [
    { label: 'Day 1 (48h Ago)', rInner: 58, rOuter: 92 },
    { label: 'Day 2 (Yesterday)', rInner: 96, rOuter: 130 },
    { label: 'Day 3 (Today)', rInner: 134, rOuter: 168 },
  ];

  // Calculate Today's Peak Band and Hour
  const todayData = data[2]?.hours || data[data.length - 1]?.hours || [];
  const peakToday = useMemo(() => {
    if (!todayData || todayData.length === 0) {
      return { score: 78, hourFormatted: '14:00', band: 'High' };
    }
    const peak = [...todayData].sort((a, b) => b.risk_score - a.risk_score)[0];
    const band = getRiskBand(peak.risk_score);
    return {
      score: peak.risk_score,
      hourFormatted: peak.hourFormatted,
      band: band.label,
    };
  }, [todayData]);

  // Needle angle: 00:00 is top (-90 degrees), each hour is 15 degrees
  const needleAngleDeg = -90 + currentHour * 15;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLen = 172;
  const needleX = cx + needleLen * Math.cos(needleAngleRad);
  const needleY = cy + needleLen * Math.sin(needleAngleRad);

  // Helper to compute annular sector path
  const describeArc = (
    rInner: number,
    rOuter: number,
    startDeg: number,
    endDeg: number
  ) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + rOuter * Math.cos(startRad);
    const y1 = cy + rOuter * Math.sin(startRad);
    const x2 = cx + rOuter * Math.cos(endRad);
    const y2 = cy + rOuter * Math.sin(endRad);

    const x3 = cx + rInner * Math.cos(endRad);
    const y3 = cy + rInner * Math.sin(endRad);
    const x4 = cx + rInner * Math.cos(startRad);
    const y4 = cy + rInner * Math.sin(startRad);

    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* SVG Radial Clock */}
      <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center select-none">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={172} fill={TOKENS.raised} stroke={TOKENS.border} strokeWidth={1} />

          {/* 3 Concentric Rings */}
          {rings.map((ring, ringIdx) => {
            const dayItem = data[ringIdx];
            const hours = dayItem?.hours || [];

            return (
              <g key={ring.label}>
                {hours.map((hItem) => {
                  const h = hItem.hour;
                  // 24 segments around 360 degrees: 15 deg each
                  const startDeg = -90 + h * 15 + 0.3;
                  const endDeg = -90 + (h + 1) * 15 - 0.3;
                  const pathD = describeArc(ring.rInner, ring.rOuter, startDeg, endDeg);
                  const band = getRiskBand(hItem.risk_score);

                  return (
                    <path
                      key={`${ringIdx}-${h}`}
                      d={pathD}
                      fill={hItem.color}
                      stroke={TOKENS.raised}
                      strokeWidth={0.75}
                      className="cursor-pointer transition-opacity hover:opacity-85"
                      onMouseEnter={(evt) => {
                        const rect = evt.currentTarget.ownerSVGElement?.getBoundingClientRect();
                        if (rect) {
                          setTooltip({
                            day: ring.label,
                            hourFormatted: hItem.hourFormatted,
                            risk: hItem.risk_score,
                            wbgt: hItem.wbgt,
                            band: band.label,
                            x: evt.clientX - rect.left,
                            y: evt.clientY - rect.top,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Center Hole & Today's Peak Label */}
          <circle cx={cx} cy={cy} r={54} fill={TOKENS.surface} stroke={TOKENS.border} strokeWidth={1} />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-ink font-display font-bold text-xs"
          >
            {peakToday.band}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            className="fill-muted font-mono text-[10px]"
          >
            Peak {peakToday.hourFormatted}
          </text>
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            className="fill-accent font-mono text-[9px] font-semibold"
          >
            {formatNumber(peakToday.score, 1)} HTSI
          </text>

          {/* Cardinal Hour Labels (00, 06, 12, 18) */}
          <text x={cx} y={15} textAnchor="middle" className="fill-muted font-mono text-[10px] font-bold">
            00:00
          </text>
          <text x={size - 14} y={cy + 3} textAnchor="end" className="fill-muted font-mono text-[10px] font-bold">
            06:00
          </text>
          <text x={cx} y={size - 7} textAnchor="middle" className="fill-muted font-mono text-[10px] font-bold">
            12:00
          </text>
          <text x={14} y={cy + 3} textAnchor="start" className="fill-muted font-mono text-[10px] font-bold">
            18:00
          </text>

          {/* Radial Needle (Current Hour) */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={TOKENS.ink}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={4} fill={TOKENS.ink} />
          <circle cx={needleX} cy={needleY} r={3} fill={TOKENS.ink} />
        </svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            className="absolute z-30 pointer-events-none p-2.5 rounded-[6px] bg-raised/95 border border-border text-ink shadow-md font-mono text-xs space-y-0.5"
            style={{
              left: `${Math.min(size - 130, Math.max(10, tooltip.x + 8))}px`,
              top: `${Math.min(size - 70, Math.max(10, tooltip.y - 45))}px`,
            }}
          >
            <div className="font-bold text-ink">{tooltip.day}</div>
            <div className="text-[11px] text-muted">Time: {tooltip.hourFormatted}</div>
            <div className="text-[11px] text-ink font-semibold">
              Risk: {formatNumber(tooltip.risk, 1)} ({tooltip.band})
            </div>
            <div className="text-[10px] text-muted">WBGT: {formatNumber(tooltip.wbgt, 1)}°C</div>
          </div>
        )}
      </div>

      {/* Ring Legend & Caption */}
      <div className="w-full pt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted border-t border-border mt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-border bg-surface" />
            <span>Inner: 48h Ago</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-border bg-raised" />
            <span>Mid: Yesterday</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-border bg-accent-soft" />
            <span>Outer: Today</span>
          </span>
        </div>
        <div className="text-[11px] text-muted">
          Needle: current hour ({formatNumber(currentHour, 1)}h)
        </div>
      </div>
    </div>
  );
};
