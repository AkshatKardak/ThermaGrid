import React from 'react';
import { CloudSun, UserCheck, BellRing } from 'lucide-react';
import { Card } from '../ui/Card';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: CloudSun,
      title: 'We read the weather',
      desc: 'Real-time automatic weather stations (IMD AWS) and numerical reanalysis capture air temperature, humidity, wind speed, and solar irradiance.',
    },
    {
      num: '02',
      icon: UserCheck,
      title: 'We calculate human heat strain',
      desc: 'Proven heat stress formulas (WBGT, UTCI, and Heat Index) calculate how temperature, humidity, and direct sunlight actually strain the human body and heart.',
    },
    {
      num: '03',
      icon: BellRing,
      title: 'We pinpoint who is at risk & what to do',
      desc: 'Neighborhood population data and housing types trigger clear safety advisories, mandatory work-rest breaks, and emergency cooling shelters.',
    },
  ];

  return (
    <div id="how-it-works" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {steps.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.num} className="p-6 space-y-4 bg-surface border border-border rounded-[10px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-[8px] bg-raised border border-border flex items-center justify-center text-accent">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs font-mono font-bold text-muted bg-raised px-2 py-0.5 rounded-[4px] border border-border">
                Stage {s.num}
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-ink">{s.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
