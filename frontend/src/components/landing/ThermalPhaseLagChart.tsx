import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TOKENS } from '../../theme/tokens';
import { THERMAL_CONFIG, getOutdoorTemp } from '../../lib/thermalLag';
import { formatNumber } from '../../utils/format';

export type ArchetypeKey = 'tin' | 'rcc' | 'ac';

interface ArchetypeConfig {
  id: ArchetypeKey;
  label: string;
  sublabel: string;
  lagHours: number;
  lagLabel: string;
  damping: number; // Amplitude scale factor
  solarOffset: number; // Indoor heating delta
}

const ARCHETYPES: Record<ArchetypeKey, ArchetypeConfig> = {
  tin: {
    id: 'tin',
    label: 'Informal Tin-Roof',
    sublabel: 'Corrugated sheet, no insulation, rapid nocturnal cooling',
    lagHours: 0.9,
    lagLabel: 'Indoor peak 55m after outdoor peak',
    damping: 1.18,
    solarOffset: 3.4,
  },
  rcc: {
    id: 'rcc',
    label: 'Engineered RCC Concrete',
    sublabel: 'Heavy thermal mass envelope, 2–3h late-afternoon phase delay',
    lagHours: 2.5,
    lagLabel: 'Indoor peak 2h 30m after outdoor peak',
    damping: 0.72,
    solarOffset: 0.8,
  },
  ac: {
    id: 'ac',
    label: 'Air Conditioned Home',
    sublabel: 'Air conditioning eliminates heat spikes and night heat traps',
    lagHours: 0.2,
    lagLabel: 'Active climate regulation (steady cool)',
    damping: 0.15,
    solarOffset: -6.5,
  },
};

export const ThermalPhaseLagChart: React.FC = () => {
  const [activeArchetype, setActiveArchetype] = useState<ArchetypeKey>('rcc');
  const [hasEntered, setHasEntered] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t = setTimeout(() => setHasEntered(true), 900);
    return () => clearTimeout(t);
  }, []);

  const nowHour = useMemo(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }, []);

  const config = ARCHETYPES[activeArchetype];

  // Generate 24-hour time series points (00:00 to 24:00)
  const chartData = useMemo(() => {
    const pointsCount = 48; // Half-hour increments
    const outdoorBase = THERMAL_CONFIG.tMean;
    const outdoorAmp = THERMAL_CONFIG.tAmp;

    const items = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = (i / pointsCount) * 24;
      const outdoor = getOutdoorTemp(t);

      let indoor: number;
      if (activeArchetype === 'ac') {
        indoor = 24.5 + Math.sin(((t - 14) / 24) * 2 * Math.PI) * 0.6;
      } else {
        // Shift outdoor by archetype's phase lag and damp by amplitude factor
        const shiftedT = t - config.lagHours;
        const omega = (2 * Math.PI) / 24;
        const phaseResponse =
          outdoorBase +
          outdoorAmp * config.damping * Math.cos(omega * (shiftedT - THERMAL_CONFIG.peakHour));

        // Solar penetration peak around 13:00–16:00
        const solarComponent =
          t >= 6 && t <= 18
            ? config.solarOffset * Math.sin(((t - 6) / 12) * Math.PI)
            : 0;

        indoor = phaseResponse + solarComponent;
      }

      items.push({
        t,
        outdoor,
        indoor,
      });
    }
    return items;
  }, [activeArchetype, config]);

  // SVG Coordinates mapping
  const width = 720;
  const height = 280;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 32;
  const padBottom = 38;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minTemp = 20;
  const maxTemp = 44;

  const getX = (t: number) => padLeft + (t / 24) * plotW;
  const getY = (temp: number) => padTop + plotH - ((temp - minTemp) / (maxTemp - minTemp)) * plotH;

  // Build SVG path strings
  const outdoorPath = useMemo(() => {
    return chartData.reduce((acc, p, idx) => {
      const cmd = idx === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${formatNumber(getX(p.t), 1)} ${formatNumber(getY(p.outdoor), 1)}`;
    }, '');
  }, [chartData]);

  const indoorPath = useMemo(() => {
    return chartData.reduce((acc, p, idx) => {
      const cmd = idx === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${formatNumber(getX(p.t), 1)} ${formatNumber(getY(p.indoor), 1)}`;
    }, '');
  }, [chartData]);

  // Marker for "now"
  const markerX = getX(nowHour);
  const nowOutdoor = getOutdoorTemp(nowHour);
  const nowIndoor =
    chartData.find((d) => Math.abs(d.t - nowHour) <= 0.5)?.indoor || 34.0;

  return (
    <div className="w-full bg-surface border border-border rounded-[10px] p-5 sm:p-6 space-y-6">
      {/* Archetype Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block">
            How Building Materials Absorb &amp; Delay Heat
          </span>
          <h3 className="text-base font-bold font-display text-ink mt-0.5">
            24-Hour Temperature Curve: Outdoor vs. Indoor
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Shows how tin roofs peak early at 2:30 PM while concrete roofs delay peak heat to late afternoon.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-raised rounded-[8px] border border-border self-start sm:self-auto">
          {(Object.keys(ARCHETYPES) as ArchetypeKey[]).map((key) => {
            const arch = ARCHETYPES[key];
            const isActive = activeArchetype === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveArchetype(key)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                {arch.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real Real-Time Metric & Active Archetype Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[6px] bg-raised border border-border text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-ink">{config.label}</span>
          <span className="text-muted">•</span>
          <span className="text-accent font-semibold">{config.lagLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-muted text-[11px]">
          <span>Now ({formatNumber(nowHour, 1)}h): Outdoor {formatNumber(nowOutdoor, 1)}°C</span>
          <span>•</span>
          <span className="text-ink font-bold">Indoor {formatNumber(nowIndoor, 1)}°C</span>
        </div>
      </div>

      {/* Phase Lag Curves SVG */}
      <div className="w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[620px] h-auto"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          {/* Horizontal Grid lines */}
          {[20, 26, 32, 38, 44].map((tVal) => {
            const y = getY(tVal);
            return (
              <g key={tVal}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={TOKENS.border}
                  strokeWidth={0.75}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted font-mono text-[10px]"
                >
                  {tVal}°
                </text>
              </g>
            );
          })}

          {/* Vertical Hour lines at 00, 06, 12, 18, 24 */}
          {[0, 6, 12, 18, 24].map((hVal) => {
            const x = getX(hVal);
            return (
              <g key={hVal}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotH}
                  stroke={TOKENS.border}
                  strokeWidth={0.75}
                />
                <text
                  x={x}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[10px]"
                >
                  {String(hVal).padStart(2, '0')}:00
                </text>
              </g>
            );
          })}

          {/* Outdoor Temperature Curve (Muted dashed line) */}
          <path
            d={outdoorPath}
            fill="none"
            stroke={TOKENS.muted}
            strokeWidth={1.75}
            strokeDasharray="4 4"
            className="transition-all duration-300"
          />

          {/* Indoor Temperature Curve (Animated bold accent line) */}
          <path
            d={indoorPath}
            fill="none"
            stroke={activeArchetype === 'tin' ? TOKENS.error : TOKENS.accent}
            strokeWidth={2.75}
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* "Now" Sweeping Vertical Marker */}
          <line
            x1={markerX}
            y1={padTop - 8}
            x2={markerX}
            y2={padTop + plotH}
            stroke={TOKENS.ink}
            strokeWidth={1.5}
          />
          <circle cx={markerX} cy={getY(nowIndoor)} r={4} fill={TOKENS.ink} />
          <circle cx={markerX} cy={getY(nowOutdoor)} r={3.5} fill={TOKENS.muted} />

          {/* Marker Top Pill Label */}
          <g transform={`translate(${Math.min(width - padRight - 150, Math.max(padLeft, markerX - 60))}, ${padTop - 24})`}>
            <rect
              x={0}
              y={0}
              width={130}
              height={18}
              rx={3}
              fill={TOKENS.raised}
              stroke={TOKENS.border}
            />
            <text
              x={65}
              y={12}
              textAnchor="middle"
              className="fill-ink font-mono text-[9px] font-bold"
            >
              NOW · {config.lagLabel.split('after')[0].trim()}
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Provenance Caption */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs font-mono text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-muted border-b border-dashed" />
            <span>Outdoor Ambient WBGT</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 h-[3px] rounded-full"
              style={{ backgroundColor: activeArchetype === 'tin' ? TOKENS.error : TOKENS.accent }}
            />
            <span className="font-semibold text-ink">{config.label} Indoor</span>
          </span>
        </div>
        <div>
          <span>Model: First-Order Envelope Conduction (ISO 13786 / Liljegren)</span>
        </div>
      </div>
    </div>
  );
};
