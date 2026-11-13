import React, { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Container } from '../components/common/Container';
import { DataStatusBadge } from '../components/common/DataStatusBadge';
import { TwoWardsComparison } from '../components/dashboard/TwoWardsComparison';
import { SectionHeader } from '../components/ui/SectionHeader';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { TYPOGRAPHY } from '../theme/typography';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useRole } from '../hooks/useRole';
import { useCanRender3D } from '../components/landing3d/useCanRender3D';
import { ThermalLagStaticFallback } from '../components/landing3d/ThermalLagStaticFallback';
import { StaticWardMapFallback } from '../components/landing3d/StaticWardMapFallback';
import { getRiskHex } from '../components/landing3d/palette';

// Lazy-load 3D scenes
const WardHeatSkyline = React.lazy(() =>
  import('../components/landing3d/WardHeatSkyline').then((m) => ({ default: m.WardHeatSkyline }))
);

const ThermalLagHouses = React.lazy(() =>
  import('../components/landing3d/ThermalLagHouses').then((m) => ({ default: m.ThermalLagHouses }))
);

const WardHeatCity = React.lazy(() =>
  import('../three/scenes/WardHeatCity').then((m) => ({ default: m.WardHeatCity }))
);

interface DisplayWardItem {
  ward_name: string;
  ward_code: string;
  risk_score: number;
  wbgt_c: number;
  temperature_c: number;
  latitude: number;
  longitude: number;
  source?: string;
  is_demo?: boolean;
}

export const Landing: React.FC = () => {
  const { isSignedIn, isLoaded, role } = useRole();
  const heroRef = useRef<HTMLDivElement>(null);
  const canRender3D = useCanRender3D();
  const [selectedWardCode, setSelectedWardCode] = React.useState<string | null>(null);

  // Fetch real observed ward risk and demographic metadata from backend
  const { data: wardsRisk } = useAllWardsRisk();
  const { data: wards } = useWards();

  const isLive = Boolean(wardsRisk && wardsRisk.length > 0);

  // Sample state - explicitly gated behind source: 'sample'
  const sampleWards: DisplayWardItem[] = React.useMemo(
    () => [
      { ward_name: 'Ward M/East (Govandi)', ward_code: 'WARD_ME', risk_score: 84.2, wbgt_c: 34.6, temperature_c: 38.2, latitude: 19.0558, longitude: 72.9315, source: 'sample' },
      { ward_name: 'Ward G/North (Dharavi)', ward_code: 'WARD_GN', risk_score: 79.5, wbgt_c: 33.8, temperature_c: 37.9, latitude: 19.041, longitude: 72.855, source: 'sample' },
      { ward_name: 'Ward L (Kurla East)', ward_code: 'WARD_L', risk_score: 73.1, wbgt_c: 33.1, temperature_c: 37.4, latitude: 19.068, longitude: 72.885, source: 'sample' },
      { ward_name: 'Ward H/East (Bandra E)', ward_code: 'WARD_HE', risk_score: 68.4, wbgt_c: 32.5, temperature_c: 36.8, latitude: 19.058, longitude: 72.848, source: 'sample' },
      { ward_name: 'Ward A (Colaba / Fort)', ward_code: 'WARD_A', risk_score: 38.6, wbgt_c: 28.2, temperature_c: 34.1, latitude: 18.922, longitude: 72.8347, source: 'sample' },
    ],
    []
  );

  const activeWardList = React.useMemo(() => {
    return isLive ? (wardsRisk as unknown as DisplayWardItem[]) : sampleWards;
  }, [isLive, wardsRisk, sampleWards]);

  const rankedWards = React.useMemo(() => {
    return [...activeWardList].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5);
  }, [activeWardList]);

  const peakRisk = React.useMemo(() => {
    if (activeWardList.length === 0) return 0;
    return Math.round(Math.max(...activeWardList.map((w) => w.risk_score || 0)));
  }, [activeWardList]);

  const peakWbgt = React.useMemo(() => {
    if (activeWardList.length === 0) return 0;
    return Number(Math.max(...activeWardList.map((w) => w.wbgt_c || 0)).toFixed(1));
  }, [activeWardList]);

  const wardsCount = React.useMemo(() => {
    return isLive ? (wards?.length || activeWardList.length) : (wards?.length || activeWardList.length || 24);
  }, [isLive, wards, activeWardList]);

  // If user is already authenticated, route based on role
  if (isLoaded && isSignedIn) {
    if (role === 'authority' || role === 'admin') {
      return <Navigate to="/app/authority" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  // 5-Stage Computational Pipeline Stops
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
      desc: 'Weighted hazard, exposure and vulnerability, minus adaptive capacity',
      metric: '0–100 composite',
    },
    {
      step: '05',
      name: 'Automated dispatch',
      desc: 'Targeted municipal advisories, worker rest shift schedules, and cooling centre routes.',
      metric: '5 languages · email + WhatsApp',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Section: Left Narrative (60%) + Right Live Ward Telemetry Matrix (40%) */}
      <section className="py-12 sm:py-16 lg:py-20">
        <Container id="hero-container">
          <div
            ref={heroRef}
            id="hero-grid"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
          >
            {/* Left Column (60% weight): Type + Numbers primary focus */}
            <div
              id="hero-left-card"
              className="lg:col-span-7 bg-surface border border-border rounded-[8px] p-6 sm:p-8 flex flex-col justify-between corner-ticks relative z-10 h-full"
            >
              <div className="space-y-5">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-raised border border-border text-xs font-mono text-ink w-fit">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-muted">National Climate Early-Warning Initiative</span>
                </div>

                {/* Headline */}
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
              <div className="grid grid-cols-3 gap-4 pt-5 mt-6 border-t border-border">
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

            {/* Right Column (40% weight): Vertical Stack on --panel-dark */}
            <div
              id="hero-right-card"
              className="lg:col-span-5 bg-panel-dark border border-border rounded-[8px] p-5 flex flex-col justify-between corner-ticks relative z-10 h-full"
            >
              {/* Header row: Title left, exactly ONE DataStatusBadge right, same baseline */}
              <div className="flex items-baseline justify-between gap-3 w-full pb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-raised/70 block">
                    REAL-TIME WARD SENSORS
                  </span>
                  <h3 className="text-sm font-semibold text-raised font-display">
                    Extruded Ward Thermal Risk
                  </h3>
                </div>
                <DataStatusBadge
                  isDemo={!isLive || Boolean(wardsRisk?.some((w) => w.is_demo))}
                  variant="dark"
                />
              </div>

              {/* 3D Canvas Container: clamp(260px, 32vw, 360px), full inner width, 1px hairline border */}
              <div
                id="hero-canvas-container"
                className="w-full h-[clamp(260px,32vw,360px)] border border-border/60 rounded-[6px] overflow-hidden relative my-2 bg-panel-dark"
              >
                {canRender3D ? (
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
                ) : (
                  <StaticWardMapFallback wards={rankedWards} />
                )}
              </div>

              {/* Ranked Priority List: Sits BELOW canvas with ZERO overlap */}
              <div id="hero-ranked-list" className="space-y-1.5 pt-2">
                <div className="text-[10px] font-mono text-raised/70 pb-1 border-b border-border/40 flex justify-between">
                  <span>Ranked Priority Wards</span>
                  <span>Risk · WBGT</span>
                </div>
                {rankedWards.slice(0, 5).map((w: any, idx: number) => {
                  const isSelected = w.ward_code === selectedWardCode;
                  const riskHex = getRiskHex(w.risk_score || 50);

                  return (
                    <div
                      key={w.ward_code || idx}
                      onClick={() => setSelectedWardCode(w.ward_code)}
                      className={`flex items-center justify-between p-2 rounded-[6px] transition-colors cursor-pointer border text-xs font-mono select-none ${
                        isSelected
                          ? 'bg-raised/15 border-accent text-raised'
                          : 'hover:bg-raised/10 border-transparent text-raised/90'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: riskHex }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{w.ward_name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 pl-2">
                        <span className="font-semibold tabular-nums text-raised">
                          {Math.round(w.risk_score || 50)}
                        </span>
                        <span className="text-raised/60 tabular-nums">
                          {Number(w.wbgt_c || 30).toFixed(1)}°C
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Section: 3D Thermal Inertia House Archetypes */}
      <section id="two-wards" className="py-12 sm:py-16">
        <Container>
          <div className="space-y-6">
            <SectionHeader
              label="BUILT-ENVIRONMENT THERMAL INERTIA"
              title="Informal Tin-Roof vs Engineered RCC Concrete"
              lead="Interactive diurnal temperature progression demonstrating heat retention, envelope insulation disparity, and the critical late-afternoon indoor phase lag."
            />
            {canRender3D ? (
              <div className="border border-border rounded-[8px] overflow-hidden bg-panel-dark">
                <React.Suspense
                  fallback={
                    <div className="h-[460px] flex items-center justify-center font-mono text-xs text-raised">
                      Initializing Thermal Inertia Models...
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
          </div>
        </Container>
      </section>

      {/* 3. Section: 3D Ward Heat City Landscape (Desktop) */}
      <section className="py-12 sm:py-16 hidden md:block">
        <Container>
          <div className="space-y-6">
            <SectionHeader
              label="EXTRUDED URBAN HEAT FIELD"
              title="Ward Heat City 3D Landscape"
              lead="Volumetric blocks mapping normative human thermal stress. Height and colour encode multi-factorial risk, not mere air temperature."
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
          </div>
        </Container>
      </section>

      {/* 4. Section: Computational Pipeline & Provenance */}
      <section id="how-it-works" className="py-16 lg:py-24">
        <Container id="pipeline-container">
          <SectionHeader
            label="Computational pipeline"
            title="From raw satellite telemetry to targeted municipal intervention"
            lead="ThermaGrid bridges numerical weather prediction and urban epidemiology through five stages."
            className="mb-10"
          />

          {/* 5-Stage Flow Rail */}
          <div id="pipeline-grid" className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 relative">
              {pipelineStages.map((stage, idx) => (
                <div key={idx} className="relative flex flex-col items-start pl-12 lg:pl-0 h-full">
                  {/* Mobile vertical connecting hairline (consecutive circles only, inset 8px) */}
                  {idx < pipelineStages.length - 1 && (
                    <div
                      className="lg:hidden absolute left-[15px] top-10 bottom-[-24px] w-[1px] bg-border"
                      aria-hidden="true"
                    />
                  )}

                  {/* Desktop horizontal connector segment to next circle (between consecutive circles only, inset 8px) */}
                  {/* Circle 05 (the last step) has NO connector past it! */}
                  {idx < pipelineStages.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-4 left-10 right-[-16px] h-[1px] bg-border"
                      style={{ left: '40px', right: '-16px' }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Stage Stop Marker */}
                  <div className="absolute left-0 top-0 lg:static flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-xs font-mono font-medium text-ink tabular-nums z-10 shrink-0">
                    {stage.step}
                  </div>

                  {/* Stop Content with Tag pinned to bottom */}
                  <div className="lg:mt-4 flex flex-col flex-1 w-full justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-ink font-display">
                        {stage.name}
                      </h4>
                      <p className="text-sm leading-[22px] text-muted mt-2">
                        {stage.desc}
                      </p>
                    </div>

                    {/* Step Tag: mono 12px in --muted, pinned to bottom with mt-auto so all share one baseline */}
                    <div className="mt-auto pt-4">
                      <span className="text-xs font-mono text-muted tabular-nums">
                        {stage.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Provenance Strip: exactly 64px gap below step row (mt-16) */}
          <div
            id="provenance-strip"
            className="mt-16 p-6 rounded-[8px] bg-surface border border-border space-y-4"
          >
            <div className="text-xs font-mono text-muted uppercase tracking-wider">
              Data provenance &amp; model auditability
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="p-4 rounded-[6px] bg-raised border border-border flex flex-col justify-between h-full">
                <span className="text-xs text-muted block pb-1">Observation source</span>
                <span className="font-mono text-sm sm:text-base font-semibold text-ink block leading-snug">
                  Open-Meteo &amp; ERA5
                </span>
                <span className="text-xs text-muted block pt-1">
                  Hourly dry-bulb, dewpoint, wind
                </span>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-[6px] bg-raised border border-border flex flex-col justify-between h-full">
                <span className="text-xs text-muted block pb-1">Spatial resolution</span>
                <span className="font-mono text-sm sm:text-base font-semibold text-ink block leading-snug">
                  Ward-Level (~1.1km)
                </span>
                <span className="text-xs text-muted block pt-1">
                  Polygon boundary joins
                </span>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-[6px] bg-raised border border-border flex flex-col justify-between h-full">
                <span className="text-xs text-muted block pb-1">Licensing &amp; code</span>
                <span className="font-mono text-sm sm:text-base font-semibold text-ink block leading-snug">
                  MIT License
                </span>
                <span className="text-xs text-muted block pt-1">
                  Open source
                </span>
              </div>

              {/* Card 4 */}
              <div className="p-4 rounded-[6px] bg-raised border border-border flex flex-col justify-between h-full">
                <span className="text-xs text-muted block pb-1">Telemetry cadence</span>
                <span className="font-mono text-sm sm:text-base font-semibold text-ink block leading-snug">
                  Hourly refresh
                </span>
                <span className="text-xs text-muted block pt-1">
                  Scheduled ingestion
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
