import React, { useState } from 'react';
import { Sliders, Trees, Home, Droplets, Clock, Users, Sparkles } from 'lucide-react';
import { Card } from '../components/common/Card';
import { DemoBadge } from '../components/common/DemoBadge';
import { useWards } from '../hooks/useWards';
import { useSimulation } from '../hooks/useCoolingCentres';
import { useAppStore } from '../store/useAppStore';

export const Simulation: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const simulationMutation = useSimulation();

  // Simulation Sliders
  const [greenCover, setGreenCover] = useState<number>(15);
  const [coolRoofs, setCoolRoofs] = useState<number>(30);
  const [mistingHubs, setMistingHubs] = useState<number>(4);
  const [shiftHours, setShiftHours] = useState<number>(2);

  // Results state
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    try {
      const res = await simulationMutation.mutateAsync({
        location_id: selectedLocationId,
        green_cover_expansion_pct: greenCover,
        cool_roofs_adoption_pct: coolRoofs,
        misting_shelters_count: mistingHubs,
        shift_outdoor_hours_by: shiftHours,
      });
      setResult(res);
    } catch {
      // Fallback calculation for UI if network fails
      const baseline = 84.5;
      const reduction = (greenCover * 0.25) + (coolRoofs * 0.18) + (mistingHubs * 1.5) + (shiftHours * 3.0);
      setResult({
        location_id: selectedLocationId,
        ward_name: wards?.find((w) => w.id === selectedLocationId)?.ward_name || 'Selected Ward',
        baseline_risk_score: baseline,
        simulated_risk_score: Math.max(20, baseline - reduction),
        risk_reduction_points: reduction,
        baseline_wbgt_c: 32.4,
        simulated_wbgt_c: 32.4 - (reduction * 0.08),
        estimated_uhi_reduction_c: 1.8,
        population_protected_count: 145000,
        is_demo: true,
        demo_label: 'DEMO DATA (Urban Resilience What-If Simulation)',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white font-display">
              Urban Resilience & What-If Policy Sandbox
            </h1>
            <DemoBadge label="DEMO DATA (Microclimate Simulation)" />
          </div>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Evaluate how targeted municipal interventions mitigate local Urban Heat Island (UHI) intensity and protect vulnerable citizens
          </p>
        </div>

        {/* Ward Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sim-ward-select" className="text-xs text-[#8B9AA8]">Ward:</label>
          <select
            id="sim-ward-select"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Policy Interventions Sliders */}
        <div className="lg:col-span-6 space-y-6">
          <Card
            title="Configure Resilience Interventions"
            subtitle="Adjust sliders to simulate scalable nature-based and reflective cooling actions"
          >
            <div className="space-y-6">
              
              {/* Slider 1: Cool Roofs Adoption */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-[#9B6FD8]" />
                    Cool Roofs / High-Albedo Coating
                  </span>
                  <span className="font-mono font-bold text-[#9B6FD8] text-sm">
                    +{coolRoofs}% of tin roofs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={coolRoofs}
                  onChange={(e) => setCoolRoofs(Number(e.target.value))}
                  className="w-full accent-[#9B6FD8] bg-white/10 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-[#8B9AA8]">
                  Reflective lime/elastomeric coating reduces indoor ceiling temperatures by 3-5°C in informal settlements.
                </p>
              </div>

              {/* Slider 2: Urban Tree Canopy Expansion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-[#2FA37C]" />
                    Urban Tree Canopy / Green Corridors
                  </span>
                  <span className="font-mono font-bold text-[#2FA37C] text-sm">
                    +{greenCover}% canopy expansion
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={greenCover}
                  onChange={(e) => setGreenCover(Number(e.target.value))}
                  className="w-full accent-[#2FA37C] bg-white/10 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-[#8B9AA8]">
                  Miyawaki dense urban forests and shaded street trees providing evaporative cooling and direct radiation intercept.
                </p>
              </div>

              {/* Slider 3: Misting & Hydration Shelters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#FF704F]" />
                    Public Evaporative Misting Hubs
                  </span>
                  <span className="font-mono font-bold text-[#FF704F] text-sm">
                    {mistingHubs} active hubs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={mistingHubs}
                  onChange={(e) => setMistingHubs(Number(e.target.value))}
                  className="w-full accent-[#FF704F] bg-white/10 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-[#8B9AA8]">
                  High-pressure micro-droplet misting fans at busy transit stops and informal market gates.
                </p>
              </div>

              {/* Slider 4: Shift Outdoor Work Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Labor Work Shift Adjustment
                  </span>
                  <span className="font-mono font-bold text-[#F59E0B] text-sm">
                    {shiftHours} hours early morning shift
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(Number(e.target.value))}
                  className="w-full accent-[#F59E0B] bg-white/10 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-[#8B9AA8]">
                  Moving outdoor shifts to 06:00 - 11:00 AM completely avoids extreme noon radiation exposure.
                </p>
              </div>

              <button
                onClick={handleSimulate}
                disabled={simulationMutation.isPending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9B6FD8] to-[#FF704F] hover:opacity-90 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {simulationMutation.isPending ? 'Computing Microclimate Physics...' : 'Execute What-If Simulation'}
              </button>

            </div>
          </Card>
        </div>

        {/* Right: Projected Outcome Telemetry */}
        <div className="lg:col-span-6 space-y-6">
          <Card
            title="Simulated Impact & Life-Safety Delta"
            subtitle="Physics-modeled temperature anomaly and risk reduction outcomes"
          >
            {result ? (
              <div className="space-y-6">
                
                {/* Risk Score Comparison */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#101820]/80 border border-white/10">
                  <div>
                    <span className="text-[10px] font-mono text-[#8B9AA8] uppercase">Baseline Score</span>
                    <div className="text-3xl font-mono font-bold text-[#FF704F]">
                      {result.baseline_risk_score.toFixed(1)}
                    </div>
                    <span className="text-xs text-[#FF704F]">High/Very High Risk</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#8B9AA8] uppercase">Simulated Score</span>
                    <div className="text-3xl font-mono font-bold text-[#2FA37C]">
                      {result.simulated_risk_score.toFixed(1)}
                    </div>
                    <span className="text-xs text-[#2FA37C]">Moderate / Manageable</span>
                  </div>
                </div>

                {/* Key Reduction Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#8B9AA8]">Risk Points Reduced</span>
                    <div className="text-xl font-mono font-bold text-[#2FA37C]">
                      -{result.risk_reduction_points.toFixed(1)} pts
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#8B9AA8]">Local UHI Drop</span>
                    <div className="text-xl font-mono font-bold text-[#2FA37C]">
                      -{result.estimated_uhi_reduction_c.toFixed(1)}°C
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#8B9AA8]">WBGT Mitigation</span>
                    <div className="text-xl font-mono font-bold text-[#2FA37C]">
                      {result.simulated_wbgt_c.toFixed(1)}°C
                    </div>
                  </div>
                </div>

                {/* Population Protected Callout */}
                <div className="p-4 rounded-xl bg-[#2FA37C]/10 border border-[#2FA37C]/25 flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#2FA37C] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Protected Vulnerable Population: ~{result.population_protected_count.toLocaleString()} Citizens
                    </span>
                    <p className="text-xs text-[#8B9AA8] mt-1 leading-relaxed">
                      Combined reflective cool roofs and early morning work shifts mitigate severe heat exhaustion triggers across informal settlements.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-center p-8 text-[#8B9AA8] space-y-3">
                <Sliders className="w-12 h-12 opacity-30 text-[#9B6FD8]" />
                <h4 className="text-sm font-semibold text-white">Simulation Engine Ready</h4>
                <p className="text-xs max-w-xs">
                  Configure the intervention sliders on the left and click 'Execute What-If Simulation' to evaluate projected outcomes.
                </p>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
