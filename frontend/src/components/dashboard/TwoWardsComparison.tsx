import React from 'react';
import { RiskBadge } from '../risk/RiskBadge';
import { Users, Home, Trees, Briefcase, AlertCircle, ShieldCheck } from 'lucide-react';
import { TYPOGRAPHY } from '../../theme/typography';

export const TwoWardsComparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Shared Ambient Meteorology Banner */}
      <div className="p-4 rounded-[8px] bg-surface border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] uppercase font-mono tracking-[0.10em] text-muted">
            Simultaneous Ambient Meteorology:
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-ink">
            <span className="font-bold text-ink bg-raised px-2.5 py-1 rounded-[4px] border border-border">
              36.0°C Dry-Bulb
            </span>
            <span className="text-muted">•</span>
            <span className="font-bold text-ink bg-raised px-2.5 py-1 rounded-[4px] border border-border">
              65% Rel. Humidity
            </span>
            <span className="text-muted">•</span>
            <span className="font-bold text-ink bg-raised px-2.5 py-1 rounded-[4px] border border-border">
              800 W/m² Solar Irradiance
            </span>
          </div>
        </div>
        <div className="text-xs font-mono text-muted">
          City: <span className="text-ink font-semibold">Mumbai, India</span>
        </div>
      </div>

      {/* Asymmetric 7/5 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Ward M/East (Govandi) - 7 Columns (Primary High Risk Focus) */}
        <div className="lg:col-span-7 rounded-[8px] bg-surface border border-border p-6 space-y-6 flex flex-col justify-between relative corner-ticks">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.10em] text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-risk-4" />
                  Ward M/East (Govandi / Shivaji Nagar)
                </span>
                <h3 className={`${TYPOGRAPHY.h3} text-ink mt-0.5`}>
                  Dense Informal Settlement
                </h3>
              </div>
              <RiskBadge score={84.5} size="lg" />
            </div>

            {/* Recessed Thermal Indices Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-[6px] bg-raised border border-border text-center font-mono">
              <div>
                <span className="block text-[10px] text-muted uppercase">ISO WBGT</span>
                <span className="text-base font-bold text-ink tabular-nums">34.9°C</span>
              </div>
              <div className="border-x border-border">
                <span className="block text-[10px] text-muted uppercase">UTCI Stress</span>
                <span className="text-base font-bold text-ink tabular-nums">41.8°C</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted uppercase">Heat Index</span>
                <span className="text-base font-bold text-ink tabular-nums">49.2°C</span>
              </div>
            </div>

            {/* Built Environment & Vulnerability Factors */}
            <div className="space-y-2 pt-2 text-xs text-muted">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted" />
                  Population Density
                </span>
                <span className="font-mono text-ink font-semibold">55,705 / km²</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-muted" />
                  Tin-Roof / Non-Insulated Housing
                </span>
                <span className="font-mono text-ink font-semibold">68%</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-muted" />
                  Urban Tree Canopy Cover
                </span>
                <span className="font-mono text-ink font-semibold">4% (Deficit)</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted" />
                  Outdoor Labor Workforce
                </span>
                <span className="font-mono text-ink font-semibold">42% (Vendors, Waste-pickers)</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="p-4 rounded-[6px] bg-[color-mix(in_srgb,var(--risk-4)_12%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))] text-xs text-ink space-y-1">
            <div className="flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-[11px] text-ink">
              <AlertCircle className="w-3.5 h-3.5 text-risk-4" />
              Action Trigger: Very High Risk
            </div>
            <p className="leading-relaxed text-muted">
              Rapid indoor thermal excess (+4.2°C) under tin sheet roofs. Immediate deployment of emergency mobile water hydration stations, cooling shelters, and suspension of outdoor manual shifts during peak hours.
            </p>
          </div>
        </div>

        {/* Ward A (Colaba) - 5 Columns */}
        <div className="lg:col-span-5 rounded-[8px] bg-surface border border-border p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.10em] text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-risk-2" />
                  Ward A (Colaba / Fort)
                </span>
                <h3 className={`${TYPOGRAPHY.h3} text-ink mt-0.5`}>
                  Affluent Coastal Buffer Zone
                </h3>
              </div>
              <RiskBadge score={38.0} size="lg" />
            </div>

            {/* Recessed Thermal Indices Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-[6px] bg-raised border border-border text-center font-mono">
              <div>
                <span className="block text-[10px] text-muted uppercase">ISO WBGT</span>
                <span className="text-base font-bold text-ink tabular-nums">29.1°C</span>
              </div>
              <div className="border-x border-border">
                <span className="block text-[10px] text-muted uppercase">UTCI Stress</span>
                <span className="text-base font-bold text-ink tabular-nums">33.2°C</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted uppercase">Heat Index</span>
                <span className="text-base font-bold text-ink tabular-nums">39.4°C</span>
              </div>
            </div>

            {/* Built Environment & Vulnerability Factors */}
            <div className="space-y-2 pt-2 text-xs text-muted">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted" />
                  Population Density
                </span>
                <span className="font-mono text-ink font-semibold">14,810 / km²</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-muted" />
                  Concrete / Insulated Housing
                </span>
                <span className="font-mono text-ink font-semibold">92%</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-muted" />
                  Urban Tree Canopy Cover
                </span>
                <span className="font-mono text-ink font-semibold">32% (High Shade)</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted" />
                  Outdoor Labor Workforce
                </span>
                <span className="font-mono text-ink font-semibold">14% (Office / Commercial)</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="p-4 rounded-[6px] bg-[color-mix(in_srgb,var(--risk-2)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-2)_60%,var(--ink))] text-xs text-ink space-y-1">
            <div className="flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-[11px] text-ink">
              <ShieldCheck className="w-3.5 h-3.5 text-muted" />
              Action Trigger: Moderate Caution
            </div>
            <p className="leading-relaxed text-muted">
              Coastal breeze circulation and dense vegetation canopy effectively buffer macro heat. Standard public hydration alerts and normal municipal operations suffice.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
