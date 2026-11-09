import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { RiskGlobe } from '../../three/scenes/RiskGlobe';
import { MOTION } from '../../theme/tokens';

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0B141B] text-[#D8E8E6] lg:h-screen lg:overflow-hidden font-sans selection:bg-[#8FB3D9]/25">
      {/* LEFT COLUMN: 55% width on desktop */}
      <div className="w-full lg:w-[55%] h-full flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative bg-[#0B141B] z-10 shrink-0">
        {/* Subtle vertical hairline grid at 4% opacity */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '48px 100%',
          }}
          aria-hidden="true"
        />

        {/* Brand Logo Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[8px] bg-[#203A45] border border-white/[0.075] flex items-center justify-center transition-colors group-hover:border-[#8FB3D9]">
              <Flame className="w-4 h-4 text-[#8FB3D9]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              ThermaGrid
            </span>
          </Link>
        </div>

        {/* Core Editorial Narrative */}
        <div className="relative z-10 my-8 lg:my-auto max-w-lg space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-[40px] leading-[44px] sm:text-5xl font-black tracking-tight text-white">
              Understand heat.
              <br />
              <span className="text-[#8FB3D9]">Protect lives.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#93A3B0] leading-relaxed pt-2">
              Hyperlocal thermal intelligence for resilient cities. Calibrating biometeorological physics, urban microclimates, and municipal early warnings down to the urban ward.
            </p>
          </div>

          {/* 3 Stat Chips */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.075]">
            <div className="p-3 rounded-[8px] bg-[#142630]/70 border border-white/[0.075]">
              <span className="font-mono text-xl font-bold text-white block tabular-nums">66+</span>
              <span className="text-[10px] font-mono uppercase text-[#6B7C8A] block">
                Wards Monitored
              </span>
            </div>
            <div className="p-3 rounded-[8px] bg-[#142630]/70 border border-white/[0.075]">
              <span className="font-mono text-xl font-bold text-[#8FB3D9] block tabular-nums">36</span>
              <span className="text-[10px] font-mono uppercase text-[#6B7C8A] block">
                States &amp; UTs
              </span>
            </div>
            <div className="p-3 rounded-[8px] bg-[#142630]/70 border border-white/[0.075]">
              <span className="font-mono text-xl font-bold text-white block tabular-nums">3</span>
              <span className="text-[10px] font-mono uppercase text-[#6B7C8A] block">
                Indices (WBGT · UTCI · HI)
              </span>
            </div>
          </div>
        </div>

        {/* Left Footer Reference */}
        <div className="relative z-10 text-xs font-mono text-[#5F7183] hidden sm:block">
          ISO 7243 · Liljegren (2008) · IMD AWS · Open-Meteo
        </div>
      </div>

      {/* RIGHT COLUMN: 45% width on desktop with 3D Globe + Floating Auth Card */}
      <div className="w-full lg:w-[45%] h-full relative bg-[#142630] flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto lg:overflow-hidden border-t lg:border-t-0 lg:border-l border-white/[0.075]">
        {/* 3D Globe Background (Desktop only, 45% width, height 100%, pointer-events: none, slow rotate 0.02 rad/s) */}
        <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
            className="w-full h-full pointer-events-none opacity-45"
          >
            <RiskGlobe height="100%" interactive={false} />
          </motion.div>
        </div>

        {/* Floating Auth Card with Mask Entrance Reveal */}
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  clipPath: 'inset(0 0 100% 0)',
                }
          }
          animate={{
            opacity: 1,
            clipPath: 'inset(0 0 0 0)',
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center my-auto"
        >
          {/* Card Header */}
          <div className="text-center space-y-1 mb-4">
            <h2 className="text-lg font-bold text-white font-display">{title}</h2>
            <p className="text-xs text-[#93A3B0]">{subtitle}</p>
          </div>

          {/* Children: Clerk form + DemoAccountPanel */}
          <div className="w-full flex flex-col items-center">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
