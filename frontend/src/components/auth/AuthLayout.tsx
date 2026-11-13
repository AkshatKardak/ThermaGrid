import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '../common/Container';
import { DataStatusBadge } from '../common/DataStatusBadge';
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
    <div className="w-full flex-1 flex flex-col bg-bg text-ink h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden font-sans">
      <Container noGutter className="flex-1 flex flex-col h-full">
        <div className="w-full h-full flex flex-col lg:flex-row border-x border-border">
          {/* LEFT COLUMN: 52% width on desktop — Synoptic Telemetry Narrative on --panel-dark (#14181A) */}
          <div
            id="auth-panel"
            className="w-full lg:w-[52%] h-full flex flex-col justify-between py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 relative bg-panel-dark text-raised z-10 shrink-0 overflow-hidden"
            style={{ backgroundColor: '#14181A' }}
          >
            {/* Top Row: Eyebrow on left, DataStatusBadge on right, same baseline */}
            <div className="flex items-baseline justify-between gap-4 w-full">
              <span className="text-xs font-mono font-medium text-raised/75 uppercase tracking-wider">
                National Synoptic Thermal Field
              </span>
              <DataStatusBadge isDemo={false} variant="dark" />
            </div>

            {/* Core Narrative */}
            <div className="my-auto max-w-lg space-y-6">
              <div className="space-y-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-raised leading-[1.12]">
                  Understand heat,
                  <br />
                  protect lives
                </h1>
                <p className="text-sm text-raised/70 leading-relaxed pt-1">
                  Ward-level thermal risk telemetry, biometeorological physics, and municipal early warnings across India.
                </p>
              </div>

              {/* 3 Stat Chips */}
              <div className="grid grid-cols-3 gap-3 pt-5 border-t border-border/40">
                <div className="p-3.5 rounded-[6px] bg-panel-dark border border-border/50">
                  <span className="font-mono text-xl font-bold text-raised block tabular-nums">
                    {wardsCount}+
                  </span>
                  <span className="text-xs text-raised/60 block pt-1">
                    Wards monitored
                  </span>
                </div>
                <div className="p-3.5 rounded-[6px] bg-panel-dark border border-border/50">
                  <span className="font-mono text-xl font-bold text-raised block tabular-nums">
                    36
                  </span>
                  <span className="text-xs text-raised/60 block pt-1">
                    States &amp; UTs
                  </span>
                </div>
                <div className="p-3.5 rounded-[6px] bg-panel-dark border border-border/50">
                  <span className="font-mono text-xl font-bold text-raised block tabular-nums">
                    3
                  </span>
                  <span className="text-xs text-raised/60 block pt-1">
                    Thermal indices
                  </span>
                </div>
              </div>
            </div>

            {/* Left Footer Reference with Signature Live Indicator */}
            <div className="text-xs font-mono text-raised/60 hidden sm:flex items-center gap-2 pt-4 border-t border-border/30">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" style={{ backgroundColor: '#8FB3D9' }} />
              <span>IMD AWS · Liljegren ISO 7243 · Open-Meteo</span>
            </div>
          </div>

          {/* RIGHT COLUMN: 48% width on desktop — Authentication Chamber on --surface */}
          <div className="w-full lg:w-[48%] h-full relative bg-surface flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto border-t lg:border-t-0 lg:border-l border-border">
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
              className="w-full max-w-[400px] flex flex-col items-center my-auto"
            >
              {/* Card Header */}
              <div className="text-center space-y-1 mb-4 w-full">
                <h2 className="text-lg font-bold text-ink font-display">{title}</h2>
                <p className="text-xs text-muted">{subtitle}</p>
              </div>

              {/* Form + Demo Panel Stack (Equal 400px width) */}
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
