import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldAlert,
  HardHat,
  ChevronDown,
  Database,
  ThermometerSun,
  Activity,
  AlertTriangle,
  Zap,
} from 'lucide-react';

import { RiskGlobe } from '../three/scenes/RiskGlobe';
import { WardHeatCity } from '../three/scenes/WardHeatCity';
import { TwoWardsComparison } from '../components/dashboard/TwoWardsComparison';
import { SectionHeader } from '../components/ui/SectionHeader';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SpotlightCursor } from '../components/ui/SpotlightCursor';
import { ProvenanceChip } from '../components/ui/ProvenanceChip';
import { TYPOGRAPHY } from '../theme/typography';
import { wordContainer, wordItem } from '../theme/motion';

const HERO_WORDS = ['Hyperlocal', 'Thermal', 'Stress', '&', 'Early-Warning', 'Platform'];

export const Landing: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  const workflowSteps = [
    {
      num: '01',
      title: 'Data Ingestion',
      icon: Database,
      desc: 'IMD synoptic AWS, ERA5 reanalysis, and municipal census telemetry streamed hourly.',
    },
    {
      num: '02',
      title: 'Thermal Indices',
      icon: ThermometerSun,
      desc: 'Physics-based Liljegren WBGT, 6th-order UTCI polynomial, and Rothfusz Heat Index.',
    },
    {
      num: '03',
      title: 'ML Forecasting',
      icon: Activity,
      desc: 'XGBoost gradient boosting with 72-hour lag features and recursive uncertainty cones.',
    },
    {
      num: '04',
      title: 'Risk Modeling',
      icon: AlertTriangle,
      desc: 'Iso-thermal exposure intersecting tin roofs, tree canopy deficits, and outdoor labour.',
    },
    {
      num: '05',
      title: 'Action Trigger',
      icon: Zap,
      desc: 'Automated municipal cooling shelters, hydration alerts, and worker safety protocols.',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* 1. Hero Section (7/5 split, full-bleed 3D RiskGlobe, scrim, spotlight cursor) */}
      <section
        ref={heroRef}
        className="relative min-h-[640px] lg:min-h-[720px] rounded-[14px] overflow-hidden border border-white/8 bg-[#101820] flex items-center corner-ticks"
      >
        <SpotlightCursor containerRef={heroRef} />

        {/* 3D RiskGlobe Canvas (Right-Weighted) */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-3/5 h-full z-0 opacity-80 lg:opacity-100">
          <RiskGlobe height="100%" />
        </div>

        {/* Scrim Overlay: keeps text on the left pristine and legible */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(90deg, #101820 0%, #101820 42%, rgba(16, 24, 32, 0.88) 58%, transparent 80%)',
          }}
        />

        {/* Hero Left Content (7-col rail) */}
        <div className="relative z-20 max-w-2xl p-6 sm:p-10 lg:p-14 space-y-8">
          {/* Eyebrow: mono, amethyst dot */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3445]/80 border border-white/10 text-xs font-mono text-[#D7E0E7]">
            <span className="w-2 h-2 rounded-full bg-[#9B6FD8] animate-pulse" />
            <span className="text-[#8B9AA8]">MoES / NCMRWF High-Impact Initiative</span>
          </div>

          {/* Headline: Word-by-word entrance reveal */}
          <motion.h1
            variants={wordContainer}
            initial="hidden"
            animate="visible"
            className={`${TYPOGRAPHY.displayXl} text-white flex flex-wrap gap-x-3.5 gap-y-1`}
          >
            {HERO_WORDS.map((word, idx) => (
              <motion.span
                key={idx}
                variants={wordItem}
                className={word === 'Thermal' || word === 'Stress' ? 'text-[#FF704F]' : ''}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* One-sentence lead (max 68ch, off-centre) */}
          <p className={TYPOGRAPHY.bodyL}>
            Not a generic weather forecast. ThermaGrid pinpoints who is at risk, where, when it peaks, why, and what action to take — calibrated down to the urban municipal ward.
          </p>

          {/* Two CTAs: Primary Amethyst, Secondary Ghost */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/citizen"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[8px] bg-[#9B6FD8] hover:bg-[#7F56BD] text-white text-sm font-semibold transition-all duration-120 hover:-translate-y-[1px] active:translate-y-0"
            >
              <ShieldAlert className="w-4 h-4" />
              Citizen Protection
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/worker"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[8px] bg-transparent hover:bg-white/5 border border-white/16 text-[#D7E0E7] text-sm font-semibold transition-all duration-120 hover:-translate-y-[1px] active:translate-y-0"
            >
              <HardHat className="w-4 h-4 text-[#F59E0B]" />
              Worker Safety
            </Link>
          </div>

          {/* 3-Stat Rail with Numerals Count-up */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/8 max-w-lg">
            <div>
              <span className="block font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
                ISO 7243
              </span>
              <span className={TYPOGRAPHY.micro}>WBGT Standard</span>
            </div>
            <div>
              <KpiNumeral
                value={72}
                suffix="h"
                size="m"
                color="#FF704F"
                sublabel="Peak Trajectory"
              />
            </div>
            <div>
              <KpiNumeral
                value={24}
                suffix=" Wards"
                size="m"
                color="#2FA37C"
                sublabel="Hyperlocal Resolution"
              />
            </div>
          </div>
        </div>

        {/* Scroll hint bottom-centre */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-60 text-xs font-mono text-[#8B9AA8] pointer-events-none">
          <span>SCROLL TO EXPLORE</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* 2. Section: Two Wards, Same Temperature (The 7/5 Asymmetric Pair) */}
      <section className="space-y-6">
        <SectionHeader
          label="HYPERLOCAL PARADIGM BENCHMARK"
          title="Two Wards, Same Temperature, Different Alert Grade"
          lead="Why generic macro weather apps fail: identical meteorological inputs yield distinct life-safety risks due to local built-environment, informal housing, and occupational vulnerability."
        />
        <TwoWardsComparison />
      </section>

      {/* 3. Section: 3D Ward Heat City (Authority & Municipal View) */}
      <section className="space-y-6">
        <SectionHeader
          label="EXTRUDED URBAN HEAT FIELD"
          title="Ward Heat City 3D Landscape"
          lead="Thousands of instanced volumetric blocks mapping normative human thermal stress. Height and colour encode multi-factorial risk, not mere air temperature."
        />
        <div className="border border-white/8 rounded-[14px] overflow-hidden">
          <WardHeatCity height={560} />
        </div>
      </section>

      {/* 4. Section: How It Works (5-Step Horizontal Rail with Hairline Connectors) */}
      <section className="space-y-6">
        <SectionHeader
          label="END-TO-END COMPUTATIONAL PIPELINE"
          title="From Raw Satellite Telemetry to Targeted Life-Saving Intervention"
          lead="ThermaGrid bridges numerical weather prediction and urban epidemiology through five validated stages."
        />

        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Horizontal Hairline Connector */}
          <div className="hidden md:block absolute top-10 left-8 right-8 h-[1px] bg-white/10 z-0" />

          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative z-10 rounded-[14px] bg-[#1F3445] border border-white/8 p-5 space-y-3 hover:-translate-y-[2px] transition-transform duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-[8px] bg-[#101820] border border-white/10 flex items-center justify-center text-[#9B6FD8]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#5F7183]">{step.num}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">{step.title}</h4>
                  <p className="text-xs text-[#8B9AA8] mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Section: Provenance Strip (4 Mono Facts) */}
      <section className="p-6 rounded-[14px] bg-[#1F3445]/40 border border-white/8 space-y-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#8B9AA8]">
          Data Provenance & Model Auditability
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProvenanceChip
            label="Primary Observation Source"
            value="IMD Synoptic AWS Network"
            sub="Hourly dry-bulb, dewpoint, wind"
          />
          <ProvenanceChip
            label="Spatial Resolution"
            value="Ward-Level (0.01° / ~1.1km)"
            sub="Polygon boundary joins"
          />
          <ProvenanceChip
            label="Licensing & Open Code"
            value="MIT Open Science Standard"
            sub="MoES/NCMRWF initiative"
          />
          <ProvenanceChip
            label="Inference Latency"
            value="< 45ms per Ward Query"
            sub="Validated on live telemetry"
          />
        </div>
      </section>
    </div>
  );
};
