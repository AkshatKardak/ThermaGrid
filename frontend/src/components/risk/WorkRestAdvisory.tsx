import React from 'react';
import { Droplets, Timer, AlertOctagon } from 'lucide-react';
import { Card } from '../ui/Card';

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
  let workMin = 60;
  let restMin = 0;
  let hydrationMlPerHour = 250;

  if (wbgt >= 32.2) {
    workMin = 0;
    restMin = 60;
    hydrationMlPerHour = 1000;
  } else if (wbgt >= 30.0) {
    workMin = 15;
    restMin = 45;
    hydrationMlPerHour = 800;
  } else if (wbgt >= 28.0) {
    workMin = 30;
    restMin = 30;
    hydrationMlPerHour = 600;
  } else if (wbgt >= 26.0) {
    workMin = 45;
    restMin = 15;
    hydrationMlPerHour = 450;
  }

  const workPct = Math.round((workMin / 60) * 100);
  const restPct = 100 - workPct;

  return (
    <Card
      title="Occupational Heat Strain Protocol (ISO 7243:2017)"
      subtitle="Standardized work-rest scheduling and hydration cadence for physical exertion"
      tier="l2"
    >
      <div className="space-y-6">
        {/* Timeline Bar showing Work (Amber) / Rest (Teal) blocks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#8B9AA8]">60-Minute Cycle Timeline</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#F59E0B]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                Work: {workMin}m ({workPct}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#2FA37C]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2FA37C]" />
                Rest: {restMin}m ({restPct}%)
              </span>
            </div>
          </div>

          {/* Visual block bar */}
          <div className="w-full h-8 rounded-[8px] overflow-hidden flex bg-[#101820] border border-white/8 p-0.5">
            {workPct > 0 && (
              <div
                className="h-full bg-[#F59E0B] rounded-l-[6px] flex items-center justify-center text-[11px] font-mono font-bold text-black transition-all duration-300"
                style={{ width: `${workPct}%` }}
              >
                {workPct >= 20 ? `${workMin}m Work` : ''}
              </div>
            )}
            {restPct > 0 && (
              <div
                className="h-full bg-[#2FA37C] rounded-r-[6px] flex items-center justify-center text-[11px] font-mono font-bold text-black transition-all duration-300"
                style={{ width: `${restPct}%` }}
              >
                {restPct >= 20 ? `${restMin}m Rest` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Hydration Cadence & WBGT Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1F3445]/50 p-4 rounded-[10px] border border-white/6 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8B9AA8]">
              <Timer className="w-4 h-4 text-[#8B9AA8]" />
              <span>Shift Rest Interval</span>
            </div>
            <div className="text-xl font-mono font-bold text-white tabular-nums">
              Every {60 - restMin} mins
            </div>
            <p className="text-[11px] text-[#8B9AA8]">
              Move to ventilated shade or cooling tent
            </p>
          </div>

          <div className="bg-[#1F3445]/50 p-4 rounded-[10px] border border-white/6 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8B9AA8]">
              <Droplets className="w-4 h-4 text-[#2FA37C]" />
              <span>Hydration Cadence</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#2FA37C] tabular-nums">
              {hydrationMlPerHour} ml / hr
            </div>
            <p className="text-[11px] text-[#8B9AA8]">
              Drink 200–250ml cool water / ORS every 15–20m
            </p>
          </div>

          <div className="bg-[#1F3445]/50 p-4 rounded-[10px] border border-white/6 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8B9AA8]">
              <AlertOctagon className="w-4 h-4 text-[#FF704F]" />
              <span>WBGT Stress Level</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#FF704F] tabular-nums">
              {wbgt.toFixed(1)}°C
            </div>
            <p className="text-[11px] text-[#8B9AA8]">{category}</p>
          </div>
        </div>

        {/* Advisory Note */}
        <div className="p-3.5 rounded-[8px] bg-[#101820] border border-white/8 text-xs text-[#D7E0E7] leading-relaxed">
          <span className="font-mono font-bold text-[#FF704F] uppercase tracking-wider block mb-1 text-[11px]">
            Action Advisory:
          </span>
          {guidance}
        </div>
      </div>
    </Card>
  );
};
