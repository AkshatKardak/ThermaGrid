import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '../common/Container';
import { DataStatusBadge } from '../common/DataStatusBadge';
import { Auth3DBackground } from './Auth3DBackground';
import { useWards } from '../../hooks/useWards';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const { data: wards } = useWards();

  // Shared ward count matching Landing page
  const wardsCount = wards && wards.length > 0 ? wards.length : 24;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col bg-bg text-ink min-h-[calc(100vh-64px)] font-sans">
      <Container noGutter className="flex-1 flex flex-col min-h-full">
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col lg:flex-row border-x border-border">
          {/* LEFT COLUMN: 52% width on desktop — Synoptic Telemetry Narrative on --panel-dark (#14181A) */}
          <div
            id="auth-panel"
            className="w-full lg:w-[52%] min-h-[480px] lg:min-h-full flex flex-col justify-between py-8 sm:py-10 lg:py-14 px-6 sm:px-8 lg:px-12 relative bg-panel-dark text-raised z-10 shrink-0 overflow-hidden"
            style={{ backgroundColor: '#14181A' }}
          >
            {/* 3D Animated Synoptic Background Effect */}
            <Auth3DBackground />

            {/* Top Row: Eyebrow on left, DataStatusBadge on right, same baseline */}
            <div className="relative z-10 flex items-baseline justify-between gap-4 w-full">
              <span className="text-xs font-mono font-medium text-raised/80 uppercase tracking-wider">
                National Synoptic Thermal Field
              </span>
              <DataStatusBadge isDemo={false} variant="dark" />
            </div>

            {/* Core Narrative */}
            <div className="relative z-10 my-auto max-w-lg space-y-7 py-8">
              <div className="space-y-3.5">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-raised leading-[1.12]">
                  Understand heat,
                  <br />
                  protect lives
                </h1>
                <p className="text-sm sm:text-base text-raised/75 leading-relaxed pt-1 max-w-md">
                  Ward-level thermal risk telemetry, biometeorological physics, and municipal early warnings across India.
                </p>
              </div>

              {/* 3 Stat Chips */}
              <div className="grid grid-cols-3 gap-3.5 pt-6 border-t border-border/40">
                <div className="p-4 rounded-[8px] bg-panel-dark/85 backdrop-blur-sm border border-border/60">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-raised block tabular-nums">
                    {wardsCount}+
                  </span>
                  <span className="text-xs text-raised/70 block pt-1 font-medium">
                    Wards monitored
                  </span>
                </div>
                <div className="p-4 rounded-[8px] bg-panel-dark/85 backdrop-blur-sm border border-border/60">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-raised block tabular-nums">
                    36
                  </span>
                  <span className="text-xs text-raised/70 block pt-1 font-medium">
                    States &amp; UTs
                  </span>
                </div>
                <div className="p-4 rounded-[8px] bg-panel-dark/85 backdrop-blur-sm border border-border/60">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-raised block tabular-nums">
                    3
                  </span>
                  <span className="text-xs text-raised/70 block pt-1 font-medium">
                    Thermal indices
                  </span>
                </div>
              </div>
            </div>

            {/* Left Footer Reference with Signature Live Indicator */}
            <div className="relative z-10 text-xs font-mono text-raised/70 hidden sm:flex items-center gap-2 pt-4 border-t border-border/30">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ backgroundColor: '#8FB3D9' }} />
              <span>IMD AWS · Liljegren ISO 7243 · Open-Meteo Synoptic Grid</span>
            </div>
          </div>

          {/* RIGHT COLUMN: 48% width on desktop — Authentication Chamber on --surface */}
          <div className="w-full lg:w-[48%] min-h-[calc(100vh-64px)] relative bg-surface flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto border-t lg:border-t-0 lg:border-l border-border">
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 6 }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              className="w-full max-w-[520px] sm:max-w-[560px] flex flex-col items-center my-auto py-8"
            >
              {/* Card Header */}
              <div className="text-center space-y-2 mb-8 w-full">
                <h2 className="text-3xl sm:text-4xl font-bold text-ink font-display tracking-tight leading-tight">{title}</h2>
                <p className="text-sm sm:text-base text-muted max-w-md mx-auto leading-relaxed">{subtitle}</p>
              </div>

              {/* Form + Demo Panel Stack (Equal max-w width) */}
              <div className="w-full flex flex-col items-center">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
};
