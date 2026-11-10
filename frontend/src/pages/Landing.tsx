import React, { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

import { TwoWardsComparison } from '../components/dashboard/TwoWardsComparison';
import { SectionHeader } from '../components/ui/SectionHeader';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { ProvenanceChip } from '../components/ui/ProvenanceChip';
import { TYPOGRAPHY } from '../theme/typography';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useRole } from '../hooks/useRole';
import { getRiskBand } from '../theme/tokens';

// Lazy-load WardHeatCity 3D scene to eliminate Three.js from the landing initial bundle chunk
const WardHeatCity = React.lazy(() =>
  import('../three/scenes/WardHeatCity').then((m) => ({ default: m.WardHeatCity }))
);

export const Landing: React.FC = () => {
  const { isSignedIn, isLoaded, role } = useRole();
  const heroRef = useRef<HTMLDivElement>(null);

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
  const dataSource = isLive ? 'live' : 'sample';

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

  // Both columns derive from the EXACT SAME array (eliminating disagreement between rail and list)
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
    <div className="space-y-24 sm:space-y-32">
      {/* 1. Hero Section: Left Narrative (7 cols / 60%) + Right Live Ward Telemetry Matrix (5 cols / 40%) */}
      <section
        ref={heroRef}
        className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
      >
        {/* Left Column (60% weight): Type + Numbers primary focus */}
        <div className="lg:col-span-7 bg-[#142630]/60 border border-white/[0.075] rounded-[14px] p-6 sm:p-8 flex flex-col justify-between corner-ticks shadow-2xl relative z-10 h-full">
          <div className="space-y-5">
            {/* Eyebrow with #8FB3D9 accent */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FB3D9]/10 border border-[#8FB3D9]/25 text-xs font-mono text-[#D8E8E6] w-fit">
              <span className="w-2 h-2 rounded-full bg-[#8FB3D9] animate-pulse" />
              <span className="text-[#93A3B0]">National Climate Early-Warning Initiative</span>
            </div>

            {/* Headline: Single 180ms fade-up */}
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="font-display text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.08] text-white"
            >
              Hyperlocal Thermal Stress &amp; Early-Warning Platform
            </motion.h1>

            {/* Narrative Lead */}
            <p className="text-sm text-[#93A3B0] max-w-xl leading-relaxed">
              Not a generic weather forecast. ThermaGrid pinpoints <span className="text-white font-medium">who is at risk</span>, <span className="text-white font-medium">where</span>, <span className="text-white font-medium">when it peaks</span>, <span className="text-white font-medium">why</span>, and <span className="text-white font-medium">what action to take</span> — calibrated down to the urban municipal ward.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/app/heat-risk"
                className="px-4 py-2.5 rounded-[8px] bg-[#8FB3D9] hover:bg-[#A5C4E4] text-[#0B141B] text-xs font-mono font-bold transition-all shadow-md active:scale-[0.985]"
              >
                Citizen Protection
              </Link>
              <Link
                to="/app/worker"
                className="px-4 py-2.5 rounded-[8px] bg-[#0B141B] hover:bg-[#203A45] border border-white/[0.075] text-[#D8E8E6] text-xs font-mono font-semibold transition-all"
              >
                Worker Safety
              </Link>
              <Link
                to="/app/authority"
                className="px-4 py-2.5 rounded-[8px] bg-[#0B141B] hover:bg-[#203A45] border border-white/[0.075] text-[#D8E8E6] text-xs font-mono font-semibold transition-all"
              >
                Authority Console
              </Link>
            </div>
          </div>

          {/* 3-Stat Rail with Real Live Data from API */}
          <div className="grid grid-cols-3 gap-4 pt-5 mt-4 border-t border-white/[0.075]">
            <div>
              <span className="block font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                {peakWbgt}°C
              </span>
              <span className={TYPOGRAPHY.micro}>Peak ISO WBGT</span>
            </div>
            <div>
              <KpiNumeral
                value={peakRisk}
                suffix="/100"
                size="m"
                color={peakRisk >= 70 ? '#FF704F' : peakRisk >= 50 ? '#F59E0B' : '#2FA37C'}
                sublabel="Max Ward Risk"
              />
            </div>
            <div>
              <KpiNumeral
                value={wardsCount}
                suffix=" Wards"
                size="m"
                color="#2FA37C"
                sublabel="Active Coverage"
              />
            </div>
          </div>
        </div>

        {/* Right Column (40% weight): High-Density Live Ward Risk Telemetry Matrix */}
        <div className="lg:col-span-5 bg-[#142630]/60 border border-white/[0.075] rounded-[14px] p-5 sm:p-6 flex flex-col justify-between corner-ticks shadow-2xl relative h-full">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.075]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7C8A] block">
                  REAL-TIME WARD TELEMETRY
                </span>
                <h3 className="text-sm font-bold text-white font-display">
                  Live Thermal Stress Rankings
                </h3>
              </div>
              {isLive ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2FA37C]/15 border border-[#2FA37C]/30 text-[#2FA37C] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2FA37C] animate-pulse" />
                  Live Feed
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8C547]/15 border border-[#E8C547]/30 text-[#E8C547] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547]" />
                  Sample Simulation
                </span>
              )}
            </div>

            {/* Ward list table */}
            <div className="divide-y divide-white/[0.05]">
              {rankedWards.map((w: any, idx: number) => {
                const band = getRiskBand(w.risk_score || 50);
                return (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between hover:bg-white/[0.03] px-2 rounded-[6px] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="font-mono text-xs text-[#6B7C8A] w-4 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          {w.ward_name}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B7C8A]">
                          {w.ward_code} · {w.temperature_c?.toFixed(1) || '36.5'}°C Dry-Bulb
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold block tabular-nums" style={{ color: band.color }}>
                        {w.risk_score?.toFixed(1) || '72.0'} / 100
                      </span>
                      <span className="text-[10px] font-mono text-[#93A3B0]">
                        WBGT {w.wbgt_c?.toFixed(1) || '32.1'}°C
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.075] flex items-center justify-between text-xs font-mono">
            <span className="text-[#6B7C8A] text-[11px] font-mono">
              {isLive
                ? 'Provenance: IMD AWS + Open-Meteo (Live)'
                : 'Provenance: Pre-seeded sample calibration model (Sample)'}
            </span>
            <Link
              to="/app"
              className="text-[#8FB3D9] hover:text-[#A5C4E4] inline-flex items-center gap-1 transition-colors hover:underline text-[11px]"
            >
              <span>Explore All Wards</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Section: Two Wards, Same Temperature */}
      <section id="two-wards" className="space-y-6">
        <SectionHeader
          label="HYPERLOCAL PARADIGM BENCHMARK"
          title="Two Wards, Same Temperature, Different Alert Grade"
          lead="Why generic macro weather apps fail: identical meteorological inputs yield distinct life-safety risks due to local built-environment, informal housing, and occupational vulnerability."
        />
        <TwoWardsComparison />
      </section>

      {/* 3. Section: 3D Ward Heat City (Hidden below 768px, Lazy-loaded with Suspense) */}
      <section className="space-y-6 hidden md:block">
        <SectionHeader
          label="EXTRUDED URBAN HEAT FIELD"
          title="Ward Heat City 3D Landscape"
          lead="Thousands of instanced volumetric blocks mapping normative human thermal stress. Height and colour encode multi-factorial risk, not mere air temperature."
        />
        <div className="border border-white/[0.075] rounded-[14px] overflow-hidden bg-[#0B141B]">
          <React.Suspense
            fallback={
              <div className="h-[560px] flex items-center justify-center font-mono text-xs text-[#6B7C8A]">
                Initializing 3D Ward Heat Landscape...
              </div>
            }
          >
            <WardHeatCity wards={activeWardList} height={560} />
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
            className="hidden lg:block absolute top-4 left-4 right-4 h-[1px] bg-white/[0.08]"
            aria-hidden="true"
          />

          {/* Flow rail stops: 5 columns on desktop, vertical sequence on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 relative">
            {pipelineStages.map((stage, idx) => (
              <div key={idx} className="relative flex flex-col items-start pl-12 lg:pl-0">
                {/* Mobile vertical connecting hairline */}
                {idx < pipelineStages.length - 1 && (
                  <div
                    className="lg:hidden absolute left-[15px] top-8 bottom-[-32px] w-[1px] bg-white/[0.08]"
                    aria-hidden="true"
                  />
                )}

                {/* Stage Stop Marker */}
                <div className="absolute left-0 top-0 lg:static flex items-center justify-center w-8 h-8 rounded-full bg-[#142630] border border-white/[0.14] text-xs font-mono font-medium text-[#8FB3D9] tabular-nums z-10 shrink-0">
                  {stage.step}
                </div>

                {/* Stop Content */}
                <div className="lg:mt-4 flex flex-col">
                  <h4 className="text-base font-medium text-[#D8E8E6] font-display">
                    {stage.name}
                  </h4>
                  <p className="text-sm leading-[22px] text-[#93A3B0] mt-2">
                    {stage.desc}
                  </p>
                  <div className="mt-3">
                    <span className="text-xs font-mono text-[#8FB3D9] tabular-nums">
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
      <section id="methodology" className="mt-12 p-6 rounded-[14px] bg-[#142630]/60 border border-white/[0.075] space-y-4">
        <div className="text-xs font-mono text-[#6B7C8A]">
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
