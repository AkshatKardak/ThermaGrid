import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldAlert, HardHat, Building2, Flame } from 'lucide-react';
import { RiskGlobe } from '../components/three/RiskGlobe';
import { TwoWardsComparison } from '../components/dashboard/TwoWardsComparison';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useAppStore } from '../store/useAppStore';
import { RiskBadge } from '../components/risk/RiskBadge';

export const Landing: React.FC = () => {
  const { selectedCity, setSelectedLocationId } = useAppStore();
  const { data: allRisk } = useAllWardsRisk(selectedCity);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9B6FD8]/15 border border-[#9B6FD8]/30 text-xs font-mono text-[#9B6FD8]">
              <Flame className="w-3.5 h-3.5 text-[#FF704F]" />
              <span>MoES / NCMRWF National High-Impact Initiative</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#D7E0E7] font-display tracking-tight leading-[1.1]">
              Hyperlocal <span className="text-[#FF704F]">Thermal Stress</span> & Early-Warning Platform
            </h1>

            <p className="text-base sm:text-lg text-[#8B9AA8] max-w-2xl leading-relaxed font-normal">
              Not a generic weather forecast. ThermaGrid pinpoints{' '}
              <strong className="text-white font-semibold">who</strong> is at risk,{' '}
              <strong className="text-white font-semibold">where</strong>,{' '}
              <strong className="text-white font-semibold">when it peaks</strong>,{' '}
              <strong className="text-white font-semibold">why</strong>, and{' '}
              <strong className="text-white font-semibold">what action to take</strong>{' '}
              — calibrated down to the urban municipal ward.
            </p>

            {/* Persona Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/citizen"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#9B6FD8] hover:bg-[#7F56BD] text-white text-sm font-semibold shadow-lg shadow-[#9B6FD8]/25 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                Citizen Protection
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/worker"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1F3445] hover:bg-[#263E50] border border-white/10 text-white text-sm font-semibold transition-all"
              >
                <HardHat className="w-4 h-4 text-[#F59E0B]" />
                Worker Safety
              </Link>
              <Link
                to="/authority"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1F3445] hover:bg-[#263E50] border border-white/10 text-white text-sm font-semibold transition-all"
              >
                <Building2 className="w-4 h-4 text-[#FF704F]" />
                Authority Console
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg">
              <div>
                <span className="block text-2xl font-mono font-bold text-white">ISO 7243</span>
                <span className="text-xs text-[#8B9AA8]">WBGT Standard</span>
              </div>
              <div>
                <span className="block text-2xl font-mono font-bold text-[#FF704F]">Hourly</span>
                <span className="text-xs text-[#8B9AA8]">Peak Trajectory</span>
              </div>
              <div>
                <span className="block text-2xl font-mono font-bold text-[#2FA37C]">Ward-Level</span>
                <span className="text-xs text-[#8B9AA8]">Vulnerability Data</span>
              </div>
            </div>

          </div>

          {/* Hero 3D Globe Telemetry Hero */}
          <div className="lg:col-span-5">
            <RiskGlobe height={460} />
          </div>

        </div>
      </section>

      {/* The Core Benchmark: Two Wards Comparison */}
      <section>
        <TwoWardsComparison />
      </section>

      {/* Quick Ward Navigation Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#D7E0E7] font-display">
              Live Municipal Ward Surveillance ({selectedCity})
            </h3>
            <p className="text-xs text-[#8B9AA8]">
              Select a ward to view real-time thermal indices, factor contributions, and forecasts
            </p>
          </div>
          <Link
            to="/authority"
            className="text-xs font-mono text-[#9B6FD8] hover:underline flex items-center gap-1"
          >
            Full Authority Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allRisk?.map((ward) => (
            <div
              key={ward.location_id}
              onClick={() => setSelectedLocationId(ward.location_id)}
              className="p-4 rounded-xl bg-[#1F3445]/80 hover:bg-[#263E50] border border-white/10 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#8B9AA8] uppercase">
                    {ward.ward_code}
                  </span>
                  <h4 className="text-sm font-bold text-white font-display group-hover:text-[#9B6FD8] transition-colors">
                    {ward.ward_name}
                  </h4>
                </div>
                <RiskBadge score={ward.risk_score} size="sm" />
              </div>

              <div className="space-y-1 text-xs font-mono text-[#8B9AA8] border-t border-white/5 pt-2">
                <div className="flex justify-between">
                  <span>Effective WBGT:</span>
                  <span className="text-white font-bold">{ward.wbgt_c.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Air Temp:</span>
                  <span className="text-white">{ward.temperature_c.toFixed(1)}°C</span>
                </div>
              </div>

              <div className="text-[11px] text-[#8B9AA8] line-clamp-2">
                {ward.explanation}
              </div>

              <Link
                to={`/location/${ward.location_id}`}
                className="pt-2 text-xs font-semibold text-[#9B6FD8] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
              >
                Inspect Ward Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
