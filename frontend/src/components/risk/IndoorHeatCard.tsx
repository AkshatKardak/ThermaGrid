import React, { useState } from 'react';
import { Home, ArrowRight, Clock, HelpCircle, ShieldAlert } from 'lucide-react';
import { useIndoorHeat } from '../../hooks/useIndoorHeat';
import { Card } from '../ui/Card';
import { getRiskBand, THEME_COLORS } from '../../theme/tokens';
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
  const bandDef = getRiskBand(data?.band === 'veryhigh' ? 78 : data?.band === 'high' ? 62 : 35);

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-[#8B9AA8]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8B9AA8]">
              Built Environment Thermodynamics
            </span>
          </div>
          <h3 className={`${TYPOGRAPHY.h3} text-white`}>Inside Your Home</h3>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Estimated indoor thermal exposure accounting for roof materials and envelope thermal lag.
          </p>
        </div>

        {/* Estimated Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#8B9AA8] self-start sm:self-auto">
          <HelpCircle className="w-3 h-3 text-[#8B9AA8]" />
          <span>Estimated, not measured</span>
        </div>
      </div>

      {/* Archetype Picker */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
          Select Housing & Floor Archetype
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ARCHETYPES.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setArchetype(arch.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                archetype === arch.id
                  ? 'bg-[#8FB3D9]/15 border-[#8FB3D9] text-white shadow-sm'
                  : 'bg-[#0B141B] border-white/10 text-[#8B9AA8] hover:text-[#D7E0E7] hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-semibold block leading-tight">{arch.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-5">
          {/* Dual Numerals Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Outdoor */}
            <div className="p-4 rounded-xl bg-[#0B141B] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-[#8B9AA8] uppercase block">Outdoor Now</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-[#D7E0E7]">
                  {data?.outdoor_now_c.toFixed(1)}°C
                </span>
                <span className="text-xs text-[#8B9AA8]">Ambient</span>
              </div>
              <p className="text-[11px] text-[#5F7183]">Ground-truth meteorological observation</p>
            </div>

            {/* Indoor */}
            <div className="p-4 rounded-xl bg-[#0B141B] border border-white/10 space-y-1 relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-[#FF704F]/5 rounded-full blur-xl pointer-events-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8B9AA8] uppercase">Indoor Estimated</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    color: delta > 0 ? THEME_COLORS.heatScale.veryhigh : THEME_COLORS.heatScale.safe,
                    backgroundColor: delta > 0 ? `${THEME_COLORS.heatScale.veryhigh}20` : `${THEME_COLORS.heatScale.safe}20`,
                  }}
                >
                  {delta > 0 ? `+${delta.toFixed(1)}°C` : `${delta.toFixed(1)}°C`}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-mono font-bold"
                  style={{
                    color: delta > 0 ? THEME_COLORS.heatScale.veryhigh : THEME_COLORS.heatScale.safe,
                  }}
                >
                  {data?.indoor_now_c.toFixed(1)}°C
                </span>
                <span className="text-xs text-[#8B9AA8]">Effective</span>
              </div>
              <p className="text-[11px] text-[#8B9AA8]">
                Estimated Indoor WBGT: <span className="text-white font-mono">{data?.wbgt_indoor}°C</span>
              </p>
            </div>
          </div>

          {/* Thermal Lag Insight Banner */}
          <div className="p-3.5 rounded-xl bg-[#0B141B] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#D7E0E7]">
              <Clock className="w-4 h-4 text-[#8B9AA8] shrink-0" />
              <div>
                <span className="font-semibold text-white">Indoor Peak Expected at {data?.indoor_peak_time}</span>
                <p className="text-[11px] text-[#8B9AA8]">{data?.note}</p>
              </div>
            </div>
            <div className="text-right sm:shrink-0 text-[11px] font-mono text-[#8B9AA8]">
              Estimated Peak: <strong className="text-white">{data?.indoor_peak_c}°C</strong> ({data?.lag_hours}h lag)
            </div>
          </div>

          {/* Methodology Basis Footer */}
          <div className="text-[10px] font-mono text-[#5F7183] flex items-center justify-between border-t border-white/5 pt-3">
            <span>Method: {data?.method}</span>
            <span>Basis: {data?.basis}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
