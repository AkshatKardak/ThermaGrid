import React, { useState } from 'react';
import { Home, Clock, HelpCircle } from 'lucide-react';
import { useIndoorHeat } from '../../hooks/useIndoorHeat';
import { Card } from '../ui/Card';
import { TYPOGRAPHY } from '../../theme/typography';

interface IndoorHeatCardProps {
  locationId: number;
}

const ARCHETYPES = [
  { id: 'tin_roof_top_floor', label: 'Tin Roof (Top Floor)' },
  { id: 'rcc_top_floor', label: 'RCC (Top Floor)' },
  { id: 'rcc_ground_floor', label: 'RCC (Ground Floor)' },
  { id: 'with_ac', label: 'Air-Conditioned' },
];

export const IndoorHeatCard: React.FC<IndoorHeatCardProps> = ({ locationId }) => {
  const [archetype, setArchetype] = useState('tin_roof_top_floor');
  const { data, isLoading } = useIndoorHeat(locationId, archetype);

  const delta = (data?.indoor_now_c ?? 38.0) - (data?.outdoor_now_c ?? 32.0);

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-muted" />
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted">
              Built Environment Thermodynamics
            </span>
          </div>
          <h3 className={`${TYPOGRAPHY.h3} text-ink`}>Inside Your Home</h3>
          <p className="text-xs text-muted mt-0.5">
            Estimated indoor thermal exposure accounting for roof materials and envelope thermal lag.
          </p>
        </div>

        {/* Estimated Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-raised border border-border text-[10px] font-mono text-muted self-start sm:self-auto">
          <HelpCircle className="w-3 h-3 text-muted" />
          <span>Estimated, not measured</span>
        </div>
      </div>

      {/* Archetype Picker */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
          Select Housing & Floor Archetype
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ARCHETYPES.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setArchetype(arch.id)}
              className={`p-2.5 rounded-[6px] border text-left transition-colors cursor-pointer ${
                archetype === arch.id
                  ? 'bg-raised border-border text-ink font-semibold'
                  : 'bg-surface border-border text-muted hover:text-ink hover:bg-raised'
              }`}
            >
              <span className="text-xs font-semibold block leading-tight">{arch.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 bg-border/40 rounded-[6px] animate-pulse" />
      ) : (
        <div className="space-y-5">
          {/* Dual Numerals Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Outdoor */}
            <div className="p-4 rounded-[6px] bg-raised border border-border space-y-1">
              <span className="text-[10px] font-mono text-muted uppercase block">Outdoor Now</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-ink tabular-nums">
                  {data?.outdoor_now_c.toFixed(1)}°C
                </span>
                <span className="text-xs text-muted">Ambient</span>
              </div>
              <p className="text-[11px] text-muted">Ground-truth meteorological observation</p>
            </div>

            {/* Indoor */}
            <div className="p-4 rounded-[6px] bg-raised border border-border space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted uppercase">Indoor Estimated</span>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold text-ink ${
                    delta > 0
                      ? 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]'
                      : 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]'
                  }`}
                >
                  {delta > 0 ? `+${delta.toFixed(1)}°C` : `${delta.toFixed(1)}°C`}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-ink tabular-nums">
                  {data?.indoor_now_c.toFixed(1)}°C
                </span>
                <span className="text-xs text-muted">Effective</span>
              </div>
              <p className="text-[11px] text-muted">
                Estimated Indoor WBGT: <span className="text-ink font-mono font-semibold">{data?.wbgt_indoor}°C</span>
              </p>
            </div>
          </div>

          {/* Thermal Lag Insight Banner */}
          <div className="p-3.5 rounded-[6px] bg-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-ink">
              <Clock className="w-4 h-4 text-muted shrink-0" />
              <div>
                <span className="font-semibold text-ink">Indoor Peak Expected at {data?.indoor_peak_time}</span>
                <p className="text-[11px] text-muted">{data?.note}</p>
              </div>
            </div>
            <div className="text-right sm:shrink-0 text-[11px] font-mono text-muted">
              Estimated Peak: <strong className="text-ink">{data?.indoor_peak_c}°C</strong> ({data?.lag_hours}h lag)
            </div>
          </div>

          {/* Methodology Basis Footer */}
          <div className="text-[10px] font-mono text-muted flex items-center justify-between border-t border-border pt-3">
            <span>Method: {data?.method}</span>
            <span>Basis: {data?.basis}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
