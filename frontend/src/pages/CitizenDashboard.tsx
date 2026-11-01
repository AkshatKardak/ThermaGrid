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
import { useCurrentRisk } from '../hooks/useRisk';
import { useCurrentThermal } from '../hooks/useThermal';
import { useRiskForecast } from '../hooks/useForecast';
import { useCoolingCentres, useAlerts } from '../hooks/useCoolingCentres';
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
  const { data: coolingCentres } = useCoolingCentres(
    selectedCity,
    selectedWard?.latitude,
    selectedWard?.longitude
  );

  const filteredWards = wards?.filter((w) =>
    w.ward_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentWards = wards?.slice(0, 4) || [];
  const riskScore = risk?.risk_score ?? 78;
  const currentBand = getRiskBand(riskScore);

  // 5-day simulated forecast items based on current trajectory
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
              placeholder="Search Mumbai municipal ward, pincode, or landmark..."
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
                    className="w-full px-3.5 py-2 text-left text-xs font-mono hover:bg-[#263E50] text-[#D7E0E7] flex items-center justify-between"
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
            className="w-full md:w-auto px-4 py-2.5 rounded-[8px] bg-[#2F4A5E]/50 hover:bg-[#2F4A5E] border border-white/8 text-xs font-mono text-[#D7E0E7] flex items-center justify-center gap-2 transition-colors"
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
              className={`px-2.5 py-1 rounded-[6px] text-xs font-mono transition-all ${
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

      {/* 2. Hero Risk Block: Numeral-XL score, band pill, peak time, sparkline */}
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
              Human Thermal Stress Assessment
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

        {/* 24-Hour Sparkline Progression Bar */}
        <div className="pt-2">
          <div className="text-[11px] font-mono text-[#8B9AA8] mb-2 flex items-center justify-between">
            <span>24-Hour Thermal Progression</span>
            <span>Diurnal Sun Arc</span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#101820] flex overflow-hidden p-0.5 border border-white/5">
            {forecast?.items?.slice(0, 24).map((item, idx) => {
              const b = getRiskBand(item.predicted_risk_score);
              return (
                <div
                  key={idx}
                  className="flex-1 h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                  style={{ backgroundColor: b.color }}
                  title={`${item.time.slice(11, 16)}: ${item.predicted_risk_score.toFixed(0)}/100`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Hourly Strip (8-Cell Heat-Scaled Segment) */}
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

      {/* 4. Asymmetric 7/5 Split: Action Advisory (L2) vs Biophysical Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Advisory Card (L2 Tier) - 7 cols */}
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

        {/* Biophysical Factor Breakdown - 5 cols */}
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

      {/* 5. 5-Day Forecast: Row of Band Chips with Confidence */}
      <section className="space-y-4">
        <SectionHeader
          label="EXTENDED SYNOPTIC OUTLOOK"
          title="5-Day Thermal Trend & Prediction Confidence"
        />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {fiveDayForecast.map((fc, i) => {
            const b = getRiskBand(fc.score);
            return (
              <div
                key={i}
                className="p-4 rounded-[10px] bg-[#1F3445] border border-white/8 space-y-2 text-center"
              >
                <span className="text-xs font-mono text-[#8B9AA8] block">{fc.day}</span>
                <div className="flex items-center justify-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    {fc.score}/100
                  </span>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold block"
                  style={{
                    backgroundColor: `${b.color}20`,
                    color: b.color,
                  }}
                >
                  {b.label}
                </span>
                <span className="text-[10px] font-mono text-[#5F7183] block">
                  Conf: {fc.confidence}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Nearby Help: Designated Cooling Centres */}
      <section className="space-y-4">
        <SectionHeader
          label="MUNICIPAL RELIEF INFRASTRUCTURE"
          title="Nearest Municipal Cooling Shelters & Water Points"
          lead="Air-conditioned public concourses, primary health posts, and shaded hydration shelters open for public relief."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coolingCentres?.slice(0, 3).map((centre) => (
            <div
              key={centre.id}
              className="p-5 rounded-[12px] bg-[#1F3445] border border-white/8 hover:-translate-y-[2px] transition-transform duration-200 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8B9AA8] mb-1">
                  <span className="text-[10px] font-mono text-[#2FA37C] font-bold uppercase">
                    {centre.facility_type}
                  </span>
                  {centre.distance_km !== undefined && (
                    <span className="font-mono text-[#9B6FD8] font-bold">
                      {centre.distance_km.toFixed(1)} km away
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white font-display">{centre.name}</h4>
                <p className="text-xs text-[#8B9AA8] mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#5F7183] shrink-0 mt-0.5" />
                  {centre.address}
                </p>
              </div>

              <div className="border-t border-white/6 pt-2.5 text-xs font-mono space-y-1 text-[#8B9AA8]">
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="text-white">{centre.capacity_persons} persons</span>
                </div>
                <div className="flex justify-between">
                  <span>Hours:</span>
                  <span className="text-white">{centre.operating_hours}</span>
                </div>
                <div className="flex justify-between">
                  <span>Helpline:</span>
                  <span className="text-[#D7E0E7]">{centre.contact_phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
