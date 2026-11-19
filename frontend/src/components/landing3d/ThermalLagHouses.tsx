import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Sun, Moon, Clock, Info, ArrowDown } from 'lucide-react';
import { evaluateThermalLag, getWavefrontMetrics } from '../../lib/thermalLag';
import { getRiskHex } from './palette';
import { formatNumber, roundNumber } from '../../utils/format';

export interface ThermalLagHousesProps {
  className?: string;
  staticHour?: number;
}

const PRESET_HOURS = [
  { label: 'Dawn (06:00)', hour: 6.0, icon: Sun, desc: 'Cool morning baseline before sunrise' },
  { label: 'Solar Peak (12:00)', hour: 12.0, icon: Sun, desc: 'Sun directly overhead at maximum irradiance' },
  { label: 'Tin Roof Peak (14:30)', hour: 14.5, icon: Clock, desc: 'Thin metal roof conduction peaks early' },
  { label: 'Concrete Delayed Peak (17:15)', hour: 17.25, icon: Clock, desc: 'High thermal inertia delays indoor peak to late afternoon' },
  { label: 'Night Heat Trap (03:00)', hour: 3.0, icon: Moon, desc: 'Concrete retains trapped daytime heat all night long' },
];

export const ThermalLagHouses: React.FC<ThermalLagHousesProps> = ({
  className = '',
  staticHour,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion and mobile layout
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaMobile = window.matchMedia('(max-width: 767px)');

    const updateMotion = () => setPrefersReducedMotion(mediaMotion.matches);
    const updateMobile = () => setIsMobile(mediaMobile.matches);

    mediaMotion.addEventListener('change', updateMotion);
    mediaMobile.addEventListener('change', updateMobile);

    return () => {
      mediaMotion.removeEventListener('change', updateMotion);
      mediaMobile.removeEventListener('change', updateMobile);
    };
  }, []);

  const isStatic = staticHour !== undefined || prefersReducedMotion;

  // Clock state: default to 14.5 (14:30 peak) for static or default mode
  const [hour, setHour] = useState<number>(staticHour !== undefined ? staticHour : (prefersReducedMotion ? 14.5 : 0.0));
  const [isPlaying, setIsPlaying] = useState<boolean>(!isStatic);
  const [userInteracted, setUserInteracted] = useState<boolean>(isStatic);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(true);

  const hourRef = useRef<number>(hour);
  hourRef.current = hour;
  const userInteractedRef = useRef<boolean>(userInteracted);
  userInteractedRef.current = userInteracted;

  // Visibility and Intersection Observer to pause when offscreen or tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    if (containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        },
        { threshold: 0.15 }
      );
      observer.observe(containerRef.current);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        observer.disconnect();
      };
    }

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // On mount: run ONE automatic 0 -> 24h sweep in ~4s, then hand control to user (do NOT loop)
  useEffect(() => {
    if (isStatic || userInteractedRef.current) return;

    let animId: number;
    const startSweepTime = performance.now();
    const sweepDurationMs = 4000; // 4.0 seconds for single 0->24h sweep

    const sweepLoop = (now: number) => {
      if (userInteractedRef.current) return;
      const elapsed = now - startSweepTime;
      const progress = Math.min(elapsed / sweepDurationMs, 1.0);
      const nextH = progress * 24.0;

      hourRef.current = nextH;
      setHour(nextH);

      if (progress < 1.0) {
        animId = requestAnimationFrame(sweepLoop);
      } else {
        // Sweep finished! Stop and hand control to user. Do not loop.
        setIsPlaying(false);
      }
    };

    animId = requestAnimationFrame(sweepLoop);
    return () => cancelAnimationFrame(animId);
  }, [isStatic]);

  // User-initiated playback loop (when user explicitly presses Play)
  useEffect(() => {
    if (!isPlaying || isStatic || !userInteracted || !isTabVisible || !isIntersecting) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Advance ~1.2 hours per second
      const nextHour = (hourRef.current + delta * 1.2) % 24;
      hourRef.current = nextHour;
      setHour(nextHour);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isStatic, userInteracted, isTabVisible, isIntersecting]);

  // Thermal state & metrics computed dynamically from mathematical model
  const thermalState = useMemo(() => evaluateThermalLag(hour), [hour]);
  const metrics = useMemo(() => getWavefrontMetrics(hour), [hour]);

  // Night 03:00 state for dynamic comparative delta
  const nightStateAt03 = useMemo(() => evaluateThermalLag(3.0), []);
  const deltaAt03 = useMemo(
    () => roundNumber(nightStateAt03.rccIndoorTemp - nightStateAt03.tinIndoorTemp, 1),
    [nightStateAt03]
  );

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setUserInteracted(true);
    setIsPlaying(false);
    setHour(val);
  }, []);

  const handlePresetClick = useCallback((presetHour: number) => {
    setUserInteracted(true);
    setIsPlaying(false);
    setHour(presetHour);
  }, []);

  const togglePlay = useCallback(() => {
    setUserInteracted(true);
    setIsPlaying((prev) => !prev);
  }, []);

  const resetToPeak = useCallback(() => {
    setUserInteracted(true);
    setIsPlaying(false);
    setHour(14.5);
  }, []);

  // Shared Sun / Moon celestial trajectory across 06:00 to 18:00 (day) and 18:00 to 06:00 (night)
  const isDaytime = hour >= 6.0 && hour <= 18.0;
  const celestialProgress = useMemo(() => {
    if (isDaytime) {
      return (hour - 6.0) / 12.0; // 0 at 06:00, 0.5 at 12:00, 1 at 18:00
    }
    // Night hours 18:00 -> 24:00 -> 06:00
    return hour >= 18.0 ? (hour - 18.0) / 12.0 : (hour + 6.0) / 12.0;
  }, [hour, isDaytime]);

  // Quadratic bezier coordinates for arc: start (24, 28), control (160, 6), end (296, 28)
  const arcX = useMemo(() => {
    const p = Math.max(0, Math.min(1, celestialProgress));
    return (1 - p) * (1 - p) * 24 + 2 * (1 - p) * p * 160 + p * p * 296;
  }, [celestialProgress]);

  const arcY = useMemo(() => {
    const p = Math.max(0, Math.min(1, celestialProgress));
    return (1 - p) * (1 - p) * 28 + 2 * (1 - p) * p * 6 + p * p * 28;
  }, [celestialProgress]);

  // Radiation intensity for downward sky arrows
  const solarFluxWatts = Math.round(metrics.solarIntensity * 850);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative w-full rounded-[8px] border border-border bg-panel-dark overflow-hidden select-none min-h-[580px] ${className}`}
    >
      <div className="relative w-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 space-y-6">
        {/* TOP HUD: Clock, Shared Celestial Arc, Controls & Outdoor Temp */}
        <div className="relative z-20 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 rounded-[8px] bg-panel-dark/95 backdrop-blur-md border border-border">
            {/* Clock & Time Display */}
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isPlaying ? 'bg-accent animate-pulse' : 'bg-muted'
                }`}
              />
              <div>
                <span className="text-[10px] font-mono uppercase text-raised/70 block">
                  DAILY CYCLE CLOCK
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-raised tabular-nums tracking-tight">
                  {thermalState.timeFormatted}
                </span>
              </div>
            </div>

            {/* Shared Celestial Sun / Moon Arc */}
            <div className="hidden sm:flex flex-col items-center justify-center px-2 w-[220px]">
              <div className="flex items-center justify-between w-full text-[9px] font-mono text-raised/50 px-1">
                <span>{isDaytime ? '06:00 Dawn' : '18:00 Dusk'}</span>
                <span>{isDaytime ? '12:00 Noon' : '00:00 Midnight'}</span>
                <span>{isDaytime ? '18:00 Sunset' : '06:00 Dawn'}</span>
              </div>
              <svg viewBox="0 0 320 36" className="w-full h-9 overflow-visible">
                {/* Arc Trajectory Line */}
                <path
                  d="M 24 28 Q 160 6 296 28"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />

                {/* Celestial Marker: Sun or Moon */}
                {isDaytime ? (
                  <g transform={`translate(${arcX}, ${arcY})`}>
                    <circle
                      r="7"
                      fill="var(--risk-2)"
                      stroke="var(--ink)"
                      strokeWidth="1.5"
                    />
                    <circle
                      r="12"
                      fill="var(--risk-2)"
                      opacity="0.25"
                      className="animate-ping"
                    />
                  </g>
                ) : (
                  <g transform={`translate(${arcX}, ${arcY})`}>
                    <circle
                      r="6"
                      fill="var(--border)"
                      stroke="var(--ink)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M -2 -4 A 5 5 0 0 0 3 4 A 4 4 0 0 1 -2 -4"
                      fill="var(--raised)"
                      opacity="0.8"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* Interactive Scrubber Controls */}
            <div className="flex-1 max-w-xs sm:max-w-sm flex items-center gap-2.5 px-1">
              <button
                type="button"
                onClick={togglePlay}
                title={isPlaying ? 'Pause 24-hour cycle' : 'Play 24-hour cycle'}
                className="w-8 h-8 rounded-[6px] bg-raised hover:bg-surface border border-border text-ink flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={hour}
                  onChange={handleSliderChange}
                  className="w-full accent-accent cursor-pointer h-1.5 bg-raised/30 rounded-lg appearance-none"
                  aria-label="Scrub 24-hour cycle"
                />
                <div className="flex justify-between text-[9px] font-mono text-raised/50 px-0.5">
                  <span>00h</span>
                  <span>06h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>24h</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetToPeak}
                title="Reset to 14:30 Tin Peak"
                className="w-8 h-8 rounded-[6px] bg-raised/70 hover:bg-raised border border-border text-ink flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shared Outdoor Ambient Temperature */}
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-raised/70 block">
                OUTDOOR AMBIENT
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-raised tabular-nums">
                {formatNumber(thermalState.outdoorTemp, 1)}°C
              </span>
            </div>
          </div>

          {/* Preset Timestamp Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-raised/60 mr-1 hidden sm:inline">
              Key Timestamps:
            </span>
            {PRESET_HOURS.map((p) => {
              const isActive = Math.abs(hour - p.hour) < 0.75;
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetClick(p.hour)}
                  title={p.desc}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-accent text-on-accent border border-accent font-semibold'
                      : 'bg-panel-dark/80 hover:bg-panel-dark text-raised/70 hover:text-raised border border-border/70'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER SECTION: Side-by-Side 2D Thermal Wavefront Cross-Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* ------------------------------------------------------------- */}
          {/* PANEL 1: Informal Corrugated Tin Roof                          */}
          {/* ------------------------------------------------------------- */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-panel-dark/95 border border-border flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div>
                <span className="text-sm font-bold text-raised font-display block">
                  INFORMAL TIN-ROOF
                </span>
                <span className="text-[11px] font-mono text-raised/60">
                  Thin sheet (4px slab) · τ ≈ 0.9h response
                </span>
              </div>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-[4px] bg-raised text-ink border border-border inline-flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getRiskHex(thermalState.tinIndoorTemp > 35 ? 75 : 30) }}
                />
                {thermalState.tinAlertGrade}
              </span>
            </div>

            {/* 2D Cut-Away Section SVG */}
            <div className="relative w-full aspect-[16/10] flex items-center justify-center">
              <svg
                viewBox="0 0 360 220"
                className="w-full h-full"
                aria-label="Thermal Wavefront Cross Section: Informal Tin Roof"
              >
                <defs>
                  {/* Wavefront vertical temperature gradient: cool end --risk-1 to warm end --risk-4 */}
                  <linearGradient id="tin-wavefront-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--risk-4)" />
                    <stop offset="45%" stopColor="color-mix(in srgb, var(--risk-4) 60%, var(--risk-1))" />
                    <stop offset="85%" stopColor="color-mix(in srgb, var(--risk-4) 20%, var(--risk-1))" />
                    <stop offset="100%" stopColor="var(--risk-1)" stopOpacity="0.45" />
                  </linearGradient>

                  {/* Interior Temperature Bar vertical gradient */}
                  <linearGradient id="tin-bar-grad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="var(--risk-1)" />
                    <stop offset="50%" stopColor="color-mix(in srgb, var(--risk-4) 50%, var(--risk-1))" />
                    <stop offset="100%" stopColor="var(--risk-4)" />
                  </linearGradient>
                </defs>

                {/* 1. Downward Solar Flux Radiation Arrows from Sky */}
                <g opacity={Math.max(0.12, metrics.solarIntensity)}>
                  {[80, 150, 220].map((x) => (
                    <g key={x}>
                      <line
                        x1={x}
                        y1="10"
                        x2={x}
                        y2="34"
                        stroke="var(--risk-4)"
                        strokeWidth="2"
                        strokeDasharray={isDaytime ? 'none' : '2 2'}
                      />
                      <polygon
                        points={`${x-3},28 ${x},35 ${x+3},28`}
                        fill="var(--risk-4)"
                      />
                    </g>
                  ))}
                  <text
                    x="150"
                    y="22"
                    textAnchor="middle"
                    fill="var(--raised)"
                    fontSize="9"
                    fontFamily="monospace"
                    opacity="0.8"
                  >
                    {isDaytime ? `Solar Radiation: ${solarFluxWatts} W/m²` : 'Nocturnal Sky Cooling'}
                  </text>
                </g>

                {/* 2. Roof Slab: Thin Tin Roof (4px height) */}
                <rect
                  x="30"
                  y="40"
                  width="240"
                  height="4"
                  fill="color-mix(in srgb, var(--risk-4) 80%, var(--surface))"
                  stroke="var(--border)"
                  strokeWidth="1"
                />

                {/* 3. Room Cavity & Walls */}
                {/* Left Wall */}
                <rect x="30" y="44" width="10" height="152" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                {/* Right Wall */}
                <rect x="260" y="44" width="10" height="152" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                {/* Floor Slab */}
                <rect x="26" y="196" width="248" height="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />

                {/* 4. Room Air Space */}
                {/* Background Cool Room Air */}
                <rect
                  x="40"
                  y="44"
                  width="220"
                  height="152"
                  fill="var(--surface)"
                  opacity="0.15"
                />

                {/* 5. The Thermal Wavefront Penetration */}
                {/* Depth is dynamically driven by tinDepth(t) from evaluateThermalLag */}
                {(() => {
                  const maxRoomHeight = 152;
                  const currentWaveHeight = Math.max(4, Math.min(maxRoomHeight, metrics.tinDepth * maxRoomHeight));
                  return (
                    <g>
                      <rect
                        x="40"
                        y="44"
                        width="220"
                        height={currentWaveHeight}
                        fill="url(#tin-wavefront-grad)"
                        opacity="0.88"
                      />
                      {/* Leading edge of conduction wavefront */}
                      <line
                        x1="40"
                        y1={44 + currentWaveHeight}
                        x2="260"
                        y2={44 + currentWaveHeight}
                        stroke="var(--risk-4)"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.75"
                      />
                      <text
                        x="46"
                        y={Math.min(188, 44 + currentWaveHeight - 4)}
                        fill="var(--raised)"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Wavefront Depth: {Math.round(metrics.tinDepth * 100)}%
                      </text>
                    </g>
                  );
                })()}

                {/* 6. Interior Temperature Meter Bar Beside Room */}
                <g>
                  {/* Track */}
                  <rect
                    x="290"
                    y="54"
                    width="12"
                    height="142"
                    rx="3"
                    fill="var(--surface)"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                  {/* Fill proportional to 20°C - 44°C temp range */}
                  {(() => {
                    const trackHeight = 142;
                    const fillRatio = Math.max(0.08, Math.min(1.0, (thermalState.tinIndoorTemp - 20) / 24));
                    const fillHeight = trackHeight * fillRatio;
                    const barY = 54 + (trackHeight - fillHeight);
                    return (
                      <>
                        <rect
                          x="291"
                          y={barY}
                          width="10"
                          height={fillHeight}
                          rx="2"
                          fill="url(#tin-bar-grad)"
                        />
                        {/* Numeric temperature readout in ink */}
                        <text
                          x="296"
                          y={Math.max(46, barY - 6)}
                          textAnchor="middle"
                          fill="var(--ink)"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                          className="select-none"
                        >
                          {formatNumber(thermalState.tinIndoorTemp, 1)}°C
                        </text>
                      </>
                    );
                  })()}
                  <text
                    x="296"
                    y="210"
                    textAnchor="middle"
                    fill="var(--raised)"
                    fontSize="8"
                    fontFamily="monospace"
                    opacity="0.6"
                  >
                    INDOOR
                  </text>
                </g>
              </svg>
            </div>

            <p className="text-xs text-raised/70 leading-relaxed border-t border-border/40 pt-2">
              Wavefront crosses the thin 4mm metal roof in ~30 minutes. Rapid heat penetration turns room into an oven by 14:30. Post-sunset, heat quickly dissipates back into the sky.
            </p>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANEL 2: Engineered Concrete (RCC) Roof                       */}
          {/* ------------------------------------------------------------- */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-panel-dark/95 border border-border flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div>
                <span className="text-sm font-bold text-raised font-display block">
                  ENGINEERED CONCRETE
                </span>
                <span className="text-[11px] font-mono text-raised/60">
                  Thick slab (22px slab) · τ ≈ 3.4h thermal inertia
                </span>
              </div>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-[4px] bg-raised text-ink border border-border inline-flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getRiskHex(thermalState.rccIndoorTemp > 35 ? 75 : 30) }}
                />
                {thermalState.rccAlertGrade}
              </span>
            </div>

            {/* 2D Cut-Away Section SVG */}
            <div className="relative w-full aspect-[16/10] flex items-center justify-center">
              <svg
                viewBox="0 0 360 220"
                className="w-full h-full"
                aria-label="Thermal Wavefront Cross Section: Engineered Concrete Roof"
              >
                <defs>
                  <linearGradient id="rcc-wavefront-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--risk-4)" />
                    <stop offset="50%" stopColor="color-mix(in srgb, var(--risk-4) 55%, var(--risk-1))" />
                    <stop offset="85%" stopColor="color-mix(in srgb, var(--risk-4) 20%, var(--risk-1))" />
                    <stop offset="100%" stopColor="var(--risk-1)" stopOpacity="0.45" />
                  </linearGradient>

                  <linearGradient id="rcc-bar-grad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="var(--risk-1)" />
                    <stop offset="50%" stopColor="color-mix(in srgb, var(--risk-4) 50%, var(--risk-1))" />
                    <stop offset="100%" stopColor="var(--risk-4)" />
                  </linearGradient>
                </defs>

                {/* 1. Downward Solar Flux Radiation Arrows from Sky */}
                <g opacity={Math.max(0.12, metrics.solarIntensity)}>
                  {[80, 150, 220].map((x) => (
                    <g key={x}>
                      <line
                        x1={x}
                        y1="10"
                        x2={x}
                        y2="34"
                        stroke="var(--risk-4)"
                        strokeWidth="2"
                        strokeDasharray={isDaytime ? 'none' : '2 2'}
                      />
                      <polygon
                        points={`${x-3},28 ${x},35 ${x+3},28`}
                        fill="var(--risk-4)"
                      />
                    </g>
                  ))}
                  <text
                    x="150"
                    y="22"
                    textAnchor="middle"
                    fill="var(--raised)"
                    fontSize="9"
                    fontFamily="monospace"
                    opacity="0.8"
                  >
                    {isDaytime ? `Solar Radiation: ${solarFluxWatts} W/m²` : 'Attenuated Conduction'}
                  </text>
                </g>

                {/* 2. Roof Slab: Heavy Concrete Slab (22px height) */}
                <rect
                  x="30"
                  y="40"
                  width="240"
                  height="22"
                  fill="color-mix(in srgb, var(--risk-4) 65%, var(--raised))"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                />
                <text
                  x="150"
                  y="55"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Heavy Reinforced Concrete Slab (22px)
                </text>

                {/* 3. Room Cavity & Walls */}
                {/* Left Wall */}
                <rect x="30" y="62" width="10" height="134" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                {/* Right Wall */}
                <rect x="260" y="62" width="10" height="134" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                {/* Floor Slab */}
                <rect x="26" y="196" width="248" height="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />

                {/* 4. Room Air Space */}
                {/* Background Cool Room Air */}
                <rect
                  x="40"
                  y="62"
                  width="220"
                  height="134"
                  fill="var(--surface)"
                  opacity="0.15"
                />

                {/* 5. The Thermal Wavefront Penetration */}
                {/* RCC Wavefront moves slowly, peaks late (~17:15), and plateaus overnight (~35% depth) */}
                {(() => {
                  const maxRoomHeight = 134;
                  const currentWaveHeight = Math.max(12, Math.min(maxRoomHeight, metrics.rccDepth * maxRoomHeight));
                  return (
                    <g>
                      <rect
                        x="40"
                        y="62"
                        width="220"
                        height={currentWaveHeight}
                        fill="url(#rcc-wavefront-grad)"
                        opacity="0.88"
                      />
                      {/* Leading edge of conduction wavefront */}
                      <line
                        x1="40"
                        y1={62 + currentWaveHeight}
                        x2="260"
                        y2={62 + currentWaveHeight}
                        stroke="var(--risk-4)"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.75"
                      />
                      <text
                        x="46"
                        y={Math.min(188, 62 + currentWaveHeight - 4)}
                        fill="var(--raised)"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Wavefront Depth: {Math.round(metrics.rccDepth * 100)}% (Delayed)
                      </text>
                    </g>
                  );
                })()}

                {/* 6. Interior Temperature Meter Bar Beside Room */}
                <g>
                  {/* Track */}
                  <rect
                    x="290"
                    y="54"
                    width="12"
                    height="142"
                    rx="3"
                    fill="var(--surface)"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                  {/* Fill proportional to 20°C - 44°C temp range */}
                  {(() => {
                    const trackHeight = 142;
                    const fillRatio = Math.max(0.08, Math.min(1.0, (thermalState.rccIndoorTemp - 20) / 24));
                    const fillHeight = trackHeight * fillRatio;
                    const barY = 54 + (trackHeight - fillHeight);
                    return (
                      <>
                        <rect
                          x="291"
                          y={barY}
                          width="10"
                          height={fillHeight}
                          rx="2"
                          fill="url(#rcc-bar-grad)"
                        />
                        {/* Numeric temperature readout in ink */}
                        <text
                          x="296"
                          y={Math.max(46, barY - 6)}
                          textAnchor="middle"
                          fill="var(--ink)"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                          className="select-none"
                        >
                          {formatNumber(thermalState.rccIndoorTemp, 1)}°C
                        </text>
                      </>
                    );
                  })()}
                  <text
                    x="296"
                    y="210"
                    textAnchor="middle"
                    fill="var(--raised)"
                    fontSize="8"
                    fontFamily="monospace"
                    opacity="0.6"
                  >
                    INDOOR
                  </text>
                </g>
              </svg>
            </div>

            <p className="text-xs text-raised/70 leading-relaxed border-t border-border/40 pt-2">
              High heat capacity delays thermal mass penetration. Peak heat reaches the room hours later at 17:15. At night, the thick slab traps heat and stays warm until dawn.
            </p>
          </div>
        </div>

        {/* DATA-DRIVEN LINE UNDER PANELS (Phase 2 Requirement) */}
        <div className="p-3 rounded-[8px] bg-panel-dark/90 border border-border text-center font-mono text-xs text-raised/90 flex flex-wrap items-center justify-center gap-2">
          <span>
            At 03:00, concrete is{' '}
            <strong className="text-accent font-bold">
              +{formatNumber(deltaAt03, 1)} °C
            </strong>{' '}
            warmer than tin
          </span>
          <span className="text-raised/40">|</span>
          <span className="text-raised/80">
            Currently ({thermalState.timeFormatted}): Concrete is{' '}
            <strong className={metrics.isRccWarmer ? 'text-accent font-bold' : 'text-raised'}>
              {metrics.deltaAtCurrent >= 0 ? `+${formatNumber(metrics.deltaAtCurrent, 1)}` : formatNumber(metrics.deltaAtCurrent, 1)} °C
            </strong>{' '}
            vs Tin
          </span>
        </div>

        {/* SCIENTIFIC CALLOUT BANNERS WITH NIGHTTIME HIGHLIGHTING */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {/* Daytime Phase Lag Observation */}
            {hour >= 14 && hour <= 18 && (
              <motion.div
                key="phase-lag"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="p-3 rounded-[6px] bg-panel-dark/95 border border-border text-center text-xs font-mono text-raised flex items-center justify-center gap-2"
              >
                <span className="text-accent font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                  Thermal Inertia Delay Active:
                </span>
                <span>
                  While outdoor ambient cools from 39°C down to 35°C, absorbed heat travelling through the concrete roof continues heating the room until 17:15.
                </span>
              </motion.div>
            )}

            {/* Nocturnal Heat Trapping (Highlights only when RCC > tin) */}
            {(hour < 6.0 || hour >= 20.0) && (
              <motion.div
                key="nocturnal-heat-trap"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className={`p-3 rounded-[6px] text-center text-xs font-mono flex items-center justify-center gap-2 transition-all ${
                  metrics.isRccWarmer
                    ? 'bg-accent/15 border-2 border-accent text-raised shadow-md'
                    : 'bg-panel-dark/95 border border-border text-raised'
                }`}
              >
                <span className="text-accent font-semibold flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-accent shrink-0" />
                  Trapped Nighttime Heat:
                </span>
                <span>
                  After 20:00, tin room wavefront retracts completely ({formatNumber(thermalState.tinIndoorTemp, 1)}°C) while concrete retains trapped mass ({formatNumber(thermalState.rccIndoorTemp, 1)}°C, +{formatNumber(metrics.deltaAtCurrent, 1)}°C), disrupting nocturnal recovery.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
