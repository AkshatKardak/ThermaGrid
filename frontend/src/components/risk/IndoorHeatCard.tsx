import React, { useState } from 'react';
import { Home, Clock, HelpCircle, Sun, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useIndoorHeat } from '../../hooks/useIndoorHeat';
import { Card } from '../ui/Card';
import { formatNumber } from '../../utils/format';

interface IndoorHeatCardProps {
  locationId?: number | null;
}

const ARCHETYPES = [
  {
    id: 'tin_roof_top_floor',
    label: 'Tin Roof (Top)',
    code: 'ARCH-01',
    desc: 'τ ≈ 0.9h · Fast gain',
  },
  {
    id: 'rcc_top_floor',
    label: 'RCC (Top Floor)',
    code: 'ARCH-02',
    desc: 'τ ≈ 3.4h · Evening lag',
  },
  {
    id: 'rcc_ground_floor',
    label: 'RCC (Ground)',
    code: 'ARCH-03',
    desc: 'τ ≈ 5.1h · Buffered',
  },
  {
    id: 'with_ac',
    label: 'Air-Conditioned',
    code: 'ARCH-04',
    desc: 'Active HVAC cooling',
  },
];

export const IndoorHeatCard: React.FC<IndoorHeatCardProps> = ({ locationId }) => {
  const [archetype, setArchetype] = useState('tin_roof_top_floor');
  const { data, isLoading } = useIndoorHeat(locationId, archetype);

  const delta = (data?.indoor_now_c ?? 38.0) - (data?.outdoor_now_c ?? 32.0);

  return (
    <Card className="p-3 sm:p-4 space-y-3">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Home className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              Built Environment Thermodynamics
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-display font-bold text-ink tracking-tight">
            Inside Your Home
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Indoor heat exposure accounting for roof materials and envelope thermal lag.
          </p>
        </div>

        {/* Estimated Calibration Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-raised border border-border text-[11px] font-mono text-muted self-start sm:self-auto shrink-0">
          <HelpCircle className="w-3 h-3 text-accent shrink-0" />
          <span>Physics Estimation</span>
        </div>
      </div>

      {/* Archetype Picker */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium block">
          Select Housing &amp; Roof Archetype
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ARCHETYPES.map((arch) => {
            const isSelected = archetype === arch.id;
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => setArchetype(arch.id)}
                className={`p-2 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-raised border-accent ring-1 ring-accent text-ink font-semibold'
                    : 'bg-surface border-border text-muted hover:text-ink hover:bg-raised'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono text-accent font-semibold uppercase">
                    {arch.code}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
                <div>
                  <span className="text-xs font-semibold block leading-tight text-ink">
                    {arch.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted block mt-0.5">
                    {arch.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="h-28 bg-border/30 rounded-[6px] animate-pulse" />
      ) : (
        <div className="space-y-3">
          {/* Dual Numerals Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Outdoor Ambient Box */}
            <div className="p-2.5 sm:p-3 rounded-[6px] bg-raised border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                  Outdoor Ambient
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-surface border border-border text-muted">
                  AWS Sensor
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-ink tabular-nums tracking-tight">
                  {formatNumber(data?.outdoor_now_c, 1)}°C
                </span>
                <span className="text-xs font-mono text-muted">Dry Bulb</span>
              </div>

              <div className="pt-1.5 border-t border-border/50 text-[11px] text-muted flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>Ground-truth observation</span>
              </div>
            </div>

            {/* Indoor Estimated Box */}
            <div className="p-2.5 sm:p-3 rounded-[6px] bg-raised border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                  Indoor Estimated
                </span>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold text-ink ${
                    delta > 0
                      ? 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]'
                      : 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]'
                  }`}
                >
                  {delta > 0 ? `+${formatNumber(delta, 1)}°C` : `${formatNumber(delta, 1)}°C`} vs Outdoor
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-ink tabular-nums tracking-tight">
                  {formatNumber(data?.indoor_now_c, 1)}°C
                </span>
                <span className="text-xs font-mono text-muted">Effective</span>
              </div>

              <div className="pt-1.5 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-muted shrink-0" />
                  Indoor WBGT:
                </span>
                <span className="text-ink font-mono font-bold text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border">
                  {data?.wbgt_indoor}°C
                </span>
              </div>
            </div>
          </div>

          {/* Thermal Lag Insight Banner */}
          <div className="p-2.5 rounded-[6px] bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="text-xs font-semibold text-ink block">
                  Indoor Peak Expected at {data?.indoor_peak_time}
                </span>
                <p className="text-[11px] text-muted leading-snug">{data?.note}</p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 font-mono text-xs text-muted">
              Peak: <strong className="text-ink">{data?.indoor_peak_c}°C</strong> ({data?.lag_hours}h delay)
            </div>
          </div>

          {/* Methodology Basis Footer */}
          <div className="pt-1.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-muted">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
              <span>Calc: {data?.method}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-muted shrink-0" />
              <span>Reference: {data?.basis}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
