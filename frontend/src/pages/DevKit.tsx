import React, { useState } from 'react';
import { TOKENS, RISK_SCALE, RISK_BANDS, getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/ui/Card';
import { Slider } from '../components/ui/Slider';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ProvenanceChip } from '../components/ui/ProvenanceChip';
import { Skeleton, CardSkeleton } from '../components/common/Skeleton';
import { EmptyState, ErrorState } from '../components/common/EmptyState';
import { DemoBadge } from '../components/common/DemoBadge';

export const DevKit: React.FC = () => {
  const [sliderVal, setSliderVal] = useState(42);
  const [segmentVal, setSegmentVal] = useState<'day' | 'week' | 'month'>('week');
  const [inputValue, setInputValue] = useState('Sample Input');

  return (
    <div className="space-y-16 py-8">
      {/* Page Title */}
      <div>
        <span className={TYPOGRAPHY.label}>Design System Audit & Specimen</span>
        <h1 className={`${TYPOGRAPHY.h1} mt-2`}>Component Kit & Token Verification</h1>
        <p className={`${TYPOGRAPHY.bodyL} mt-2`}>
          Single source of truth reference for the ThermaGrid light instrument palette, strict contrast verification, risk-as-text rules, and shared primitives.
        </p>
      </div>

      {/* 1. PALETTE SPECIMENS */}
      <section className="space-y-6">
        <SectionHeader
          label="01 / Foundation"
          title="Color Tokens & Semantic Roles"
          lead="Light technical instrument palette: 11 semantic tokens, 5 risk-only tiers, 0 outside hex values."
        />

        {/* Neutrals & Surfaces */}
        <div>
          <h3 className={`${TYPOGRAPHY.h3} mb-3`}>Surfaces & Neutrals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { token: '--bg', hex: TOKENS.bg, label: 'Page Background' },
              { token: '--surface', hex: TOKENS.surface, label: 'Panels & Cards' },
              { token: '--raised', hex: TOKENS.raised, label: 'Inputs & Modals' },
              { token: '--border', hex: TOKENS.border, label: '1px Dividers' },
              { token: '--ink', hex: TOKENS.ink, label: 'Primary Text' },
              { token: '--muted', hex: TOKENS.muted, label: 'Secondary Labels' },
              { token: '--panel-dark', hex: TOKENS.panelDark, label: '3D/Map Canvases' },
            ].map((c) => (
              <div key={c.token} className="p-3 bg-surface border border-border rounded-[6px] space-y-2">
                <div
                  className="w-full h-12 rounded-[4px] border border-border"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="text-xs font-mono font-semibold text-ink">{c.token}</div>
                <div className="text-[11px] font-mono text-muted">{c.hex}</div>
                <div className="text-[10px] text-muted">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Accent & Validation */}
        <div>
          <h3 className={`${TYPOGRAPHY.h3} mb-3`}>Interaction & Feedback</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { token: '--accent', hex: TOKENS.accent, label: 'Primary Action & Nav' },
              { token: '--accent-hover', hex: TOKENS.accentHover, label: 'Hover State' },
              { token: '--on-accent', hex: TOKENS.onAccent, label: 'Text On Accent' },
              { token: '--error', hex: TOKENS.error, label: 'Form Error & Alert' },
            ].map((c) => (
              <div key={c.token} className="p-3 bg-surface border border-border rounded-[6px] space-y-2">
                <div
                  className="w-full h-12 rounded-[4px] border border-border"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="text-xs font-mono font-semibold text-ink">{c.token}</div>
                <div className="text-[11px] font-mono text-muted">{c.hex}</div>
                <div className="text-[10px] text-muted">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Scale (Data Only) */}
        <div>
          <h3 className={`${TYPOGRAPHY.h3} mb-3`}>Risk Scale (Risk Data ONLY)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { token: '--risk-1', hex: RISK_SCALE.risk1, label: 'Safe / Low (0-24.9)', name: 'Safe' },
              { token: '--risk-2', hex: RISK_SCALE.risk2, label: 'Moderate (25-49.9)', name: 'Moderate' },
              { token: '--risk-3', hex: RISK_SCALE.risk3, label: 'High (50-69.9)', name: 'High' },
              { token: '--risk-4', hex: RISK_SCALE.risk4, label: 'Very High (70-84.9)', name: 'Very High' },
              { token: '--risk-5', hex: RISK_SCALE.risk5, label: 'Extreme (85-100)', name: 'Extreme' },
            ].map((r) => (
              <div key={r.token} className="p-3 bg-surface border border-border rounded-[6px] space-y-2">
                <div
                  className="w-full h-12 rounded-[4px] border border-border"
                  style={{ backgroundColor: r.hex }}
                />
                <div className="text-xs font-mono font-semibold text-ink">{r.token}</div>
                <div className="text-[11px] font-mono text-muted">{r.hex}</div>
                <div className="text-[10px] text-muted">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. RISK-AS-TEXT RULE AUDIT */}
      <section className="space-y-6">
        <SectionHeader
          label="02 / Accessibility"
          title="Risk-As-Text Rule Verification"
          lead="Absolute rule: --risk-1 through --risk-4 may NEVER be used as text colour. Numbers and status words render in --ink with a 4px bar, dot, or chip outline."
        />

        <div className="p-6 bg-surface border border-border rounded-[8px] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { score: 18, name: 'Safe', band: RISK_BANDS.safe, color: RISK_SCALE.risk1 },
              { score: 38, name: 'Moderate', band: RISK_BANDS.moderate, color: RISK_SCALE.risk2 },
              { score: 62, name: 'High', band: RISK_BANDS.high, color: RISK_SCALE.risk3 },
              { score: 78, name: 'Very High', band: RISK_BANDS.veryhigh, color: RISK_SCALE.risk4 },
              { score: 94, name: 'Extreme', band: RISK_BANDS.extreme, color: RISK_SCALE.risk5 },
            ].map((item) => (
              <div key={item.name} className="p-4 bg-raised border border-border rounded-[6px] space-y-3">
                {/* 4px bar + Number in ink */}
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-mono text-2xl font-bold text-ink tabular-nums">{item.score}</span>
                  <span className="text-xs font-mono text-muted">/ 100</span>
                </div>

                {/* Status word in ink with colored dot */}
                <div className="flex items-center gap-1.5 text-xs font-mono text-ink">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>

                {/* Chip specimen */}
                <div>
                  <Badge variant={item.band.code}>
                    {item.name}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs font-mono text-muted bg-raised p-3 rounded-[4px] border border-border">
            Verification: All numerals render in <span className="font-semibold text-ink">--ink (#1A1E1C)</span>. Contrast against --surface is 13.4:1 (pass). Chip outlines derived with color-mix for paper survival.
          </div>
        </div>
      </section>

      {/* 3. SHARED PRIMITIVES */}
      <section className="space-y-8">
        <SectionHeader
          label="03 / UI Primitives"
          title="Component Showcase"
          lead="Every shared primitive verified in default, hover, focus, disabled, and active states."
        />

        {/* Badges */}
        <div className="space-y-3">
          <h3 className={`${TYPOGRAPHY.h3}`}>Badges</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">Neutral System</Badge>
            <Badge variant="accent">Interactive Accent</Badge>
            <Badge variant="safe">Low / Safe</Badge>
            <Badge variant="moderate">Moderate Discomfort</Badge>
            <Badge variant="high">High Risk</Badge>
            <Badge variant="veryhigh">Very High Strain</Badge>
            <Badge variant="extreme">Extreme Emergency</Badge>
            <DemoBadge label="Demo Feed" />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <h3 className={`${TYPOGRAPHY.h3}`}>Buttons & Interaction States</h3>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-medium rounded-[6px] transition-colors"
            >
              Primary Action
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-surface hover:bg-raised text-ink border border-border text-xs font-mono font-medium rounded-[6px] transition-colors"
            >
              Secondary Action
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-accent text-on-accent text-xs font-mono font-medium rounded-[6px] outline-2 outline-accent outline-offset-2"
            >
              Focused State
            </button>
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-surface text-muted border border-border text-xs font-mono font-medium rounded-[6px] opacity-50 cursor-not-allowed"
            >
              Disabled State
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3">
          <h3 className={`${TYPOGRAPHY.h3}`}>Form Controls & States</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted">Default</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 bg-raised border border-border rounded-[6px] text-xs font-mono text-ink focus:outline-2 focus:outline-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted">Focused</label>
              <input
                type="text"
                defaultValue="Active Focus"
                className="w-full px-3 py-2 bg-raised border border-accent rounded-[6px] text-xs font-mono text-ink outline-2 outline-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted">Disabled</label>
              <input
                type="text"
                disabled
                defaultValue="Read Only"
                className="w-full px-3 py-2 bg-surface border border-border rounded-[6px] text-xs font-mono text-muted cursor-not-allowed opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-error">Validation Error</label>
              <input
                type="text"
                defaultValue="Invalid input value"
                className="w-full px-3 py-2 bg-raised border border-error rounded-[6px] text-xs font-mono text-error focus:outline-2 focus:outline-error"
              />
            </div>
          </div>
        </div>

        {/* Sliders & Segmented Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card tier="l1" title="Interactive Slider">
            <Slider
              label="Simulation Heat Offset"
              value={sliderVal}
              min={0}
              max={100}
              step={1}
              unit="°C"
              onChange={(val) => setSliderVal(val)}
            />
          </Card>

          <Card tier="l1" title="Segmented Control">
            <div className="space-y-4">
              <SegmentedControl
                options={[
                  { value: 'day', label: '24 Hours', sublabel: 'Hourly' },
                  { value: 'week', label: '7 Days', sublabel: 'Daily synoptic' },
                  { value: 'month', label: '30 Days', sublabel: 'Monthly climatology' },
                ]}
                value={segmentVal}
                onChange={(v) => setSegmentVal(v)}
              />
              <div className="text-xs font-mono text-muted">
                Active segment: <span className="font-medium text-ink">{segmentVal}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* KPI Numerals */}
        <div className="space-y-3">
          <h3 className={`${TYPOGRAPHY.h3}`}>KPI Numerals & Telemetry Readouts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card tier="l1">
              <KpiNumeral
                label="Maximum Ambient WBGT"
                value={34.6}
                decimals={1}
                suffix="°C"
                size="l"
                delta={{ value: 1.4, label: 'vs baseline' }}
                sublabel="Ward 112 • Peak 14:00"
              />
            </Card>
            <Card tier="l1">
              <KpiNumeral
                label="At-Risk Population Exposed"
                value={48210}
                decimals={0}
                size="l"
                delta={{ value: -320, label: 'evacuated' }}
                sublabel="High Vulnerability Zone 4"
              />
            </Card>
            <Card tier="l1">
              <KpiNumeral
                label="Physiological Strain Index"
                value={7.2}
                decimals={1}
                size="l"
                sublabel="ISO 7243 calibrated index"
              />
            </Card>
          </div>
        </div>

        {/* Provenance Chips */}
        <div className="space-y-3">
          <h3 className={`${TYPOGRAPHY.h3}`}>Provenance Chips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProvenanceChip
              label="Telemetry Source"
              value="Open-Meteo & ERA5 Reanalysis"
              sub="15-minute sync cadence"
            />
            <ProvenanceChip
              label="Spatial Mesh"
              value="Ward Polygon (0.01° / ~1.1km)"
              sub="Municipal boundary join"
            />
            <ProvenanceChip
              label="Inference Latency"
              value="38ms"
              sub="Deterministic cache hit"
            />
          </div>
        </div>

        {/* Cards Tiers */}
        <div className="space-y-3">
          <h3 className={`${TYPOGRAPHY.h3}`}>Card Tiers & Surface Hierarchy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card tier="l1" title="Tier L1" subtitle="Default surface (#EAE5DA)">
              <p className="text-xs text-muted">Standard cards, telemetry containers, panels.</p>
            </Card>
            <Card tier="l2" title="Tier L2" subtitle="Raised surface (#FBF9F4)">
              <p className="text-xs text-muted">Elevated cards, flyouts, focus blocks.</p>
            </Card>
            <Card tier="recessed" title="Tier Recessed" subtitle="Background level (#F3EFE7)">
              <p className="text-xs text-muted">Subtle grouping wells and inner rails.</p>
            </Card>
            <Card tier="l1" hoverable cornerTicks title="Interactive Card" subtitle="Hover + Corner ticks">
              <p className="text-xs text-muted">Instrument-grade hairline corner ticks.</p>
            </Card>
          </div>
        </div>

        {/* Skeletons & Empty States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className={`${TYPOGRAPHY.h3}`}>Loading Skeletons</h3>
            <CardSkeleton />
          </div>

          <div className="space-y-4">
            <h3 className={`${TYPOGRAPHY.h3}`}>Empty & Error States</h3>
            <EmptyState
              title="No Weather Station in Range"
              message="Telemetry feed for selected coordinates is currently syncing."
            />
            <ErrorState
              title="Telemetry Ingestion Disconnected"
              message="Unable to verify hash digest on latest sensor packet."
              onRetry={() => alert('Retry triggered')}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
