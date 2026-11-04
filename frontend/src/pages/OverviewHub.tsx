import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  ShieldAlert,
  HardHat,
  Building2,
  Activity,
  ArrowRight,
  Flame,
  Moon,
  Bell,
  Heart,
  MapPin,
  TrendingUp,
  ThermometerSun,
} from 'lucide-react';
import { useRole } from '../hooks/useRole';
import { useAppStore } from '../store/useAppStore';
import { useCurrentRisk } from '../hooks/useRisk';
import { useWardDetails } from '../hooks/useWards';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { CareCircleStrip } from '../components/care/CareCircleStrip';
import { TonightCard } from '../components/risk/TonightCard';
import { Card } from '../components/ui/Card';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { RiskBadge } from '../components/risk/RiskBadge';
import { getRiskBand, THEME_COLORS } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

export const OverviewHub: React.FC = () => {
  const { user } = useUser();
  const { isAuthority, role } = useRole();
  const { selectedCity, selectedLocationId } = useAppStore();

  const { data: ward } = useWardDetails(selectedLocationId || 1);
  const { data: risk, isLoading: isRiskLoading } = useCurrentRisk(selectedLocationId || 1);
  const { data: subscriptions } = useSubscriptions();

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there';

  const riskScore = Math.round(risk?.risk_score ?? 68);
  const bandDef = getRiskBand(riskScore);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Warm Greeting & Location Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#9B6FD8] block mb-1">
            ThermaGrid National Telemetry Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Hello, {firstName}
          </h1>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Active ward: <span className="text-white font-medium">{ward?.ward_name || 'Ward M/East'}</span> ({selectedCity})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/app/account"
            className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#D7E0E7] flex items-center gap-1.5 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-[#9B6FD8]" />
            <span>Alerts ({subscriptions?.length || 0})</span>
          </Link>
          <Link
            to="/app/heat-risk"
            className="px-3.5 py-1.5 rounded-lg bg-[#9B6FD8] hover:bg-[#7F56BD] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>Safe Windows</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. One Big Hero Card: Today's Risk in Your Ward */}
      <div className="rounded-[16px] bg-[#1F3445] border border-white/12 p-6 sm:p-8 space-y-6 shadow-2xl relative corner-ticks overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: bandDef.color }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bandDef.color }} />
              <span
                className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold tracking-wider"
                style={{
                  color: bandDef.color,
                  backgroundColor: `${bandDef.color}20`,
                }}
              >
                {bandDef.label}
              </span>
              <span className="text-xs font-mono text-[#8B9AA8]">
                · {ward?.ward_name || 'Ward M/East'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {riskScore >= 70
                ? 'Severe Thermal Stress in Effect Today'
                : riskScore >= 50
                ? 'Elevated Heat Risk: Implement Hydration Intervals'
                : 'Manageable Thermal Conditions in Your Ward'}
            </h2>

            <p className="text-xs text-[#D7E0E7] leading-relaxed">
              {risk?.explanation ||
                `Current conditions reflect high built-environment vulnerability intersecting direct solar radiation. Check safe activity windows before traveling.`}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Link
                to="/app/heat-risk"
                className="px-4 py-2 rounded-lg bg-[#9B6FD8] hover:bg-[#7F56BD] text-white text-xs font-mono font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <span>View Full Citizen Advisory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/app/worker"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <span>Print Worker Shift Card</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end shrink-0 space-y-1">
            <span className="text-[11px] font-mono uppercase text-[#8B9AA8]">Current Ward Risk Index</span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-5xl sm:text-6xl font-mono font-black tracking-tight"
                style={{ color: bandDef.color }}
              >
                {riskScore}
              </span>
              <span className="text-xl font-mono text-[#8B9AA8]">/100</span>
            </div>
            <span className="text-[11px] font-mono text-[#5F7183]">
              Population Density: {ward?.population_density_per_km2?.toLocaleString() || '45,000'} / km²
            </span>
          </div>
        </div>

        {/* Factor Breakdown Strip */}
        {risk?.factor_breakdown && (
          <div className="pt-4 border-t border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(risk.factor_breakdown).map(([factor, val]: [string, any]) => (
              <div key={factor} className="p-3 rounded-lg bg-[#101820]/70 border border-white/5">
                <span className="text-[10px] font-mono uppercase text-[#8B9AA8] block truncate">
                  {factor.replace('_', ' ')}
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  {typeof val === 'number' ? `${Math.round(val)}%` : val}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Care Circle Strip (P1-5) */}
      <CareCircleStrip />

      {/* 4. 2x2 Feature Cards Grid */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
          Platform Feature Consoles
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Citizen Heat Risk */}
          <Link
            to="/app/heat-risk"
            className="p-6 rounded-[14px] bg-[#1F3445] border border-white/10 hover:border-[#9B6FD8]/50 hover:-translate-y-0.5 transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF704F]/15 text-[#FF704F] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#9B6FD8] transition-colors">
                Citizen Heat Risk
              </h3>
              <p className="text-xs text-[#8B9AA8] leading-relaxed">
                Hyperlocal diurnal curves, safe outdoor window planner, indoor thermal lag estimates, and cooling centres.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#9B6FD8] font-semibold">
              <span>Open heat-risk module</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Worker Shift Protection */}
          <Link
            to="/app/worker"
            className="p-6 rounded-[14px] bg-[#1F3445] border border-white/10 hover:border-[#9B6FD8]/50 hover:-translate-y-0.5 transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
                <HardHat className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#9B6FD8] transition-colors">
                Worker Safety & Shift Cards
              </h3>
              <p className="text-xs text-[#8B9AA8] leading-relaxed">
                ISO 7243 rest interval calculation, hourly hydration quotas, and printable contractor shift schedules.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#9B6FD8] font-semibold">
              <span>Open worker module</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Authority Console (Role Unlocked) */}
          {isAuthority ? (
            <Link
              to="/app/authority"
              className="p-6 rounded-[14px] bg-[#1F3445] border border-[#9B6FD8]/30 hover:border-[#9B6FD8] hover:-translate-y-0.5 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#9B6FD8]/20 text-[#9B6FD8] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-[#9B6FD8] transition-colors">
                    Authority Console
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#9B6FD8]/20 text-[#9B6FD8] border border-[#9B6FD8]/40">
                    Active Role
                  </span>
                </div>
                <p className="text-xs text-[#8B9AA8] leading-relaxed">
                  Municipal command deck, city-wide ward ranking, emergency broadcast triggers, and resource dispatch.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#9B6FD8] font-semibold">
                <span>Enter authority command</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="p-6 rounded-[14px] bg-[#101820]/60 border border-white/5 flex flex-col justify-between space-y-4 opacity-75">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 text-[#8B9AA8] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#8B9AA8]">Municipal Authority Deck</h3>
                <p className="text-xs text-[#5F7183] leading-relaxed">
                  Requires municipal authority credentials. Unlocks city-level resource dispatch and emergency broadcast.
                </p>
              </div>
              <Link
                to="/app/authority"
                className="text-xs font-mono text-[#8B9AA8] hover:text-white"
              >
                Officer access info →
              </Link>
            </div>
          )}

          {/* Card 4: Analytics */}
          <Link
            to="/app/analytics"
            className="p-6 rounded-[14px] bg-[#1F3445] border border-white/10 hover:border-[#9B6FD8]/50 hover:-translate-y-0.5 transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#9B6FD8] transition-colors">
                Analytics & Provenance
              </h3>
              <p className="text-xs text-[#8B9AA8] leading-relaxed">
                Model confidence cones, historical extremes, ISO thermal index mathematical benchmarks, and data sources.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#9B6FD8] font-semibold">
              <span>Inspect analytics telemetry</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Tonight's Risk (P0-2) */}
      <TonightCard locationId={selectedLocationId || 1} />
    </div>
  );
};
