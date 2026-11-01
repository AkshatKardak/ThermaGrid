import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users, Home, Trees, Building, HeartPulse, ArrowLeft, Shield } from 'lucide-react';
import { Card } from '../components/common/Card';
import { DemoBadge } from '../components/common/DemoBadge';
import { RiskGauge } from '../components/risk/RiskGauge';
import { FactorBars } from '../components/risk/FactorBars';
import { HourlyStrip } from '../components/risk/HourlyStrip';
import { useWardDetails } from '../hooks/useWards';
import { useCurrentRisk } from '../hooks/useRisk';
import { useRiskForecast } from '../hooks/useForecast';

export const LocationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const locationId = Number(id) || 1;

  const { data: ward } = useWardDetails(locationId);
  const { data: risk } = useCurrentRisk(locationId);
  const { data: forecast } = useRiskForecast(locationId);

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8B9AA8] hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#9B6FD8] font-bold">
                {ward?.ward_code}
              </span>
              <h1 className="text-3xl font-extrabold text-white font-display">
                {ward?.ward_name}
              </h1>
              {risk?.is_demo && <DemoBadge label={risk.demo_label} />}
            </div>
            <p className="text-xs text-[#8B9AA8] mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#8B9AA8]" />
              {ward?.district}, {ward?.city}, {ward?.state}
            </p>
          </div>
        </div>
      </div>

      {/* Ward Characteristics Summary */}
      {ward?.description && (
        <div className="p-4 rounded-xl bg-[#1F3445]/60 border border-white/5 text-xs text-[#D7E0E7] leading-relaxed">
          <strong className="text-white">Ward Context: </strong>
          {ward.description}
        </div>
      )}

      {/* Top Grid: Gauge & Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Risk Score Gauge */}
        <div className="lg:col-span-5">
          <Card
            title="Composite Human Thermal Risk"
            subtitle="Physics-calibrated Hazard × Exposure × Vulnerability"
          >
            {risk ? (
              <div className="space-y-4">
                <RiskGauge score={risk.risk_score} />
                <div className="p-3.5 rounded-lg bg-[#101820]/70 border border-white/5 text-xs text-[#D7E0E7]">
                  <span className="font-semibold text-[#FF704F]">Model Explanation: </span>
                  {risk.explanation}
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-[#8B9AA8]">
                Loading risk...
              </div>
            )}
          </Card>
        </div>

        {/* Right: Factor Contributions Bars */}
        <div className="lg:col-span-7">
          <Card
            title="Vulnerability Factor Breakdown"
            subtitle="Relative contribution of each driver to total thermal risk points"
          >
            {risk?.factor_breakdown ? (
              <FactorBars factors={risk.factor_breakdown} limit={7} />
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-[#8B9AA8]">
                Loading factor contributions...
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Demographic and Built-Environment Metrics */}
      <Card
        title="Census Demographics & Built Environment Baseline"
        subtitle="Authoritative baseline metrics for exposure and adaptive capacity evaluation"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-[#8B9AA8] flex items-center gap-1">
              <Users className="w-3 h-3 text-[#9B6FD8]" /> Density
            </span>
            <div className="text-base font-mono font-bold text-white">
              {ward?.population_density_per_km2.toLocaleString()}/km²
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-[#8B9AA8] flex items-center gap-1">
              <Home className="w-3 h-3 text-[#FF704F]" /> Informal / Slum
            </span>
            <div className="text-base font-mono font-bold text-[#FF704F]">
              {((ward?.informal_settlement_ratio || 0) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-[#8B9AA8] flex items-center gap-1">
              <Trees className="w-3 h-3 text-[#2FA37C]" /> Tree Canopy
            </span>
            <div className="text-base font-mono font-bold text-[#2FA37C]">
              {((ward?.tree_canopy_fraction || 0) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-[#8B9AA8] flex items-center gap-1">
              <Building className="w-3 h-3 text-[#F59E0B]" /> Outdoor Labor
            </span>
            <div className="text-base font-mono font-bold text-[#F59E0B]">
              {((ward?.outdoor_worker_ratio || 0) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-[#8B9AA8] flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-[#9B6FD8]" /> Seniors & Kids
            </span>
            <div className="text-base font-mono font-bold text-white">
              {(((ward?.elderly_ratio || 0) + (ward?.children_ratio || 0)) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#101820]/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-[#8B9AA8] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#2FA37C]" /> Hospitals
            </span>
            <div className="text-base font-mono font-bold text-white">
              {ward?.hospital_count} UPHCs
            </div>
          </div>
        </div>
      </Card>

      {/* Hourly Strip */}
      <Card
        title="24-Hour Diurnal Heat Progression"
        subtitle="Expected heat stress trajectory over the next 24 hours"
      >
        {forecast?.items ? (
          <HourlyStrip items={forecast.items} />
        ) : (
          <div className="h-28 flex items-center justify-center text-xs text-[#8B9AA8]">
            Loading hourly progression...
          </div>
        )}
      </Card>
    </div>
  );
};
