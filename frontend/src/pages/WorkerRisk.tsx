import React, { useState } from 'react';
import { HardHat, ShieldCheck, Shirt } from 'lucide-react';
import { Card } from '../components/common/Card';
import { DemoBadge } from '../components/common/DemoBadge';
import { WorkRestAdvisory } from '../components/risk/WorkRestAdvisory';
import { HourlyStrip } from '../components/risk/HourlyStrip';
import { useCurrentThermal } from '../hooks/useThermal';
import { useRiskForecast } from '../hooks/useForecast';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';

export const WorkerRisk: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: thermal } = useCurrentThermal(selectedLocationId);
  const { data: forecast } = useRiskForecast(selectedLocationId);

  // Occupational custom parameters
  const [workload, setWorkload] = useState<'moderate' | 'heavy' | 'very_heavy'>('moderate');
  const [ppeType, setPpeType] = useState<number>(0.0); // CAV in °C
  const [isAcclimatized, setIsAcclimatized] = useState<boolean>(true);

  const baseWbgt = thermal?.wbgt_c || 29.5;
  const effectiveWbgt = Number((baseWbgt + ppeType + (isAcclimatized ? 0.0 : 2.0)).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white font-display">
              Occupational Heat Strain & Worker Safety (ISO 7243)
            </h1>
            {thermal?.is_demo && <DemoBadge label={thermal.demo_label} />}
          </div>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Wet Bulb Globe Temperature (WBGT) screening and mandatory rest cycles for outdoor and industrial workers
          </p>
        </div>

        {/* Ward Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="worker-ward-select" className="text-xs text-[#8B9AA8]">Ward:</label>
          <select
            id="worker-ward-select"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(Number(e.target.value))}
            className="bg-[#1F3445] text-white text-xs px-3 py-2 rounded-lg border border-white/10 outline-none cursor-pointer"
          >
            {wards?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.ward_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive PPE and Workload Configurator */}
      <Card
        title="Workplace Parameter Configuration"
        subtitle="Adjust PPE clothing insulation and metabolic rate for customized heat-strain screening"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Workload Rate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#D7E0E7] flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-[#9B6FD8]" />
              Metabolic Workload Rate
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'moderate', label: 'Moderate', desc: '300W (Masonry/Plastering)' },
                { id: 'heavy', label: 'Heavy', desc: '400W (Excavation/Trenching)' },
                { id: 'very_heavy', label: 'Very Heavy', desc: '500W (Asphalt paving)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setWorkload(item.id as any)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    workload === item.id
                      ? 'bg-[#9B6FD8] text-white border-[#9B6FD8] font-bold shadow-md'
                      : 'bg-[#101820]/60 text-[#8B9AA8] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* PPE Clothing Adjustment Value (CAV) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#D7E0E7] flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-[#F59E0B]" />
              PPE & Clothing Adjustment Value (CAV)
            </label>
            <select
              value={ppeType}
              onChange={(e) => setPpeType(Number(e.target.value))}
              className="w-full bg-[#101820] text-white text-xs px-3 py-2.5 rounded-lg border border-white/10 outline-none cursor-pointer"
            >
              <option value={0.0}>Standard Cotton Shirt & Pants (+0.0°C)</option>
              <option value={1.5}>Hard Hat + High-Visibility Safety Vest (+1.5°C)</option>
              <option value={3.0}>Double-Layer Coveralls (+3.0°C)</option>
              <option value={8.0}>Chemical / Vapor-Impermeable Suit (+8.0°C)</option>
            </select>
            <p className="text-[11px] text-[#8B9AA8]">
              Per ISO 7243 Annex E clothing correction values
            </p>
          </div>

          {/* Acclimatization State */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#D7E0E7] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2FA37C]" />
              Worker Acclimatization
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAcclimatized(true)}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  isAcclimatized
                    ? 'bg-[#2FA37C] text-white border-[#2FA37C] font-bold'
                    : 'bg-[#101820]/60 text-[#8B9AA8] border-white/5'
                }`}
              >
                <div>Acclimatized</div>
                <div className="text-[10px] opacity-75 mt-0.5">&gt; 14 days on site</div>
              </button>
              <button
                onClick={() => setIsAcclimatized(false)}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  !isAcclimatized
                    ? 'bg-[#FF704F] text-white border-[#FF704F] font-bold'
                    : 'bg-[#101820]/60 text-[#8B9AA8] border-white/5'
                }`}
              >
                <div>Unacclimatized</div>
                <div className="text-[10px] opacity-75 mt-0.5">New hire (+2°C penalty)</div>
              </button>
            </div>
          </div>

        </div>
      </Card>

      {/* ISO 7243 Screening Output */}
      <WorkRestAdvisory
        wbgt={effectiveWbgt}
        category={effectiveWbgt >= 32.2 ? 'Stop Work' : effectiveWbgt >= 30 ? 'Very High' : effectiveWbgt >= 28 ? 'High' : 'Moderate'}
        guidance={
          effectiveWbgt >= 32.2
            ? 'Cease outdoor heavy manual labor immediately. High hyperthermia and heat stroke risk under direct solar load.'
            : effectiveWbgt >= 30
            ? 'Implement strict 15 min work / 45 min rest schedule in air-conditioned or ventilated shaded canopies.'
            : effectiveWbgt >= 28
            ? 'Enforce 30 min work / 30 min rest cycles. Provide continuous chilled ORS water.'
            : 'Standard 45 min work / 15 min rest cycle. Maintain regular hydration.'
        }
      />

      {/* Diurnal Hourly Strip for Work Shift Planning */}
      <Card
        title="Shift Planning Diurnal Forecast"
        subtitle="Schedule intense heavy lifting and concrete pours during low-stress morning hours"
      >
        {forecast?.items ? (
          <HourlyStrip items={forecast.items} />
        ) : (
          <div className="h-28 flex items-center justify-center text-xs text-[#8B9AA8]">
            Loading shift forecast...
          </div>
        )}
      </Card>
    </div>
  );
};
