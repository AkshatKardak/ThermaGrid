import React, { useState } from 'react';
import { HardHat, Sun, Umbrella, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { WorkRestAdvisory } from '../components/risk/WorkRestAdvisory';
import { WorkerShiftCard } from '../components/worker/WorkerShiftCard';
import { DemoBadge } from '../components/common/DemoBadge';
import { useCurrentThermal } from '../hooks/useThermal';
import { useCurrentRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

type Occupation = 'construction' | 'delivery' | 'vendor' | 'traffic' | 'agriculture';
type Intensity = 'met3' | 'met4' | 'met5' | 'met6';
type Exposure = 'sun' | 'partial' | 'shade';
type ShiftDuration = '4h' | '6h' | '8h';

export const WorkerRisk: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: thermal } = useCurrentThermal(selectedLocationId);
  const { data: risk } = useCurrentRisk(selectedLocationId);

  // Form State using Segmented Controls
  const [occupation, setOccupation] = useState<Occupation>('construction');
  const [intensity, setIntensity] = useState<Intensity>('met5');
  const [exposure, setExposure] = useState<Exposure>('sun');
  const [shiftHours, setShiftHours] = useState<ShiftDuration>('8h');

  const selectedWard = wards?.find((w) => w.id === selectedLocationId) || wards?.[0];

  // Base ambient scores
  const generalScore = risk?.risk_score ?? 74;
  const baseWbgt = thermal?.wbgt_c ?? 29.8;

  // Work adjustment computation
  const metBonus = intensity === 'met6' ? 14 : intensity === 'met5' ? 10 : intensity === 'met4' ? 6 : 2;
  const sunBonus = exposure === 'sun' ? 8 : exposure === 'partial' ? 4 : 0;
  const shiftBonus = shiftHours === '8h' ? 5 : shiftHours === '6h' ? 3 : 0;

  const totalDelta = metBonus + sunBonus + shiftBonus;
  const workAdjustedScore = Math.min(100, Math.round(generalScore + totalDelta));
  const effectiveWbgt = +(baseWbgt + (exposure === 'sun' ? 2.5 : exposure === 'partial' ? 1.0 : 0.0) + (intensity === 'met6' ? 2.0 : 1.0)).toFixed(1);

  const generalBand = getRiskBand(generalScore);
  const workBand = getRiskBand(workAdjustedScore);

  return (
    <div className="space-y-12">
      {/* Header & Ward Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`${TYPOGRAPHY.h1} text-ink`}>
              Occupational Heat Strain & Work-Rest Protocols
            </h1>
            {thermal?.is_demo && <DemoBadge label={thermal.demo_label} />}
          </div>
          <p className={TYPOGRAPHY.bodyL}>
            Calibrated ISO 7243 screening models for outdoor physical labourers, Gig-workers, and construction trades in {selectedWard?.ward_name || selectedCity}.
          </p>
        </div>

        {/* Ward Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="worker-ward" className="text-xs font-mono text-muted">
            Ward:
          </label>
          <select
            id="worker-ward"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(Number(e.target.value))}
            className="bg-surface text-ink text-xs font-mono px-3 py-2 rounded-[8px] border border-border outline-none cursor-pointer focus:border-accent"
          >
            {wards?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.ward_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Three-Step Form as Segmented Controls */}
      <Card
        tier="l1"
        title="Occupational Profile & Exposure Parameters"
        subtitle="Step 1 to 4: Define metabolic work rate and direct solar irradiance"
        cornerTicks
      >
        <div className="space-y-6">
          {/* Step 1: Occupation */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-[0.10em] text-muted flex items-center gap-2">
              <HardHat className="w-4 h-4 text-muted" />
              Step 1: Trade / Occupation
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'construction', label: 'Construction Worker', sub: 'Masonry / Steel' },
                { id: 'delivery', label: 'Gig Courier', sub: 'Two-wheeler / Logistics' },
                { id: 'vendor', label: 'Street Vendor', sub: 'Pavement / Kiosk' },
                { id: 'traffic', label: 'Traffic Police', sub: 'Road Junction' },
                { id: 'agriculture', label: 'Agricultural / Grounds', sub: 'Field Labor' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOccupation(opt.id as Occupation)}
                  className={`px-3.5 py-2 rounded-[8px] text-xs font-mono text-left transition-all ${
                    occupation === opt.id
                      ? 'bg-surface text-ink border border-accent font-semibold'
                      : 'bg-raised text-muted border border-border hover:text-ink'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-muted mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-border">
            {/* Step 2: Intensity MET 3-6 */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
                Step 2: Exertion Intensity
              </label>
              <SegmentedControl<Intensity>
                options={[
                  { value: 'met3', label: 'Light', sublabel: '3.0 MET' },
                  { value: 'met4', label: 'Moderate', sublabel: '4.2 MET' },
                  { value: 'met5', label: 'Heavy', sublabel: '5.5 MET' },
                  { value: 'met6', label: 'Extreme', sublabel: '6.8 MET' },
                ]}
                value={intensity}
                onChange={setIntensity}
                className="w-full flex"
              />
            </div>

            {/* Step 3: Exposure Sun / Shade */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
                Step 3: Direct Solar Exposure
              </label>
              <SegmentedControl<Exposure>
                options={[
                  { value: 'sun', label: 'Direct Sun', sublabel: '+3.5°C Rad' },
                  { value: 'partial', label: 'Partial', sublabel: '+1.2°C Rad' },
                  { value: 'shade', label: 'Covered', sublabel: 'Ambient' },
                ]}
                value={exposure}
                onChange={setExposure}
                className="w-full flex"
              />
            </div>

            {/* Step 4: Shift Duration */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
                Step 4: Shift Window
              </label>
              <SegmentedControl<ShiftDuration>
                options={[
                  { value: '4h', label: '4 Hours', sublabel: 'Morning' },
                  { value: '6h', label: '6 Hours', sublabel: 'Split' },
                  { value: '8h', label: '8 Hours', sublabel: 'Full Shift' },
                ]}
                value={shiftHours}
                onChange={setShiftHours}
                className="w-full flex"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Output: Work-Adjusted Score vs General Score as 2 Large Numerals with Delta Chip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* General Population Score */}
        <div className="p-6 rounded-[14px] bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
              Baseline General Exposure
            </span>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${generalBand.color} 15%, var(--surface))`,
                color: generalBand.code === 'extreme' ? 'var(--risk-5)' : 'var(--ink)',
                border: `1px solid color-mix(in srgb, ${generalBand.color} ${generalBand.code === 'moderate' ? '60%' : '55%'}, var(--ink))`,
              }}
            >
              {generalBand.label}
            </span>
          </div>

          <KpiNumeral
            value={generalScore}
            size="xl"
            color={generalBand.color}
            suffix="/100"
            sublabel="Standard resting ambient population strain"
          />

          <div className="text-xs font-mono text-muted border-t border-border pt-3 flex justify-between">
            <span>Ambient Dry-Bulb: {risk?.temperature_c?.toFixed(1) || '37.0'}°C</span>
            <span>WBGT: {baseWbgt.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Work-Adjusted Score with Delta Chip */}
        <div className="p-6 rounded-[14px] bg-raised border border-border space-y-4 relative corner-ticks">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-[0.10em] text-ink font-semibold">
              Work-Adjusted Thermal Strain
            </span>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${workBand.color} 15%, var(--surface))`,
                color: workBand.code === 'extreme' ? 'var(--risk-5)' : 'var(--ink)',
                border: `1px solid color-mix(in srgb, ${workBand.color} ${workBand.code === 'moderate' ? '60%' : '55%'}, var(--ink))`,
              }}
            >
              {workBand.label}
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <KpiNumeral
              value={workAdjustedScore}
              size="xl"
              color={workBand.color}
              suffix="/100"
              delta={{ value: totalDelta, label: 'Work Excess' }}
            />
          </div>

          <div className="text-xs font-mono text-ink border-t border-border pt-3 flex justify-between">
            <span>Effective Metabolic WBGT: {effectiveWbgt}°C</span>
            <span className="font-bold">Delta: +{totalDelta} HTSI</span>
          </div>
        </div>
      </div>

      {/* 3. Work/Rest Schedule Generator & Hydration Cadence */}
      <WorkRestAdvisory
        wbgt={effectiveWbgt}
        category={workBand.label}
        guidance={
          effectiveWbgt >= 32.2
            ? 'Mandatory cessation of strenuous manual outdoor labor. Shift work to early morning (05:30 - 09:30) or nighttime hours. Activate mandatory shaded hydration cooling camps.'
            : effectiveWbgt >= 30.0
            ? 'Strict 15m work / 45m shaded rest cycle per hour. Provide chilled ORS electrolyte fluids. Monitor workers for heat syncope, dizziness, or cessation of sweating.'
            : 'Implement 30m work / 30m rest cycle. Continuous access to shaded hydration stations.'
        }
      />

      {/* P1-6 Feature: Official Printable Worker Shift Card */}
      <section className="space-y-4">
        <WorkerShiftCard locationId={selectedLocationId} />
      </section>

      {/* 4. Prominent Legal & Medical Disclaimer */}
      <div className="p-5 rounded-[12px] bg-surface border border-border flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="text-xs text-muted space-y-1">
          <span className="font-mono font-bold text-ink uppercase tracking-wider block">
            Occupational Health & Safety Disclaimer (ISO 7243:2017)
          </span>
          <p className="leading-relaxed">
            This screening module calculates thermal strain based on ISO 7243:2017 screening thresholds and the National Disaster Management Authority (NDMA) Heat Wave Guidelines. It is intended as an administrative decision-support tool for contractor shift planning, not an individual clinical diagnosis. In case of acute symptoms of heat stroke (confusion, body temperature &gt; 40°C, delirium), immediately dial 108.
          </p>
        </div>
      </div>
    </div>
  );
};
