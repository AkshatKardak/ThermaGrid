import React from 'react';
import { Droplets, Timer, AlertOctagon } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatNumber } from '../../utils/format';

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
        {/* Timeline Bar showing Work / Rest blocks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted">60-Minute Cycle Timeline</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-ink">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-risk-3" />
                Work: {workMin}m ({workPct}%)
              </span>
              <span className="flex items-center gap-1.5 text-ink">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-risk-1" />
                Rest: {restMin}m ({restPct}%)
              </span>
            </div>
          </div>

          {/* Visual block bar */}
          <div className="w-full h-8 rounded-[6px] overflow-hidden flex bg-raised border border-border p-0.5">
            {workPct > 0 && (
              <div
                className="h-full bg-risk-3 rounded-l-[4px] flex items-center justify-center text-[11px] font-mono font-bold text-ink transition-all duration-300"
                style={{ width: `${workPct}%` }}
              >
                {workPct >= 20 ? `${workMin}m Work` : ''}
              </div>
            )}
            {restPct > 0 && (
              <div
                className="h-full bg-risk-1 rounded-r-[4px] flex items-center justify-center text-[11px] font-mono font-bold text-ink transition-all duration-300"
                style={{ width: `${restPct}%` }}
              >
                {restPct >= 20 ? `${restMin}m Rest` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Advisory Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-raised p-4 rounded-[6px] border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-muted" title="Shift Rest Interval">
              <Timer className="w-4 h-4 text-muted" />
              <span>Break every</span>
            </div>
            <div className="text-xl font-mono font-bold text-ink tabular-nums">
              Every {60 - restMin} mins
            </div>
            <p className="text-[11px] text-muted">
              Move to ventilated shade or cooling tent
            </p>
          </div>

          <div className="bg-raised p-4 rounded-[6px] border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-muted" title="Hydration Cadence">
              <Droplets className="w-4 h-4 text-accent" />
              <span>Drink water every</span>
            </div>
            <div className="text-xl font-mono font-bold text-ink tabular-nums">
              {hydrationMlPerHour} ml / hr
            </div>
            <p className="text-[11px] text-muted">
              Drink 200–250ml cool water / ORS every 15–20m
            </p>
          </div>

          <div className="bg-raised p-4 rounded-[6px] border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-muted" title="WBGT Stress Level">
              <AlertOctagon className="w-4 h-4 text-risk-4" />
              <span>Heat level</span>
            </div>
            <div className="text-xl font-mono font-bold text-ink tabular-nums">
              {category}
            </div>
            <p className="text-[11px] text-muted">WBGT {formatNumber(wbgt, 1)}°C · ISO 7243</p>
          </div>
        </div>

        {/* Advisory Note */}
        <div className="p-3.5 rounded-[6px] bg-raised border border-border text-xs text-ink leading-relaxed">
          <span className="font-mono font-bold text-ink uppercase tracking-wider block mb-1 text-[11px]">
            Action Advisory:
          </span>
          {guidance}
        </div>
      </div>
    </Card>
  );
};
