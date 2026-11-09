import React from 'react';
import { RiskBadge } from '../risk/RiskBadge';
import { Users, Home, Trees, Briefcase, AlertCircle, ShieldCheck } from 'lucide-react';
import { TYPOGRAPHY } from '../../theme/typography';

export const TwoWardsComparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Shared Ambient Meteorology Banner */}
      <div className="p-4 rounded-[14px] bg-[#142630]/60 border border-white/8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] uppercase font-mono tracking-[0.10em] text-[#8B9AA8]">
            Simultaneous Ambient Meteorology:
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#D7E0E7]">
            <span className="font-bold text-white bg-[#0B141B] px-2.5 py-1 rounded border border-white/5">
              36.0°C Dry-Bulb
            </span>
            <span className="text-[#5F7183]">•</span>
            <span className="font-bold text-white bg-[#0B141B] px-2.5 py-1 rounded border border-white/5">
              65% Rel. Humidity
            </span>
            <span className="text-[#5F7183]">•</span>
            <span className="font-bold text-white bg-[#0B141B] px-2.5 py-1 rounded border border-white/5">
              800 W/m² Solar Irradiance
            </span>
          </div>
        </div>
        <div className="text-xs font-mono text-[#8B9AA8]">
          City: <span className="text-white font-semibold">Mumbai, India</span>
        </div>
      </div>

      {/* Asymmetric 7/5 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Ward M/East (Govandi) - 7 Columns (Primary High Risk Focus) */}
        <div className="lg:col-span-7 rounded-[14px] bg-[#142630] border border-[#FF704F]/40 p-6 space-y-6 flex flex-col justify-between [box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)] relative corner-ticks">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.10em] text-[#FF704F]">
                  Ward M/East (Govandi / Shivaji Nagar)
                </span>
                <h3 className={`${TYPOGRAPHY.h3} text-white mt-0.5`}>
                  Dense Informal Settlement
                </h3>
              </div>
              <RiskBadge score={84.5} size="lg" />
            </div>

            {/* Recessed Thermal Indices Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-[8px] bg-[#203A45]/40 border border-white/8 text-center font-mono">
              <div>
                <span className="block text-[10px] text-[#8B9AA8] uppercase">ISO WBGT</span>
                <span className="text-base font-bold text-[#FF704F] tabular-nums">34.9°C</span>
              </div>
              <div className="border-x border-white/8">
                <span className="block text-[10px] text-[#8B9AA8] uppercase">UTCI Stress</span>
                <span className="text-base font-bold text-[#FF704F] tabular-nums">41.8°C</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#8B9AA8] uppercase">Heat Index</span>
                <span className="text-base font-bold text-[#FF704F] tabular-nums">49.2°C</span>
              </div>
            </div>

            {/* Built Environment & Vulnerability Factors */}
            <div className="space-y-2 pt-2 text-xs text-[#8B9AA8]">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#FF704F]" />
                  Population Density
                </span>
                <span className="font-mono text-white font-semibold">55,705 / km²</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-[#FF704F]" />
                  Tin-Roof / Non-Insulated Housing
                </span>
                <span className="font-mono text-white font-semibold">68%</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-[#FF704F]" />
                  Urban Tree Canopy Cover
                </span>
                <span className="font-mono text-[#FF704F] font-semibold">4% (Deficit)</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-[#FF704F]" />
                  Outdoor Labor Workforce
                </span>
                <span className="font-mono text-white font-semibold">42% (Vendors, Waste-pickers)</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="p-4 rounded-[8px] bg-[#FF704F]/10 border border-[#FF704F]/30 text-xs text-[#D7E0E7] space-y-1">
            <div className="flex items-center gap-1.5 text-[#FF704F] font-mono font-bold uppercase tracking-wider text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              Action Trigger: Very High Risk
            </div>
            <p className="leading-relaxed">
              Rapid indoor thermal excess (+4.2°C) under tin sheet roofs. Immediate deployment of emergency mobile water hydration stations, cooling shelters, and suspension of outdoor manual shifts during peak hours.
            </p>
          </div>
        </div>

        {/* Ward A (Colaba) - 5 Columns */}
        <div className="lg:col-span-5 rounded-[14px] bg-[#142630] border border-white/10 p-6 space-y-6 flex flex-col justify-between [box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.10em] text-[#E8C547]">
                  Ward A (Colaba / Fort)
                </span>
                <h3 className={`${TYPOGRAPHY.h3} text-white mt-0.5`}>
                  Affluent Coastal Buffer Zone
                </h3>
              </div>
              <RiskBadge score={38.0} size="lg" />
            </div>

            {/* Recessed Thermal Indices Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-[8px] bg-[#203A45]/40 border border-white/8 text-center font-mono">
              <div>
                <span className="block text-[10px] text-[#8B9AA8] uppercase">ISO WBGT</span>
                <span className="text-base font-bold text-[#E8C547] tabular-nums">29.1°C</span>
              </div>
              <div className="border-x border-white/8">
                <span className="block text-[10px] text-[#8B9AA8] uppercase">UTCI Stress</span>
                <span className="text-base font-bold text-[#E8C547] tabular-nums">33.2°C</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#8B9AA8] uppercase">Heat Index</span>
                <span className="text-base font-bold text-[#E8C547] tabular-nums">39.4°C</span>
              </div>
            </div>

            {/* Built Environment & Vulnerability Factors */}
            <div className="space-y-2 pt-2 text-xs text-[#8B9AA8]">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#2FA37C]" />
                  Population Density
                </span>
                <span className="font-mono text-white font-semibold">14,810 / km²</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-[#2FA37C]" />
                  Concrete / Insulated Housing
                </span>
                <span className="font-mono text-white font-semibold">92%</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-[#2FA37C]" />
                  Urban Tree Canopy Cover
                </span>
                <span className="font-mono text-[#2FA37C] font-semibold">32% (High Shade)</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-[#2FA37C]" />
                  Outdoor Labor Workforce
                </span>
                <span className="font-mono text-white font-semibold">14% (Office / Commercial)</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="p-4 rounded-[8px] bg-[#E8C547]/10 border border-[#E8C547]/30 text-xs text-[#D7E0E7] space-y-1">
            <div className="flex items-center gap-1.5 text-[#E8C547] font-mono font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Action Trigger: Moderate Caution
            </div>
            <p className="leading-relaxed">
              Coastal breeze circulation and dense vegetation canopy effectively buffer macro heat. Standard public hydration alerts and normal municipal operations suffice.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
