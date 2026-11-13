import React, { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Container } from '../components/common/Container';
import { TwoWardsComparison } from '../components/dashboard/TwoWardsComparison';
import { SectionHeader } from '../components/ui/SectionHeader';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { TYPOGRAPHY } from '../theme/typography';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useRole } from '../hooks/useRole';
import { useCanRender3D } from '../components/landing3d/useCanRender3D';
import { ThermalLagStaticFallback } from '../components/landing3d/ThermalLagStaticFallback';
import { IndiaChoropleth } from '../components/maps/IndiaChoropleth';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingFaq } from '../components/landing/LandingFaq';
import { ThermalPhaseLagChart } from '../components/landing/ThermalPhaseLagChart';
import { formatNumber, roundNumber } from '../utils/format';
import { getRiskHex } from '../components/landing3d/palette';

// Lazy-load 3D scenes
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
  population?: number;
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

  // Fallback sample wards when API is initializing
  const sampleWards: DisplayWardItem[] = React.useMemo(
    () => [
      { ward_name: 'Ward M/East (Govandi)', ward_code: 'WARD_ME', risk_score: 84.2, wbgt_c: 34.6, temperature_c: 38.2, latitude: 19.0558, longitude: 72.9315, population: 807720, source: 'sample' },
      { ward_name: 'Ward G/North (Dharavi)', ward_code: 'WARD_GN', risk_score: 79.5, wbgt_c: 33.8, temperature_c: 37.9, latitude: 19.041, longitude: 72.855, population: 599039, source: 'sample' },
      { ward_name: 'Ward L (Kurla East)', ward_code: 'WARD_L', risk_score: 73.1, wbgt_c: 33.1, temperature_c: 37.4, latitude: 19.068, longitude: 72.885, population: 902227, source: 'sample' },
      { ward_name: 'Ward H/East (Bandra E)', ward_code: 'WARD_HE', risk_score: 68.4, wbgt_c: 32.5, temperature_c: 36.8, latitude: 19.058, longitude: 72.848, population: 557239, source: 'sample' },
      { ward_name: 'Ward A (Colaba / Fort)', ward_code: 'WARD_A', risk_score: 38.6, wbgt_c: 28.2, temperature_c: 34.1, latitude: 18.922, longitude: 72.8347, population: 185014, source: 'sample' },
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
    return roundNumber(Math.max(...activeWardList.map((w) => w.wbgt_c || 0)), 1);
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

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Section: Left Narrative (60%) + Right India Choropleth (40%) */}
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
                  <span className={TYPOGRAPHY.micro}>Peak Heat Stress</span>
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

            {/* Right Column: India Choropleth (40% weight) */}
            <div
              id="hero-right-card"
              className="lg:col-span-5 flex flex-col justify-between h-full min-h-[480px] sm:min-h-[540px]"
            >
              <IndiaChoropleth />
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Section: How it works (3 steps, plain language) */}
      <section id="how-it-works-section" className="py-12 sm:py-16">
        <Container>
          <div className="space-y-8">
            <SectionHeader
              label="How it works"
              title="From Weather Satellites to Street-Level Protection"
              lead="We read real-time weather data → calculate how heat actually affects human bodies → deliver direct safety actions to workers, citizens, and city officials."
              className="mb-6"
            />
            <HowItWorks />
          </div>
        </Container>
      </section>

      {/* 3. Section: Thermal Inertia & Housing Comparison */}
      <section id="two-wards" className="py-8 sm:py-12">
        <Container>
          <div className="space-y-6">
            <SectionHeader
              label="HOW HOMES ABSORB AND TRAP HEAT"
              title="Informal Tin-Roof vs Engineered Concrete (RCC)"
              lead="Watch how heat moves through a tin roof compared to a concrete roof across a 24-hour heatwave. Thin tin roofs turn into ovens by early afternoon, while concrete roofs trap heat and keep rooms uncomfortably warm all night long."
            />

            {canRender3D ? (
              <React.Suspense fallback={<ThermalLagStaticFallback />}>
                <ThermalLagHouses />
              </React.Suspense>
            ) : (
              <ThermalLagStaticFallback />
            )}

            <div className="pt-2">
              <ThermalPhaseLagChart />
            </div>

            <div className="pt-2">
              <TwoWardsComparison />
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Section: 3D Ward Heat City Landscape */}
      <section id="ward-heat-city" className="py-12 sm:py-16">
        <Container>
          <div className="space-y-6">
            <SectionHeader
              label="URBAN HEAT MAP"
              title="3D City Heat Landscape"
              lead="3D blocks showing neighborhood heat danger. Block height and color reveal real human risk, combining weather, population, and housing type."
            />
            <React.Suspense
              fallback={
                <div className="h-[480px] flex items-center justify-center font-mono text-xs text-raised bg-panel-dark rounded-[8px]">
                  Initializing 3D Ward Heat Landscape...
                </div>
              }
            >
              <WardHeatCity
                wards={activeWardList}
                height={480}
                onWardSelect={(code) => setSelectedWardCode(String(code))}
              />
            </React.Suspense>

            {/* Priority Wards Telemetry Connected to 3D City */}
            <div id="ward-city-list" className="p-4 rounded-[8px] bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                  Priority Wards Telemetry
                </span>
                <span className="text-xs font-mono text-muted">
                  Click a block above or card below to inspect
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {rankedWards.map((w: any, idx: number) => {
                  const isSelected = w.ward_code === selectedWardCode || w.id === selectedWardCode;
                  const riskHex = getRiskHex(w.risk_score || 50);
                  return (
                    <div
                      key={w.ward_code || idx}
                      onClick={() => setSelectedWardCode(w.ward_code || w.id)}
                      className={`p-3 rounded-[6px] border text-xs font-mono transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-raised border-accent shadow-sm'
                          : 'bg-raised/60 hover:bg-raised border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: riskHex }} />
                        <span className="font-bold text-ink truncate">{w.ward_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted text-[11px] pt-1 border-t border-border/40">
                        <span>Risk: <strong className="text-ink">{Math.round(w.risk_score || 50)}</strong></span>
                        <span>{formatNumber(w.wbgt_c || 30, 1)}°C WBGT</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Section: Frequently Asked Questions (Accordion) */}
      <section id="faq-section" className="py-12 sm:py-16">
        <Container>
          <div className="space-y-6">
            <SectionHeader
              label="Frequently Asked Questions"
              title="Methodology, Update Times &amp; Data Sources"
              lead="Key answers about ThermaGrid's heat tracking, sensor accuracy, and safety warnings."
              className="text-center mx-auto"
            />
            <LandingFaq />
          </div>
        </Container>
      </section>
    </div>
  );
};
