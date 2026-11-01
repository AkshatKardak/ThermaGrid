import React from 'react';
import { ShieldCheck, Droplets, MapPin, Phone, Clock } from 'lucide-react';
import { Card } from '../components/common/Card';
import { DemoBadge } from '../components/common/DemoBadge';
import { RiskGauge } from '../components/risk/RiskGauge';
import { HourlyStrip } from '../components/risk/HourlyStrip';
import { AlertBanner } from '../components/dashboard/AlertBanner';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { useCurrentRisk } from '../hooks/useRisk';
import { useCurrentThermal } from '../hooks/useThermal';
import { useRiskForecast } from '../hooks/useForecast';
import { useCoolingCentres, useAlerts } from '../hooks/useCoolingCentres';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';

export const CitizenDashboard: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: risk } = useCurrentRisk(selectedLocationId);
  const { data: thermal } = useCurrentThermal(selectedLocationId);
  const { data: forecast } = useRiskForecast(selectedLocationId);
  const { data: alerts } = useAlerts(selectedCity);

  const selectedWard = wards?.find((w) => w.id === selectedLocationId) || wards?.[0];
  const { data: coolingCentres } = useCoolingCentres(
    selectedCity,
    selectedWard?.latitude,
    selectedWard?.longitude
  );

  return (
    <div className="space-y-6">
      {/* Ward Selector & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white font-display">
              Citizen Heat Protection & Advisory
            </h1>
            {risk?.is_demo && <DemoBadge label={risk.demo_label} />}
          </div>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Hyperlocal human thermal safety guidance for {selectedWard?.ward_name || selectedCity}
          </p>
        </div>

        {/* Ward Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="ward-select" className="text-xs text-[#8B9AA8]">Ward:</label>
          <select
            id="ward-select"
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

      {/* Active Heat Alerts */}
      {alerts && <AlertBanner alerts={alerts} />}

      {/* Top KPI Telemetry Strip */}
      <KpiStrip risk={risk} thermal={thermal} />

      {/* Core Risk & Hourly Progression Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Risk Gauge Card */}
        <div className="lg:col-span-5">
          <Card
            title="Current Ward Risk Assessment"
            subtitle="Normalized human thermal vulnerability index"
          >
            {risk ? (
              <div className="space-y-4">
                <RiskGauge score={risk.risk_score} />
                <div className="p-3.5 rounded-lg bg-[#101820]/70 border border-white/5 text-xs text-[#D7E0E7] leading-relaxed">
                  <strong className="text-[#FF704F]">Why this grade: </strong>
                  {risk.explanation}
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-[#8B9AA8]">
                Loading risk evaluation...
              </div>
            )}
          </Card>
        </div>

        {/* Right: Diurnal Trajectory & Actionable Checklist */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Diurnal Hourly Progression */}
          <Card
            title="Hourly Heat Risk & Peak Warning"
            subtitle="Plan outdoor transit and errands around peak afternoon heat hours"
          >
            {forecast?.items ? (
              <HourlyStrip items={forecast.items} />
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-[#8B9AA8]">
                Loading hourly forecast...
              </div>
            )}
          </Card>

          {/* Citizen Immediate Action Checklist */}
          <Card
            title="Actionable Precautions Today"
            subtitle="Evidence-based Heat Action Plan advice"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 flex items-start gap-2.5">
                <Droplets className="w-4 h-4 text-[#2FA37C] flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Hydration Target</span>
                  <span className="text-[#8B9AA8]">Drink 500ml salted lemon water, chaas, or ORS every 2 hours.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Peak Sun Avoidance</span>
                  <span className="text-[#8B9AA8]">Avoid direct sun exposure between 12:00 PM and 04:00 PM.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#9B6FD8] flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">High-Risk Care</span>
                  <span className="text-[#8B9AA8]">Check on infants and seniors aged 65+ twice daily.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#FF704F] flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Emergency Helpline</span>
                  <span className="text-[#8B9AA8]">Dial 108 for ambulances or 1916 for BMC Disaster Control.</span>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Nearest Designated Municipal Cooling Shelters */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              Nearest Municipal Cooling Centres & Hydration Hubs
            </h3>
            <p className="text-xs text-[#8B9AA8]">
              Air-conditioned public transit concourses, UPHCs, and community halls open for public relief
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coolingCentres?.slice(0, 3).map((centre) => (
            <div
              key={centre.id}
              className="p-4 rounded-xl bg-[#1F3445]/80 border border-white/10 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8B9AA8]">
                  <span className="text-[10px] font-mono text-[#2FA37C] font-bold uppercase">
                    {centre.facility_type}
                  </span>
                  {centre.distance_km !== undefined && (
                    <span className="font-mono text-[#9B6FD8] font-bold">
                      {centre.distance_km.toFixed(1)} km away
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white font-display mt-1">
                  {centre.name}
                </h4>
                <p className="text-xs text-[#8B9AA8] mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8B9AA8] flex-shrink-0 mt-0.5" />
                  {centre.address}
                </p>
              </div>

              <div className="border-t border-white/5 pt-2 text-xs space-y-1">
                <div className="flex justify-between text-[#8B9AA8]">
                  <span>Capacity:</span>
                  <span className="text-white font-mono">{centre.capacity_persons} persons</span>
                </div>
                <div className="flex justify-between text-[#8B9AA8]">
                  <span>Hours:</span>
                  <span className="text-white font-mono">{centre.operating_hours}</span>
                </div>
                <div className="flex justify-between text-[#8B9AA8]">
                  <span>Helpline:</span>
                  <span className="text-white font-mono">{centre.contact_phone}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {centre.amenities?.map((amenity, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-[#8B9AA8]"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
