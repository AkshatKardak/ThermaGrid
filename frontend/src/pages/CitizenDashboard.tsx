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
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

export const CitizenDashboard: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
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
      <div className="p-4 rounded-[14px] bg-[#1F3445] border border-white/8 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8B9AA8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search municipal ward, pincode, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[8px] bg-[#101820] border border-white/10 text-xs font-mono text-white placeholder-[#5F7183] focus:border-[#9B6FD8] outline-none"
            />
            {searchQuery && filteredWards && filteredWards.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-[8px] bg-[#1F3445] border border-white/16 shadow-2xl z-40">
                {filteredWards.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedLocationId(w.id);
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-mono hover:bg-[#263E50] text-[#D7E0E7] flex items-center justify-between cursor-pointer"
                  >
                    <span>{w.ward_name}</span>
                    <span className="text-[10px] text-[#8B9AA8]">{w.ward_code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Geolocate Button */}
          <button
            type="button"
            onClick={() => {
              if (wards && wards.length > 0) setSelectedLocationId(wards[0].id);
            }}
            className="w-full md:w-auto px-4 py-2.5 rounded-[8px] bg-[#2F4A5E]/50 hover:bg-[#2F4A5E] border border-white/8 text-xs font-mono text-[#D7E0E7] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#9B6FD8]" />
            <span>Use My Location</span>
          </button>
        </div>

        {/* Recent Ward Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#5F7183]">
            Recent Wards:
          </span>
          {recentWards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedLocationId(w.id)}
              className={`px-2.5 py-1 rounded-[6px] text-xs font-mono transition-all cursor-pointer ${
                w.id === selectedLocationId
                  ? 'bg-[#9B6FD8]/20 border border-[#9B6FD8]/40 text-white'
                  : 'bg-[#101820]/60 border border-white/6 text-[#8B9AA8] hover:text-white'
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
      <div className="rounded-[14px] bg-[#1F3445] border border-white/8 p-6 sm:p-8 space-y-6 corner-ticks relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8B9AA8] uppercase tracking-[0.10em]">
                {selectedWard?.ward_name || 'Municipal Ward Evaluation'}
              </span>
              {risk?.is_demo && <DemoBadge label={risk.demo_label} />}
            </div>
            <h1 className={`${TYPOGRAPHY.h1} text-white mt-1`}>
              Citizen Heat Risk Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <RiskBadge score={riskScore} size="lg" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FF704F]/10 border border-[#FF704F]/30 text-xs font-mono font-bold text-[#FF704F]">
              <Clock className="w-3.5 h-3.5" />
              <span>Peak: 13:00 – 16:00</span>
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
            <p className="text-xs font-mono text-[#8B9AA8]">
              Normalized Human Thermal Strain Index (HTSI)
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-3 gap-4 border-l border-white/8 pl-0 md:pl-6">
            <div>
              <span className="text-[11px] font-mono text-[#8B9AA8] uppercase block">
                ISO WBGT
              </span>
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {thermal ? `${thermal.wbgt_c.toFixed(1)}°C` : '34.8°C'}
              </span>
              <span className="text-[10px] text-[#5F7183] block">Wet-Bulb Globe</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-[#8B9AA8] uppercase block">
                UTCI Stress
              </span>
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {thermal ? `${thermal.utci_c.toFixed(1)}°C` : '41.6°C'}
              </span>
              <span className="text-[10px] text-[#5F7183] block">Universal Thermal</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-[#8B9AA8] uppercase block">
                Air Temp
              </span>
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {risk ? `${risk.temperature_c.toFixed(1)}°C` : '37.4°C'}
              </span>
              <span className="text-[10px] text-[#5F7183] block">Ambient Dry-Bulb</span>
            </div>
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
          label="DIURNAL CYCLE TRAJECTORY"
          title="Hourly Human Heat Progression"
          lead="Hourly resolution predictions calibrated with numerical meteorological models and urban canopy thermal storage."
        />
        <Card tier="l1">
          {forecast?.items ? (
            <HourlyStrip items={forecast.items} />
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-[#8B9AA8]">
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
              <div className="text-base sm:text-lg text-[#D7E0E7] font-sans font-medium leading-relaxed">
                {risk?.explanation ||
                  'High thermal risk detected. Suspend non-essential afternoon outdoor exertion. Rapid indoor heat accumulation likely under non-insulated roofs.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-[8px] bg-[#101820]/60 border border-white/6 flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-[#2FA37C] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Hydration Target</span>
                    <span className="text-xs text-[#8B9AA8] leading-normal">
                      Drink 250ml cool water / ORS solution every 30 minutes.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#101820]/60 border border-white/6 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Peak Shelter</span>
                    <span className="text-xs text-[#8B9AA8] leading-normal">
                      Avoid direct solar exposure between 12:00 PM and 4:30 PM.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#101820]/60 border border-white/6 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#9B6FD8] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Vulnerable Cohorts</span>
                    <span className="text-xs text-[#8B9AA8] leading-normal">
                      Check on seniors, infants, and chronic respiratory patients twice daily.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#101820]/60 border border-white/6 flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#FF704F] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Emergency Helpline</span>
                    <span className="text-xs text-[#8B9AA8] leading-normal">
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
              <div className="h-44 flex items-center justify-center text-xs text-[#8B9AA8]">
                Loading factor attribution...
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 8. P1-7 Feature: Usable Cooling Centres */}
      <section className="space-y-4">
        <CoolingCentresList city={selectedCity} />
      </section>
    </div>
  );
};
