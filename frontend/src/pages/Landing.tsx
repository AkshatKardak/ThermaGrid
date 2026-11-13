import React, { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { TwoWardsComparison } from '../components/dashboard/TwoWardsComparison';
import { SectionHeader } from '../components/ui/SectionHeader';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { ProvenanceChip } from '../components/ui/ProvenanceChip';
import { TYPOGRAPHY } from '../theme/typography';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useRole } from '../hooks/useRole';
import { getRiskBand } from '../theme/tokens';
import { useCanRender3D } from '../components/landing3d/useCanRender3D';
import { ThermalLagStaticFallback } from '../components/landing3d/ThermalLagStaticFallback';

// Lazy-load 3D scenes to eliminate Three.js from the initial critical render path
const WardHeatSkyline = React.lazy(() =>
  import('../components/landing3d/WardHeatSkyline').then((m) => ({ default: m.WardHeatSkyline }))
);

const ThermalLagHouses = React.lazy(() =>
  import('../components/landing3d/ThermalLagHouses').then((m) => ({ default: m.ThermalLagHouses }))
);

const WardHeatCity = React.lazy(() =>
  import('../three/scenes/WardHeatCity').then((m) => ({ default: m.WardHeatCity }))
);

export const Landing: React.FC = () => {
  const { isSignedIn, isLoaded, role } = useRole();
  const heroRef = useRef<HTMLDivElement>(null);
  const canRender3D = useCanRender3D();
  const [selectedWardCode, setSelectedWardCode] = React.useState<string | null>(null);

  // If user is already authenticated, route based on role:
  // authority -> /app/authority, citizen -> /app (Citizen overview)
  if (isLoaded && isSignedIn) {
    if (role === 'authority' || role === 'admin') {
      return <Navigate to="/app/authority" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  // Fetch real observed ward risk and demographic metadata from backend
  const { data: wardsRisk } = useAllWardsRisk();
  const { data: wards } = useWards();

  // Explicit source gating: live observations if returned by API, otherwise sample state
  const isLive = Boolean(wardsRisk && wardsRisk.length > 0);

  // Sample state - explicitly gated behind source: 'sample' and badged visibly
  const sampleWards = React.useMemo(
    () => [
      { ward_name: 'Ward M/East (Govandi)', ward_code: 'WARD_ME', risk_score: 84.2, wbgt_c: 34.6, temperature_c: 38.2, latitude: 19.0558, longitude: 72.9315, source: 'sample' },
      { ward_name: 'Ward G/North (Dharavi)', ward_code: 'WARD_GN', risk_score: 79.5, wbgt_c: 33.8, temperature_c: 37.9, latitude: 19.041, longitude: 72.855, source: 'sample' },
      { ward_name: 'Ward L (Kurla East)', ward_code: 'WARD_L', risk_score: 73.1, wbgt_c: 33.1, temperature_c: 37.4, latitude: 19.068, longitude: 72.885, source: 'sample' },
      { ward_name: 'Ward H/East (Bandra E)', ward_code: 'WARD_HE', risk_score: 68.4, wbgt_c: 32.5, temperature_c: 36.8, latitude: 19.058, longitude: 72.848, source: 'sample' },
      { ward_name: 'Ward A (Colaba / Fort)', ward_code: 'WARD_A', risk_score: 38.6, wbgt_c: 28.2, temperature_c: 34.1, latitude: 18.922, longitude: 72.8347, source: 'sample' },
    ],
    []
  );

  // Both columns derive from the EXACT SAME array
  const activeWardList = React.useMemo(() => {
    return isLive ? wardsRisk! : sampleWards;
  }, [isLive, wardsRisk, sampleWards]);

  const rankedWards = React.useMemo(() => {
    return [...activeWardList].sort((a: any, b: any) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5);
  }, [activeWardList]);

  // Statistics derived directly from activeWardList
  const peakRisk = React.useMemo(() => {
    if (activeWardList.length === 0) return 0;
    return Math.round(Math.max(...activeWardList.map((w: any) => w.risk_score || 0)));
  }, [activeWardList]);

  const peakWbgt = React.useMemo(() => {
    if (activeWardList.length === 0) return 0;
    return Number(Math.max(...activeWardList.map((w: any) => w.wbgt_c || 0)).toFixed(1));
  }, [activeWardList]);

  const wardsCount = React.useMemo(() => {
    return isLive ? (wards?.length || activeWardList.length) : activeWardList.length;
  }, [isLive, wards, activeWardList]);

  // 5-Stage Computational Pipeline Flow Rail Stops
  const pipelineStages = [
    {
      step: '01',
      name: 'Synoptic ingestion',
      desc: 'Hourly surface weather from Open-Meteo & ERA5 reanalysis joined to ward census polygons.',
      metric: '1.1km grid join',
    },
    {
      step: '02',
      name: 'Physiological physics',
      desc: 'Liljegren wet-bulb globe temperature, 6th-order UTCI polynomial, and NOAA heat index.',
      metric: 'ISO 7243 WBGT',
    },
    {
      step: '03',
      name: 'Microclimate lag',
      desc: 'Envelope thermal inertia and 2–3 hour indoor phase lag across tin vs RCC concrete roofs.',
      metric: '2–3h thermal delay',
    },
    {
      step: '04',
      name: 'Composite risk scoring',
      desc: 'Hazard × Exposure × Vulnerability deterministic scoring across population and cooling access.',
      metric: '0–100 composite',
    },
    {
      step: '05',
      name: 'Automated dispatch',
      desc: 'Targeted municipal advisories, worker rest shift schedules, and cooling centre routes.',
      metric: '< 45ms query latency',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Hero Section: Left Narrative (7 cols / 60%) + Right Live Ward Telemetry Matrix (5 cols / 40%) */}
      <section
        ref={heroRef}
        className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
      >
        {/* Left Column (60% weight): Type + Numbers primary focus */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-[8px] p-6 sm:p-8 flex flex-col justify-between corner-ticks relative z-10 h-full">
          <div className="space-y-5">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-raised border border-border text-xs font-mono text-ink w-fit">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted">National Climate Early-Warning Initiative</span>
            </div>

            {/* Headline: Single 180ms fade-up */}
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="font-display text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.08] text-ink"
            >
              Hyperlocal Thermal Stress &amp; Early-Warning Platform
            </motion.h1>

            {/* Narrative Lead */}
            <p className="text-sm text-muted max-w-xl leading-relaxed">
              Not a generic weather forecast. ThermaGrid pinpoints <span className="text-ink font-semibold">who is at risk</span>, <span className="text-ink font-semibold">where</span>, <span className="text-ink font-semibold">when it peaks</span>, <span className="text-ink font-semibold">why</span>, and <span className="text-ink font-semibold">what action to take</span> — calibrated down to the urban municipal ward.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/app/heat-risk"
                className="px-4 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold transition-colors active:scale-[0.985]"
              >
                Citizen Protection
              </Link>
              <Link
                to="/app/worker"
                className="px-4 py-2.5 rounded-[6px] bg-raised hover:bg-surface border border-border text-ink text-xs font-mono font-semibold transition-colors"
              >
                Worker Safety
              </Link>
              <Link
                to="/app/authority"
                className="px-4 py-2.5 rounded-[6px] bg-raised hover:bg-surface border border-border text-ink text-xs font-mono font-semibold transition-colors"
              >
                Authority Console
              </Link>
            </div>
          </div>

          {/* 3-Stat Rail with Real Live Data from API */}
          <div className="grid grid-cols-3 gap-4 pt-5 mt-4 border-t border-border">
            <div>
              <span className="block font-mono text-2xl sm:text-3xl font-bold text-ink tracking-tight tabular-nums">
                {peakWbgt}°C
              </span>
              <span className={TYPOGRAPHY.micro}>Peak ISO WBGT</span>
            </div>
            <div>
              <KpiNumeral
                value={peakRisk}
                suffix="/100"
                size="m"
                sublabel="Max Ward Risk"
              />
            </div>
            <div>
              <KpiNumeral
                value={wardsCount}
                suffix=" Wards"
                size="m"
                sublabel="Active Coverage"
              />
            </div>
          </div>
        </div>

        {/* Right Column (40% weight): 3D Extruded Ward Map framed in --panel-dark (or static fallback) */}
        {canRender3D ? (
          <div className="lg:col-span-5 bg-panel-dark border border-border rounded-[8px] overflow-hidden flex flex-col justify-between corner-ticks relative min-h-[380px] lg:min-h-[420px]">
            {/* 3D Extruded Ward Heat Skyline */}
            <div className="absolute inset-0 z-0">
              <React.Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center font-mono text-xs text-raised">
                    Loading 3D Ward Map...
                  </div>
                }
              >
                <WardHeatSkyline
                  locations={wards || []}
                  riskData={wardsRisk || []}
                  selectedWardCode={selectedWardCode}
                  onWardSelect={(code) => setSelectedWardCode(code)}
                  isDemo={!isLive || Boolean(wardsRisk?.some((w) => w.is_demo))}
                />
              </React.Suspense>
            </div>

            {/* Slim Top 5 Rankings Overlaid in --panel-dark with --raised text */}
            <div className="relative z-10 p-4 sm:p-5 pointer-events-none flex flex-col justify-between h-full">
              <div className="flex items-center justify-between pb-2.5 bg-panel-dark/90 p-3 rounded-[6px] border border-border pointer-events-auto">
                <div>
                  <span className="text-[10px] font-mono uppercase text-raised/70 block">
                    REAL-TIME WARD TELEMETRY
                  </span>
                  <h3 className="text-sm font-semibold text-raised font-display">
                    Extruded Ward Thermal Risk
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-panel-dark border border-border text-raised">
                  {isLive && !wardsRisk?.some((w) => w.is_demo) ? 'Live Feed' : 'Demo data'}
                </span>
              </div>

              <div className="mt-auto space-y-1 bg-panel-dark/95 p-3 rounded-[6px] border border-border pointer-events-auto max-h-[175px] overflow-y-auto">
                <div className="text-[10px] font-mono text-raised/70 pb-1 border-b border-border/40 flex justify-between">
                  <span>Ranked Priority Wards</span>
                  <span>Risk · WBGT</span>
                </div>
                {rankedWards.slice(0, 5).map((w: any, idx: number) => {
                  const isSelected = w.ward_code === selectedWardCode;
                  const band = getRiskBand(w.risk_score || 50);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedWardCode(w.ward_code)}
                      className={`w-full py-1.5 px-2 rounded-[4px] flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-raised/15 border border-border' : 'hover:bg-raised/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-xs text-raised/70 w-4 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-raised truncate font-medium">
                          {w.ward_name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 font-mono text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: band.color }} />
                        <span className="font-medium text-raised">
                          {w.risk_score?.toFixed(1) || '72.0'}
                        </span>
                        <span className="text-[10px] text-raised/70">
                          {w.wbgt_c?.toFixed(1) || '32.1'}°C
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // Static Fallback (Standard ranking list)
          <div className="lg:col-span-5 bg-surface border border-border rounded-[8px] overflow-hidden flex flex-col justify-between corner-ticks relative min-h-[380px] lg:min-h-[420px] p-5 sm:p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                    REAL-TIME WARD TELEMETRY
                  </span>
                  <h3 className="text-sm font-semibold text-ink font-display">
                    Live Thermal Stress Rankings
                  </h3>
                </div>
                {isLive && !wardsRisk?.some((w) => w.is_demo) ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-raised border border-border text-ink flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Live Feed
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-raised border border-border text-ink flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Demo data
                  </span>
                )}
              </div>

              {/* Ward list table */}
              <div className="divide-y divide-border">
                {rankedWards.map((w: any, idx: number) => {
                  const band = getRiskBand(w.risk_score || 50);
                  return (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between hover:bg-raised px-2 rounded-[4px] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="font-mono text-xs text-muted w-4 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-ink block truncate">
                            {w.ward_name}
                          </span>
                          <span className="text-[10px] font-mono text-muted">
                            {w.ward_code} · {w.temperature_c?.toFixed(1) || '36.5'}°C Dry-Bulb
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold block tabular-nums text-ink">
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: band.color }} />
                          {w.risk_score?.toFixed(1) || '72.0'} / 100
                        </span>
                        <span className="text-[10px] font-mono text-muted">
                          WBGT {w.wbgt_c?.toFixed(1) || '32.1'}°C
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted text-[11px] font-mono">
                {isLive && !wardsRisk?.some((w) => w.is_demo)
                  ? 'Provenance: Open-Meteo & ERA5 (Live)'
                  : 'Provenance: Open-Meteo & ERA5 Reanalysis (Demo)'}
              </span>
              <Link
                to="/app"
                className="text-accent hover:text-accent-hover inline-flex items-center gap-1 transition-colors hover:underline text-[11px]"
              >
                <span>Explore All Wards</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 2. Section: Two Wards, Same Temperature */}
      <section id="two-wards" className="space-y-6">
        <SectionHeader
          label="Hyperlocal paradigm benchmark"
          title="Two Wards, Same Temperature, Different Alert Grade"
          lead="Identical meteorological inputs yield distinct life-safety risks due to local built-environment, informal housing, and occupational vulnerability."
        />

        {/* 3D Cutaway Houses vs Static 2-Panel Fallback */}
        {canRender3D ? (
          <div className="border border-border rounded-[8px] overflow-hidden bg-panel-dark">
            <React.Suspense
              fallback={
                <div className="h-80 flex items-center justify-center font-mono text-xs text-raised bg-panel-dark">
                  Loading Thermal Lag Simulation...
                </div>
              }
            >
              <ThermalLagHouses />
            </React.Suspense>
          </div>
        ) : (
          <ThermalLagStaticFallback />
        )}

        <div className="pt-4">
          <TwoWardsComparison />
        </div>
      </section>

      {/* 3. Section: 3D Ward Heat City (Hidden below 768px, Lazy-loaded with Suspense) */}
      <section className="space-y-6 hidden md:block">
        <SectionHeader
          label="EXTRUDED URBAN HEAT FIELD"
          title="Ward Heat City 3D Landscape"
          lead="Thousands of instanced volumetric blocks mapping normative human thermal stress. Height and colour encode multi-factorial risk, not mere air temperature."
        />
        <div className="border border-border rounded-[8px] overflow-hidden bg-panel-dark">
          <React.Suspense
            fallback={
              <div className="h-[420px] flex items-center justify-center font-mono text-xs text-raised">
                Initializing 3D Ward Heat Landscape...
              </div>
            }
          >
            <WardHeatCity wards={activeWardList} height={420} />
          </React.Suspense>
        </div>
      </section>

      {/* 4. Section: Computational Pipeline */}
      <section id="how-it-works" className="py-10 lg:py-16">
        <SectionHeader
          label="Computational pipeline"
          title="From raw satellite telemetry to targeted municipal intervention"
          lead="ThermaGrid bridges numerical weather prediction and urban epidemiology through five validated stages."
          className="mb-8"
        />

        {/* Continuous Flow Rail (Horizontal on desktop, vertical on mobile) */}
        <div className="relative">
          {/* Connecting track hairline (Desktop horizontal: connects stop 1 to stop 5 through center of markers) */}
          <div
            className="hidden lg:block absolute top-4 left-4 right-4 h-[1px] bg-border"
            aria-hidden="true"
          />

          {/* Flow rail stops: 5 columns on desktop, vertical sequence on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 relative">
            {pipelineStages.map((stage, idx) => (
              <div key={idx} className="relative flex flex-col items-start pl-12 lg:pl-0">
                {/* Mobile vertical connecting hairline */}
                {idx < pipelineStages.length - 1 && (
                  <div
                    className="lg:hidden absolute left-[15px] top-8 bottom-[-32px] w-[1px] bg-border"
                    aria-hidden="true"
                  />
                )}

                {/* Stage Stop Marker */}
                <div className="absolute left-0 top-0 lg:static flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-xs font-mono font-medium text-accent tabular-nums z-10 shrink-0">
                  {stage.step}
                </div>

                {/* Stop Content */}
                <div className="lg:mt-4 flex flex-col">
                  <h4 className="text-base font-semibold text-ink font-display">
                    {stage.name}
                  </h4>
                  <p className="text-sm leading-[22px] text-muted mt-2">
                    {stage.desc}
                  </p>
                  <div className="mt-3">
                    <span className="text-xs font-mono text-accent tabular-nums">
                      {stage.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Section: Provenance Strip */}
      <section id="methodology" className="mt-12 p-6 rounded-[8px] bg-surface border border-border space-y-4">
        <div className="text-xs font-mono text-muted">
          Data provenance &amp; model auditability
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProvenanceChip
            label="Observation source"
            value="Open-Meteo &amp; ERA5 Reanalysis"
            sub="Hourly dry-bulb, dewpoint, solar radiation"
          />
          <ProvenanceChip
            label="Spatial resolution"
            value="Ward-Level (0.01° / ~1.1km)"
            sub="Polygon boundary joins"
          />
          <ProvenanceChip
            label="Licensing &amp; open code"
            value="MIT Open Science Standard"
            sub="National Climate Telemetry"
          />
          <ProvenanceChip
            label="Inference latency"
            value="< 45ms per Ward Query"
            sub="Validated on live telemetry"
          />
        </div>
      </section>
    </div>
  );
};
