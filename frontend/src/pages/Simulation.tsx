import React, { useState, useMemo } from 'react';
import { Sliders, AlertOctagon, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Slider } from '../components/ui/Slider';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RiskBadge } from '../components/risk/RiskBadge';
import { useWards } from '../hooks/useWards';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useAppStore } from '../store/useAppStore';
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

export const Simulation: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: allRisk } = useAllWardsRisk(selectedCity);

  // 4 Macro Climate Sliders with live mono values
  const [deltaTemp, setDeltaTemp] = useState<number>(+2.5); // °C
  const [deltaRh, setDeltaRh] = useState<number>(+10); // %
  const [deltaWind, setDeltaWind] = useState<number>(-0.8); // m/s
  const [deltaSolar, setDeltaSolar] = useState<number>(+125); // W/m²

  const selectedWard = wards?.find((w) => w.id === selectedLocationId) || wards?.[0];
  const currentWardRisk = allRisk?.find((w) => w.location_id === selectedLocationId)?.risk_score ?? 76;

  // Physics-modeled delta formula
  const deltaPoints = useMemo(() => {
    return Number(
      (
        deltaTemp * 2.8 +
        deltaRh * 0.35 -
        deltaWind * 2.2 +
        (deltaSolar / 100) * 1.6
      ).toFixed(1)
    );
  }, [deltaTemp, deltaRh, deltaWind, deltaSolar]);

  const projectedScore = Math.min(100, Math.max(0, Math.round(currentWardRisk + deltaPoints)));
  const currentBand = getRiskBand(currentWardRisk);
  const projectedBand = getRiskBand(projectedScore);

  // Before / After ward list with changed band detection
  const beforeAfterWards = useMemo(() => {
    if (!allRisk) return [];
    return allRisk.map((w) => {
      const proj = Math.min(100, Math.max(0, Math.round(w.risk_score + deltaPoints)));
      const bBefore = getRiskBand(w.risk_score);
      const bAfter = getRiskBand(proj);
      const isEscalated = bAfter.minScore > bBefore.minScore;
      const isExtreme = proj >= 85;

      return {
        ...w,
        projectedScore: proj,
        bandBefore: bBefore,
        bandAfter: bAfter,
        isEscalated,
        isExtreme,
      };
    });
  }, [allRisk, deltaPoints]);

  const additionalExtremeWards = beforeAfterWards.filter(
    (w) => w.isExtreme && w.risk_score < 85
  ).length;

  const handleReset = () => {
    setDeltaTemp(0);
    setDeltaRh(0);
    setDeltaWind(0);
    setDeltaSolar(0);
  };

  return (
    <div className="space-y-12">
      {/* Simulation Header & Prominent Sandbox Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`${TYPOGRAPHY.h1} text-ink`}>
              Microclimate Sensitivity & What-If Simulation Sandbox
            </h1>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] text-ink border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))] flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-risk-4" />
              SIMULATION — NOT A FORECAST
            </span>
          </div>
          <p className={TYPOGRAPHY.bodyL}>
            Interactive sensitivity sandbox. Stress-test urban thermal load under custom dry-bulb, humidity, wind shear, and solar irradiance anomalies.
          </p>
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-accent" />
          Reset to Baseline
        </button>
      </div>

      {/* Main Grid: 4 Sliders on Left vs Outcome Numerals on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 4 Sliders with Live Mono Values (6 cols) */}
        <div className="lg:col-span-6">
          <Card
            tier="l1"
            title="Macro Anomaly Parameter Sliders"
            subtitle="Perturb meteorological inputs to simulate heat wave extremes or sea-breeze buffer loss"
            cornerTicks
          >
            <div className="space-y-6 pt-2">
              {/* Slider 1: ΔT (Dry-Bulb Anomaly) */}
              <Slider
                label="ΔT (Dry-Bulb Temperature Anomaly)"
                value={deltaTemp}
                min={-4.0}
                max={+8.0}
                step={0.5}
                unit="°C"
                onChange={setDeltaTemp}
              />

              {/* Slider 2: ΔRH (Relative Humidity) */}
              <Slider
                label="ΔRH (Relative Humidity Anomaly)"
                value={deltaRh}
                min={-30}
                max={+30}
                step={2}
                unit="%"
                onChange={setDeltaRh}
              />

              {/* Slider 3: ΔWind (Wind Speed) */}
              <Slider
                label="ΔWind (Surface Wind Velocity)"
                value={deltaWind}
                min={-4.0}
                max={+4.0}
                step={0.2}
                unit=" m/s"
                onChange={setDeltaWind}
              />

              {/* Slider 4: ΔSolar (Direct Solar Irradiance) */}
              <Slider
                label="ΔSolar (Solar Irradiance Flux)"
                value={deltaSolar}
                min={-300}
                max={+300}
                step={25}
                unit=" W/m²"
                onChange={setDeltaSolar}
              />
            </div>
          </Card>
        </div>

        {/* Right: Current vs Projected Score + Additional Extreme Count-up (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Two Numerals Comparison with Animated Delta */}
          <Card
            tier="l2"
            title={`Simulated Ward Outcome (${selectedWard?.ward_name})`}
            subtitle="Comparing baseline observation against simulated biophysical response"
          >
            <div className="grid grid-cols-2 gap-6 p-4 rounded-[10px] bg-raised border border-border mb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-muted block">
                  Current Observed
                </span>
                <KpiNumeral
                  value={currentWardRisk}
                  size="l"
                  color={currentBand.color}
                  suffix="/100"
                />
                <span className="text-[11px] font-mono text-muted block">
                  {currentBand.label}
                </span>
              </div>

              <div className="space-y-1 border-l border-border pl-6">
                <span className="text-[11px] font-mono uppercase text-ink block font-semibold">
                  Projected Under Anomaly
                </span>
                <KpiNumeral
                  value={projectedScore}
                  size="l"
                  color={projectedBand.color}
                  suffix="/100"
                  delta={{
                    value: deltaPoints,
                    label: 'Net Impact',
                  }}
                />
                <span className="text-[11px] font-mono text-ink font-bold block">
                  {projectedBand.label}
                </span>
              </div>
            </div>

            {/* Additional Wards Crossing Extreme Threshold */}
            <div className="p-4 rounded-[10px] bg-[color-mix(in_srgb,var(--risk-4)_12%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))] flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider block">
                  Catastrophic Threshold Crossings
                </span>
                <span className="text-xs text-muted">
                  Wards projected to breach Extreme Hazard (&ge; 85 HTSI)
                </span>
              </div>
              <div className="text-right">
                <KpiNumeral
                  value={additionalExtremeWards}
                  size="m"
                  color="var(--ink)"
                  prefix="+"
                  suffix=" Wards"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom: Before / After Ward List with Changed Rows Highlighted */}
      <section className="space-y-4">
        <SectionHeader
          label="MUNICIPAL IMPACT SPREAD"
          title="Cross-Ward Before & After Comparative Matrix"
          lead="Every ward evaluated under the synthetic meteorological anomaly. Rows with risk escalation are illuminated."
        />

        <Card tier="l1">
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full border-collapse font-mono text-xs text-left">
              <thead className="sticky top-0 bg-surface z-10 border-b border-border text-[11px] uppercase tracking-[0.10em] text-muted">
                <tr>
                  <th className="py-2.5 px-3">Ward Name</th>
                  <th className="py-2.5 px-3 text-center">Baseline Score</th>
                  <th className="py-2.5 px-3 text-center">Projected Score</th>
                  <th className="py-2.5 px-3 text-center">Delta</th>
                  <th className="py-2.5 px-3 text-right">Escalation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {beforeAfterWards.map((w) => {
                  const isChanged = w.isEscalated;
                  return (
                    <tr
                      key={w.location_id}
                      className={`transition-colors ${
                        isChanged
                          ? 'bg-[color-mix(in_srgb,var(--risk-4)_10%,var(--surface))] border-l-2 border-l-risk-4'
                          : 'hover:bg-raised'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-sans font-semibold text-ink">{w.ward_name}</div>
                        <div className="text-[10px] text-muted">{w.ward_code}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold tabular-nums text-ink">
                          {w.risk_score.toFixed(0)}/100
                        </span>
                        <span className="text-[10px] text-muted block">
                          {w.bandBefore.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold tabular-nums text-ink">
                          {w.projectedScore.toFixed(0)}/100
                        </span>
                        <span className="text-[10px] text-muted block">
                          {w.bandAfter.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold">
                        <span className="text-ink">
                          {deltaPoints > 0 ? `+${deltaPoints}` : deltaPoints}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isChanged ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] text-ink border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]">
                            Escalated Band
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">Stable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
};
