import React, { useEffect, useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const LazyRiskGlobe = React.lazy(() =>
  import('../../three/scenes/RiskGlobe').then((mod) => ({ default: mod.RiskGlobe }))
);

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0B141B] text-[#D8E8E6] lg:h-screen lg:overflow-hidden font-sans selection:bg-[#8FB3D9]/25 selection:text-white">
      {/* LEFT COLUMN: 52% width on desktop — Observatory Deck & Narrative */}
      <div className="w-full lg:w-[52%] h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative bg-[#0B141B] z-10 shrink-0 overflow-hidden">
        {/* Designated Observatory 3D Globe Viewport */}
        <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0">
          <div
            className="w-full h-full opacity-35"
            style={{
              maskImage: 'radial-gradient(circle at 75% 50%, black 25%, transparent 72%)',
              WebkitMaskImage: 'radial-gradient(circle at 75% 50%, black 25%, transparent 72%)',
            }}
          >
            <Suspense fallback={<div className="w-full h-full bg-[#0B141B]" />}>
              <LazyRiskGlobe height="100%" interactive={false} />
            </Suspense>
          </div>
        </div>

        {/* Brand Logo Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[8px] bg-[#203A45] border border-white/[0.075] flex items-center justify-center transition-colors group-hover:border-white/[0.15]">
              <Flame className="w-4 h-4 text-[#8FB3D9]" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-medium tracking-tight text-white font-display">
                ThermaGrid
              </span>
            </div>
          </Link>
        </div>

        {/* Core Narrative */}
        <div className="relative z-10 my-8 lg:my-auto max-w-lg space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-4xl sm:text-[44px] sm:leading-[48px] font-medium tracking-tight text-[#D8E8E6]">
              Understand heat,
              <br />
              protect lives
            </h1>
            <p className="text-sm text-[#93A3B0] leading-relaxed pt-1">
              Ward-level thermal risk telemetry, biometeorological physics, and municipal early warnings across India.
            </p>
          </div>

          {/* 3 Stat Chips */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.075]">
            <div className="p-3.5 rounded-[8px] bg-[#142630]/80 border border-white/[0.075]">
              <span className="font-mono text-xl font-medium text-[#D8E8E6] block tabular-nums">
                66+
              </span>
              <span className="text-xs text-[#6B7C8A] block pt-1">
                Wards monitored
              </span>
            </div>
            <div className="p-3.5 rounded-[8px] bg-[#142630]/80 border border-white/[0.075]">
              <span className="font-mono text-xl font-medium text-[#D8E8E6] block tabular-nums">
                36
              </span>
              <span className="text-xs text-[#6B7C8A] block pt-1">
                States &amp; UTs
              </span>
            </div>
            <div className="p-3.5 rounded-[8px] bg-[#142630]/80 border border-white/[0.075]">
              <span className="font-mono text-xl font-medium text-[#D8E8E6] block tabular-nums">
                3
              </span>
              <span className="text-xs text-[#6B7C8A] block pt-1">
                Thermal indices
              </span>
            </div>
          </div>
        </div>

        {/* Left Footer Reference with Signature Live Indicator */}
        <div className="relative z-10 text-xs font-mono text-[#6B7C8A] hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2FA37C]" />
          <span>IMD AWS · Liljegren ISO 7243 · Open-Meteo</span>
        </div>
      </div>

      {/* RIGHT COLUMN: 48% width on desktop — Calm Authentication Chamber */}
      <div className="w-full lg:w-[48%] h-full relative bg-[#142630] flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto lg:overflow-hidden border-t lg:border-t-0 lg:border-l border-white/[0.075]">
        {/* Centered Auth Card */}
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 8 }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          className="w-full max-w-sm mx-auto relative z-10 flex flex-col items-center my-auto"
        >
          {/* Card Header */}
          <div className="text-center space-y-1 mb-5 w-full">
            <h2 className="text-lg font-medium text-white font-display">{title}</h2>
            <p className="text-xs text-[#93A3B0]">{subtitle}</p>
          </div>

          {/* Form + Demo Panel */}
          <div className="w-full flex flex-col items-center">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
