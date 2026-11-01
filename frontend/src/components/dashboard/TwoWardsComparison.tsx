import React from 'react';
import { Card } from '../common/Card';
import { RiskBadge } from '../risk/RiskBadge';
import { Trees, Home, Users, Building } from 'lucide-react';

export const TwoWardsComparison: React.FC = () => {
  return (
    <Card
      title="The Hyperlocal Paradigm: Two Wards, Same Temperature, Different Alert Grade"
      subtitle="Why generic weather apps fail: identical meteorological inputs yield distinct life-safety risks due to local built-environment and vulnerability factors"
      action={
        <span className="px-2.5 py-1 bg-[#9B6FD8]/20 border border-[#9B6FD8]/30 text-[10px] font-mono text-[#9B6FD8] uppercase font-bold rounded-lg shrink-0 whitespace-nowrap">
          MoES Benchmark
        </span>
      }
      className="border-[#9B6FD8]/30 shadow-2xl relative overflow-hidden"
    >

      {/* Shared Ambient Meteorology Banner */}
      <div className="p-3.5 rounded-lg bg-[#101820] border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs uppercase font-mono tracking-wider text-[#8B9AA8]">
            Simultaneous Ambient Meteorology:
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-white font-bold text-sm">36.0°C Dry-Bulb</span>
            <span className="text-[#8B9AA8]">•</span>
            <span className="text-white font-bold text-sm">65% Rel. Humidity</span>
            <span className="text-[#8B9AA8]">•</span>
            <span className="text-white font-bold text-sm">800 W/m² Solar</span>
          </div>
        </div>
        <div className="text-xs font-mono text-[#8B9AA8]">
          City: <span className="text-white font-semibold">Mumbai, India</span>
        </div>
      </div>

      {/* Two Wards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ward M/East (Govandi) - High Vulnerability */}
        <div className="p-5 rounded-xl bg-[#101820]/80 border border-[#FF704F]/40 space-y-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono text-[#FF704F] font-bold tracking-wider">
                WARD M/EAST (SHIVAJI NAGAR / GOVANDI)
              </div>
              <h4 className="text-lg font-bold text-white font-display mt-0.5">
                Dense Informal Settlement
              </h4>
            </div>
            <RiskBadge score={84.5} size="lg" />
          </div>

          <div className="space-y-2.5 text-xs text-[#8B9AA8] pt-2">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#FF704F]" />
                Population Density
              </span>
              <span className="font-mono text-white font-semibold">55,705 / km²</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-[#FF704F]" />
                Tin-Roof / Informal Housing
              </span>
              <span className="font-mono text-white font-semibold">68%</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Trees className="w-3.5 h-3.5 text-[#FF704F]" />
                Urban Tree Canopy Cover
              </span>
              <span className="font-mono text-[#FF704F] font-semibold">4% (Severe Deficit)</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-[#FF704F]" />
                Outdoor Labor Workforce
              </span>
              <span className="font-mono text-white font-semibold">42% (Vendors, Waste-pickers)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FF704F]/10 border border-[#FF704F]/25 text-xs text-[#D7E0E7] leading-relaxed">
            <strong className="text-[#FF704F]">Action Trigger: </strong>
            Orange/Red Alert. Rapid indoor heat accumulation under tin roofs (+4°C thermal excess).
            Emergency water tankers and public cooling shelters deployed immediately.
          </div>
        </div>

        {/* Ward A (Colaba) - Low Vulnerability */}
        <div className="p-5 rounded-xl bg-[#101820]/80 border border-[#2FA37C]/40 space-y-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono text-[#2FA37C] font-bold tracking-wider">
                WARD A (COLABA / FORT / MARINE DRIVE)
              </div>
              <h4 className="text-lg font-bold text-white font-display mt-0.5">
                Affluent Coastal Buffer Zone
              </h4>
            </div>
            <RiskBadge score={38.2} size="lg" />
          </div>

          <div className="space-y-2.5 text-xs text-[#8B9AA8] pt-2">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#2FA37C]" />
                Population Density
              </span>
              <span className="font-mono text-white font-semibold">14,810 / km²</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-[#2FA37C]" />
                Tin-Roof / Informal Housing
              </span>
              <span className="font-mono text-white font-semibold">8%</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Trees className="w-3.5 h-3.5 text-[#2FA37C]" />
                Urban Tree Canopy Cover
              </span>
              <span className="font-mono text-[#2FA37C] font-semibold">32% (High Shade)</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-[#2FA37C]" />
                Outdoor Labor Workforce
              </span>
              <span className="font-mono text-white font-semibold">16%</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#2FA37C]/10 border border-[#2FA37C]/25 text-xs text-[#D7E0E7] leading-relaxed">
            <strong className="text-[#2FA37C]">Action Trigger: </strong>
            Yellow Alert / Moderate Caution. Sea breeze circulation and mature vegetative shade buffer
            physiological heat load. Routine hydration advisories suffice.
          </div>
        </div>

      </div>
    </Card>
  );
};
