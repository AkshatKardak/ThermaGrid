import React, { useState } from 'react';
import { Home, Clock, HelpCircle, Sun, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useIndoorHeat } from '../../hooks/useIndoorHeat';
import { Card } from '../ui/Card';

interface IndoorHeatCardProps {
  locationId: number;
}

const ARCHETYPES = [
  {
    id: 'tin_roof_top_floor',
    label: 'Tin Roof (Top Floor)',
    code: 'ARCH-01',
    desc: 'τ ≈ 0.9h · Rapid solar gain',
  },
  {
    id: 'rcc_top_floor',
    label: 'RCC (Top Floor)',
    code: 'ARCH-02',
    desc: 'τ ≈ 3.4h · Evening lag peak',
  },
  {
    id: 'rcc_ground_floor',
    label: 'RCC (Ground Floor)',
    code: 'ARCH-03',
    desc: 'τ ≈ 5.1h · Ground-buffered',
  },
  {
    id: 'with_ac',
    label: 'Air-Conditioned',
    code: 'ARCH-04',
    desc: 'Continuous mechanical cooling',
  },
];

export const IndoorHeatCard: React.FC<IndoorHeatCardProps> = ({ locationId }) => {
  const [archetype, setArchetype] = useState('tin_roof_top_floor');
  const { data, isLoading } = useIndoorHeat(locationId, archetype);

  const delta = (data?.indoor_now_c ?? 38.0) - (data?.outdoor_now_c ?? 32.0);

  return (
    <Card className="p-6 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-accent font-semibold">
              Built Environment Thermodynamics
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
            Inside Your Home
          </h3>
          <p className="text-sm text-muted max-w-xl leading-relaxed">
            Estimated indoor thermal exposure accounting for roof materials, envelope insulation, and delayed diurnal phase lag.
          </p>
        </div>

        {/* Estimated Calibration Chip */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-[6px] bg-raised border border-border text-xs font-mono text-muted self-start sm:self-auto shrink-0 shadow-none">
          <HelpCircle className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Calibrated Physics Estimation</span>
        </div>
      </div>

      {/* Archetype Picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium">
            Select Housing &amp; Roof Archetype
          </span>
          <span className="text-xs font-mono text-muted hidden sm:inline">
            4 envelope profiles evaluated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {ARCHETYPES.map((arch) => {
            const isSelected = archetype === arch.id;
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => setArchetype(arch.id)}
                className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'bg-raised border-accent ring-1 ring-accent text-ink font-semibold shadow-none'
                    : 'bg-surface border-border text-muted hover:text-ink hover:bg-raised'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-mono text-accent font-semibold uppercase">
                    {arch.code}
                  </span>
                  {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-border" />
                  )}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold block leading-tight text-ink mb-1">
                    {arch.label}
                  </span>
                  <span className="text-[11px] font-mono text-muted block leading-snug">
                    {arch.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="h-44 bg-border/40 rounded-[8px] animate-pulse" />
      ) : (
        <div className="space-y-6">
          {/* Dual Numerals Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Outdoor Ambient Box */}
            <div className="p-5 sm:p-6 rounded-[8px] bg-raised border border-border flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium">
                  Outdoor Ambient
                </span>
                <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-surface border border-border text-muted">
                  Station Observation
                </span>
              </div>

              <div className="space-y-1 my-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-ink tabular-nums tracking-tight">
                    {data?.outdoor_now_c.toFixed(1)}°C
                  </span>
                  <span className="text-xs font-mono text-muted">Dry Bulb</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-muted leading-relaxed flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted shrink-0" />
                <span>Ground-truth meteorological observation at nearest AWS sensor</span>
              </div>
            </div>

            {/* Indoor Estimated Box */}
            <div className="p-5 sm:p-6 rounded-[8px] bg-raised border border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium">
                  Indoor Estimated
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-[4px] text-xs font-mono font-bold text-ink ${
                    delta > 0
                      ? 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]'
                      : 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]'
                  }`}
                >
                  {delta > 0 ? `+${delta.toFixed(1)}°C` : `${delta.toFixed(1)}°C`} vs Outdoor
                </span>
              </div>

              <div className="space-y-1 my-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-ink tabular-nums tracking-tight">
                    {data?.indoor_now_c.toFixed(1)}°C
                  </span>
                  <span className="text-xs font-mono text-muted">Effective</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-muted leading-relaxed flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-muted shrink-0" />
                  Estimated Indoor WBGT:
                </span>
                <span className="text-ink font-mono font-bold text-xs bg-surface px-2 py-0.5 rounded-[4px] border border-border">
                  {data?.wbgt_indoor}°C WBGT
                </span>
              </div>
            </div>
          </div>

          {/* Thermal Lag Insight Banner */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-[8px] bg-raised border border-border flex items-center justify-center shrink-0 text-accent">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div className="space-y-1">
                <span className="text-sm sm:text-base font-semibold text-ink block">
                  Indoor Peak Expected at {data?.indoor_peak_time}
                </span>
                <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
                  {data?.note}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-[6px] bg-raised border border-border text-left md:text-right shrink-0 space-y-0.5">
              <span className="text-[10px] font-mono text-muted uppercase block">
                Estimated Peak Inside
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-ink block">
                {data?.indoor_peak_c}°C
              </span>
              <span className="text-xs font-mono text-muted block">
                ({data?.lag_hours}h phase delay)
              </span>
            </div>
          </div>

          {/* Methodology Basis Footer */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Calculation: {data?.method}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>Physics Reference: {data?.basis}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
