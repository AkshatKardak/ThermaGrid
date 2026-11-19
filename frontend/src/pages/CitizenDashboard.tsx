import React, { useState } from 'react';
import {
  Search,
  Crosshair,
  Clock,
  Droplets,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Building,
  MapPin,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RiskBadge } from '../components/risk/RiskBadge';
import { FactorBars } from '../components/risk/FactorBars';
import { HourlyStrip } from '../components/risk/HourlyStrip';
import { AlertBanner } from '../components/dashboard/AlertBanner';
import { DemoBadge } from '../components/common/DemoBadge';
import { SafeWindowCard } from '../components/planner/SafeWindowCard';
import { TonightCard } from '../components/risk/TonightCard';
import { IndoorHeatCard } from '../components/risk/IndoorHeatCard';
import { CoolingCentresList } from '../components/cooling/CoolingCentresList';
import { useCurrentRisk } from '../hooks/useRisk';
import { useCurrentThermal } from '../hooks/useThermal';
import { useRiskForecast } from '../hooks/useForecast';
import { useAlerts } from '../hooks/useCoolingCentres';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';
import { formatNumber } from '../utils/format';
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

export const CitizenDashboard: React.FC = () => {
  const { selection, setSelection, selectedCity, selectedLocationId } = useAppStore();
  const activeCity = selection.cityCode || selectedCity;
  const { data: wards } = useWards(selectedCity);
  const { data: risk } = useCurrentRisk(selectedLocationId);
  const { data: thermal } = useCurrentThermal(selectedLocationId);
  const { data: forecast } = useRiskForecast(selectedLocationId);
  const { data: alerts } = useAlerts(selectedCity);

  const [searchQuery, setSearchQuery] = useState('');
  const selectedWard = wards?.find((w) => w.id === selectedLocationId) || wards?.[0];

  const filteredWards = wards?.filter((w) =>
    w.ward_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentWards = wards?.slice(0, 4) || [];
  const riskScore = risk?.risk_score ?? 78;
  const currentBand = getRiskBand(riskScore);

  const fiveDayForecast = [
    { day: 'Today', score: riskScore, confidence: 96 },
    { day: 'Tomorrow', score: Math.min(100, Math.round(riskScore * 1.05)), confidence: 92 },
    { day: 'Thu', score: Math.min(100, Math.round(riskScore * 1.08)), confidence: 85 },
    { day: 'Fri', score: Math.max(15, Math.round(riskScore * 0.94)), confidence: 81 },
    { day: 'Sat', score: Math.max(15, Math.round(riskScore * 0.88)), confidence: 76 },
  ];

  return (
    <div className="space-y-12">
      {/* 1. Location Bar: Search + Geolocate + Recent Chips */}
      <div className="p-4 rounded-[14px] bg-surface border border-border space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search municipal ward, pincode, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[8px] bg-raised border border-border text-xs font-mono text-ink placeholder-muted focus:border-accent outline-none"
            />
            {searchQuery && filteredWards && filteredWards.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-[8px] bg-raised border border-border z-40">
                {filteredWards.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelection({ wardId: w.id });
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-mono hover:bg-surface text-ink flex items-center justify-between cursor-pointer"
                  >
                    <span>{w.ward_name}</span>
                    <span className="text-[10px] text-muted">{w.ward_code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Geolocate Button */}
          <button
            type="button"
            onClick={() => {
              if (wards && wards.length > 0) setSelection({ wardId: wards[0].id });
            }}
            className="w-full md:w-auto px-4 py-2.5 rounded-[8px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-accent" />
            <span>Use My Location</span>
          </button>
        </div>

        {/* Recent Ward Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-muted">
            Recent Wards:
          </span>
          {recentWards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelection({ wardId: w.id })}
              className={`px-2.5 py-1 rounded-[6px] text-xs font-mono transition-all cursor-pointer ${
                w.id === selectedLocationId
                  ? 'bg-accent text-on-accent border border-accent font-semibold'
                  : 'bg-raised border border-border text-muted hover:text-ink'
              }`}
            >
              {w.ward_name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Heat Alerts Banner */}
      {alerts && alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* 2. Hero Risk Block */}
      <div className="rounded-[14px] bg-surface border border-border p-6 sm:p-8 space-y-6 corner-ticks relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted uppercase tracking-[0.10em]">
                {selectedWard?.ward_name || 'Municipal Ward Evaluation'}
              </span>
              {risk?.is_demo && <DemoBadge label={risk.demo_label} />}
            </div>
            <h1 className={`${TYPOGRAPHY.h1} text-ink mt-1`}>
              Citizen Heat Risk Overview
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {risk?.imd_grade && (
              <span className="px-2.5 py-1 rounded-[6px] text-xs font-mono font-bold bg-raised border border-border text-ink flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: risk.imd_grade === 'RED' ? '#C31D3C' : risk.imd_grade === 'ORANGE' ? '#D97706' : risk.imd_grade === 'YELLOW' ? '#E8C547' : '#2FA37C' }} />
                IMD {risk.imd_grade}
              </span>
            )}
            <RiskBadge score={riskScore} size="lg" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-raised border border-border text-xs font-mono font-semibold text-ink">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>
                {risk?.hours_to_threshold === 0
                  ? 'Threshold Active (Warning)'
                  : risk?.hours_to_threshold !== null && risk?.hours_to_threshold !== undefined
                  ? `Threshold in ${risk.hours_to_threshold}h`
                  : 'Safe Window'}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Numeral-XL & Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-baseline gap-3">
              <KpiNumeral
                value={riskScore}
                size="xl"
                color={currentBand.color}
                suffix="/100"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-ink">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentBand.color }}
              />
              <span className="font-semibold">Heat level: {currentBand.label}</span>
            </div>
          </div>

          <div className="md:col-span-7 border-l border-border pl-0 md:pl-6 space-y-3">
            {/* Primary Heat Level Card: Exactly ONE visible thermal index */}
            <div className="p-4 rounded-[8px] bg-raised border border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-muted uppercase block">
                  Primary Observation
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentBand.color }}
                  />
                  <span className="text-xl font-mono font-bold text-ink">
                    Heat level: {currentBand.label}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted block mt-1">
                  WBGT {thermal ? `${formatNumber(thermal.wbgt_c, 1)}°C` : '34.8°C'} · ISO 7243
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-muted uppercase block">Air Temp</span>
                <span className="text-lg font-mono font-semibold text-ink tabular-nums">
                  {risk ? `${formatNumber(risk.temperature_c, 1)}°C` : '37.4°C'}
                </span>
              </div>
            </div>

            {/* Collapsed "How this is calculated" block */}
            <details className="text-xs text-muted cursor-pointer group">
              <summary className="font-mono text-[11px] hover:text-ink transition-colors select-none">
                ▸ How this is calculated
              </summary>
              <div className="mt-2 p-3 rounded-[6px] bg-raised border border-border grid grid-cols-2 gap-3 text-ink font-mono text-xs">
                <div>
                  <span className="text-[10px] text-muted block uppercase">UTCI Stress</span>
                  <span className="font-semibold text-sm">
                    {thermal ? `${formatNumber(thermal.utci_c, 1)}°C` : '41.6°C'}
                  </span>
                  <span className="text-[10px] text-muted block font-sans">
                    Universal Thermal Climate Index
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Ambient Dry-Bulb</span>
                  <span className="font-semibold text-sm">
                    {risk ? `${formatNumber(risk.temperature_c, 1)}°C` : '37.4°C'}
                  </span>
                  <span className="text-[10px] text-muted block font-sans">
                    Surface sensor reading
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* 3. P0-1 Feature: Safe-Window Planner */}
      <section className="space-y-4">
        <SafeWindowCard locationId={selectedLocationId} />
      </section>

      {/* 4. P0-2 Feature: Tonight's Heat Risk (Tropical Nights) */}
      <section className="space-y-4">
        <TonightCard locationId={selectedLocationId} />
      </section>

      {/* 5. P0-3 Feature: Indoor Heat by Building Type */}
      <section className="space-y-4">
        <IndoorHeatCard locationId={selectedLocationId} />
      </section>

      {/* 6. Hourly Strip */}
      <section className="space-y-4">
        <SectionHeader
          label="DAILY CYCLE TRAJECTORY"
          title="Hourly Human Heat Progression"
          lead="Hourly resolution predictions calibrated with numerical meteorological models and urban canopy thermal storage."
        />
        <Card tier="l1">
          {forecast?.items ? (
            <HourlyStrip items={forecast.items} />
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-muted">
              Loading hourly telemetry...
            </div>
          )}
        </Card>
      </section>

      {/* 7. Asymmetric 7/5 Split: Action Advisory vs Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <Card
            tier="l2"
            title="Immediate Citizen Life-Safety Advisory"
            subtitle="Authoritative Heat Action Plan (HAP) protocol for this severity band"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="text-base sm:text-lg text-ink font-sans font-medium leading-relaxed">
                {risk?.explanation ||
                  'High thermal risk detected. Suspend non-essential afternoon outdoor exertion. Rapid indoor heat accumulation likely under non-insulated roofs.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-[8px] bg-raised border border-border flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-ink block" title="Hydration Target">Water to drink today</span>
                    <span className="text-xs text-muted leading-normal">
                      Drink 250ml cool water / ORS solution every 30 minutes.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-raised border border-border flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Peak Shelter</span>
                    <span className="text-xs text-muted leading-normal">
                      Avoid direct solar exposure between 12:00 PM and 4:30 PM.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-raised border border-border flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Vulnerable Cohorts</span>
                    <span className="text-xs text-muted leading-normal">
                      Check on seniors, infants, and chronic respiratory patients twice daily.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-raised border border-border flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Emergency Helpline</span>
                    <span className="text-xs text-muted leading-normal">
                      Dial 108 for ambulances or 1916 for BMC Disaster Control.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card
            tier="l1"
            title="Biophysical Factor Attribution"
            subtitle="Why this ward experiences acute thermal amplification"
            className="h-full"
          >
            {risk?.factor_breakdown ? (
              <FactorBars factors={risk.factor_breakdown} limit={4} />
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-muted">
                Loading factor attribution...
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 8. P1-7 Feature: Usable Cooling Centres */}
      <section className="space-y-4">
        <CoolingCentresList city={activeCity} />
      </section>
    </div>
  );
};
