import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  Calendar,
  Compass,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RiskBadge } from '../components/risk/RiskBadge';
import { TrendChart } from '../components/charts/TrendChart';
import { ForecastConfidenceChart } from '../components/charts/ForecastConfidenceChart';
import { TerrainFlythrough } from '../three/scenes/TerrainFlythrough';
import { CoolingCentresList } from '../components/cooling/CoolingCentresList';
import { DemoBadge } from '../components/common/DemoBadge';
import { useWardDetails } from '../hooks/useWards';
import { useCurrentRisk } from '../hooks/useRisk';
import { useRiskForecast } from '../hooks/useForecast';
import { useThermalHistory } from '../hooks/useThermal';
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import { formatNumber } from '../utils/format';

export const LocationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const locationId = Number(id) || 1;

  const { data: ward } = useWardDetails(locationId);
  const { data: risk } = useCurrentRisk(locationId);
  const { data: forecast } = useRiskForecast(locationId);
  const { data: history } = useThermalHistory(locationId, 3);

  const [showTerrain, setShowTerrain] = useState(false);

  const riskScore = risk?.risk_score ?? 84;
  const band = getRiskBand(riskScore);

  // 6 Mono Stats for Heat Fingerprint
  const fingerprintStats = [
    { label: 'Avg Thermal Stress', value: `${formatNumber(riskScore * 0.88, 1)} HTSI`, sub: 'Seasonal Baseline' },
    { label: 'Extreme Days / Year', value: '38 Days', sub: 'WBGT ≥ 32.2°C' },
    { label: 'Peak Stress Month', value: 'May', sub: 'Pre-Monsoon Solar' },
    { label: 'Peak Stress Hours', value: '13:00 – 16:30', sub: 'Maximum Daily Cycle' },
    { label: 'Microclimate Trend', value: '+1.8°C', sub: 'Per Decade UHI' },
    { label: 'Hotspot Status', value: 'Tier-1 Critical', sub: 'Informal Canopy Deficit' },
  ];

  // Interventions scoped to this ward
  const scopedInterventions = [
    {
      id: 1,
      title: 'Deploy Shaded Hydration Station at Central Naka',
      type: 'Immediate Relief',
      impact: 'Reduces worker dehydration by 42%',
      cost: '₹45,000 / week',
      status: 'Active',
    },
    {
      id: 2,
      title: 'Emergency Mobile Water Tanker Routing (Govandi)',
      type: 'Municipal Dispatch',
      impact: 'Buffers indoor water cooling deficit for 8,500 residents',
      cost: '₹12,000 / day',
      status: 'Scheduled',
    },
    {
      id: 3,
      title: 'High-Albedo Cool Roof Coating for Informal Settlement Clusters',
      type: 'Structural Retrofit',
      impact: 'Lowers indoor temperatures by 3.2°C to 4.5°C',
      cost: '₹3,20,000',
      status: 'Under Review',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Back button & Header */}
      <div className="space-y-3 pb-4 border-b border-border">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-ink font-bold px-2 py-0.5 rounded bg-surface border border-border">
                {ward?.ward_code || 'WARD'}
              </span>
              <h1 className={`${TYPOGRAPHY.h1} text-ink`}>
                {ward?.ward_name || 'Select a ward'}
              </h1>
              {risk?.is_demo && <DemoBadge label={risk.demo_label} />}
            </div>
            <p className="text-xs font-mono text-muted mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted" />
              {ward?.district || 'Mumbai Suburban'}, {ward?.city || 'Mumbai'}, {ward?.state || 'Maharashtra'}
            </p>
          </div>

          {/* Numeral-L Score + Band Pill */}
          <div className="flex items-center gap-4">
            <RiskBadge score={riskScore} size="lg" />
            <div className="text-right">
              <KpiNumeral
                value={riskScore}
                size="l"
                color={band.color}
                suffix="/100"
              />
              <span className="text-[10px] font-mono text-muted block">
                Composite HTSI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Heat Fingerprint: 6 Mono Stats */}
      <section className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.10em] text-muted">
          Microclimate Heat Fingerprint
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {fingerprintStats.map((stat, i) => (
            <div
              key={i}
              className="p-3.5 rounded-[10px] bg-surface border border-border space-y-1 font-mono"
            >
              <span className="text-[10px] uppercase text-muted block truncate">
                {stat.label}
              </span>
              <span className="text-sm font-bold text-ink block tabular-nums">
                {stat.value}
              </span>
              <span className="text-[10px] text-muted block truncate">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Side-by-Side 7/5 Split: History Daily Pattern Chart vs Forecast Uncertainty Chart */}
      <section className="space-y-4">
        <SectionHeader
          label="Temporal divergence & predictive uncertainty"
          title="Microclimate Trajectory & Risk Forecast Cone"
          lead="Past 72-hour observed temperature alongside projected 48-hour heat forecast."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* History Chart (7 cols) */}
          <div className="lg:col-span-7">
            <Card
              tier="l1"
              title="72-Hour Daily Pattern Thermal Curves"
              subtitle="Observed WBGT, UTCI, and Heat Index vs Dry-Bulb Air Temperature"
            >
              {history?.items ? (
                <TrendChart items={history.items} height={320} />
              ) : (
                <div className="h-72 flex items-center justify-center text-xs font-mono text-muted">
                  Loading thermal history...
                </div>
              )}
            </Card>
          </div>

          {/* Forecast Chart (5 cols) */}
          <div className="lg:col-span-5">
            <Card
              tier="l1"
              title="Predictive Risk Horizon"
              subtitle="Forecast with 80% empirical confidence bounds"
            >
              {forecast?.items ? (
                <ForecastConfidenceChart items={forecast.items} />
              ) : (
                <div className="h-72 flex items-center justify-center text-xs font-mono text-muted">
                  Loading forecast cone...
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Optional 3D Terrain / UHI Flythrough */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            label="TOPOLOGICAL HEAT FIELD"
            title="Urban Canopy Heat Island 3D Model"
            lead="Topographic elevation model textured with continuous thermal infrared gradient."
            className="mb-0"
          />
          <button
            type="button"
            onClick={() => setShowTerrain(!showTerrain)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink transition-all shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-accent" />
            <span>{showTerrain ? 'Hide 3D Shader' : 'Load 3D Shader'}</span>
          </button>
        </div>

        {showTerrain && (
          <div className="rounded-[14px] border border-border overflow-hidden">
            <TerrainFlythrough height={440} />
          </div>
        )}
      </section>

      {/* 4. Targeted Municipal Interventions Scoped to Ward */}
      <section className="space-y-4">
        <SectionHeader
          label="LOCAL INTERVENTION DIRECTIVES"
          title={`Active Heat Action Interventions (${ward?.ward_name})`}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scopedInterventions.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-[12px] bg-surface border border-border space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] uppercase font-bold text-accent">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-ink bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))] px-2 py-0.5 rounded-full font-bold">
                    {item.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-ink font-display">{item.title}</h4>
                <p className="text-xs text-muted">{item.impact}</p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
                <span>Est. Budget:</span>
                <span className="text-ink font-semibold">{item.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Usable Cooling Centres in Proximity */}
      <section className="space-y-4">
        <CoolingCentresList city={ward?.city || 'Mumbai'} />
      </section>
    </div>
  );
};
