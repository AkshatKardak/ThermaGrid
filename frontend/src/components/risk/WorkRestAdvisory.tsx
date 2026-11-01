import React from 'react';
import { HardHat, Droplets, Timer, AlertOctagon } from 'lucide-react';
import { Card } from '../common/Card';

interface WorkRestAdvisoryProps {
  wbgt: number;
  category: string;
  guidance: string;
}

export const WorkRestAdvisory: React.FC<WorkRestAdvisoryProps> = ({
  wbgt,
  category,
  guidance,
}) => {
  // ISO 7243:2017 screening schedule calculations
  let workPct = 100;
  let restPct = 0;
  let hydrationMlPerHour = 250;

  if (wbgt >= 32.2) {
    workPct = 0;
    restPct = 100;
    hydrationMlPerHour = 1000;
  } else if (wbgt >= 30.0) {
    workPct = 25;
    restPct = 75;
    hydrationMlPerHour = 800;
  } else if (wbgt >= 28.0) {
    workPct = 50;
    restPct = 50;
    hydrationMlPerHour = 600;
  } else if (wbgt >= 26.0) {
    workPct = 75;
    restPct = 25;
    hydrationMlPerHour = 450;
  }

  return (
    <Card
      title="Occupational Heat Strain Protocol (ISO 7243:2017)"
      subtitle="Standardized work-rest scheduling for moderate metabolic physical exertion (~300W)"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* Work / Rest Breakdown */}
        <div className="bg-[#101820]/60 p-4 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#8B9AA8]">
            <Timer className="w-4 h-4 text-[#9B6FD8]" />
            <span>Hourly Cycle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#D7E0E7]">{workPct}% Work</span>
            <span className="text-xs font-mono text-[#FF704F]">/ {restPct}% Rest</span>
          </div>
          <p className="text-[11px] text-[#8B9AA8]">
            {workPct > 0 ? `${(workPct * 60) / 100} min physical work per hour` : 'Cease strenuous outdoor tasks'}
          </p>
        </div>

        {/* Hydration Requirement */}
        <div className="bg-[#101820]/60 p-4 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#8B9AA8]">
            <Droplets className="w-4 h-4 text-[#2FA37C]" />
            <span>Hydration Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#2FA37C]">{hydrationMlPerHour} ml</span>
            <span className="text-xs font-mono text-[#8B9AA8]">/ hour</span>
          </div>
          <p className="text-[11px] text-[#8B9AA8]">
            Electrolytes & ORS water at 20-min intervals
          </p>
        </div>

        {/* WBGT Thermal Threshold */}
        <div className="bg-[#101820]/60 p-4 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#8B9AA8]">
            <HardHat className="w-4 h-4 text-[#F59E0B]" />
            <span>Effective WBGT</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#D7E0E7]">{wbgt.toFixed(1)}°C</span>
            <span className="text-xs font-mono text-[#8B9AA8]">({category})</span>
          </div>
          <p className="text-[11px] text-[#8B9AA8]">
            Stop-work threshold: 32.2°C (OSHA/ISO)
          </p>
        </div>

      </div>

      <div className="p-3 rounded-lg bg-[#FF704F]/10 border border-[#FF704F]/20 text-xs text-[#D7E0E7] flex items-start gap-2.5">
        <AlertOctagon className="w-4 h-4 text-[#FF704F] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#FF704F]">Workplace Directive: </span>
          {guidance}
        </div>
      </div>
    </Card>
  );
};
