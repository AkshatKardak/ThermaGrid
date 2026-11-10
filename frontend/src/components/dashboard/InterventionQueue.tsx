import React from 'react';
import { Truck, Home, Shield, Bell } from 'lucide-react';
import { Card } from '../common/Card';

export const InterventionQueue: React.FC = () => {
  const interventions = [
    {
      id: 1,
      type: 'Water Tanker Deployment',
      target: 'Ward M/East (Shivaji Nagar Sector 4)',
      status: 'Dispatched',
      priority: 'High',
      icon: Truck,
      dotColor: 'var(--risk-4)',
      time: '12:30 PM Today',
    },
    {
      id: 2,
      type: 'Cooling Shelter Activation',
      target: 'Govandi Maternity Home & Concourse',
      status: 'Active (24x7 Standby)',
      priority: 'Urgent',
      icon: Home,
      dotColor: 'var(--risk-1)',
      time: 'Immediate',
    },
    {
      id: 3,
      type: 'Labor Work Shift Directive',
      target: 'All Metro & Construction Sites',
      status: 'Enforced',
      priority: 'Mandatory',
      icon: Shield,
      dotColor: 'var(--risk-3)',
      time: 'Cease 12:00 - 16:00',
    },
    {
      id: 4,
      type: 'Loudspeaker Public Broadcast',
      target: 'Deonar & Shivaji Nagar Slum Pockets',
      status: 'Scheduled',
      priority: 'Medium',
      icon: Bell,
      dotColor: 'var(--accent)',
      time: 'Every 2 Hours',
    },
  ];

  return (
    <Card
      title="Municipal Intervention Queue"
      subtitle="Heat Action Plan operational resource dispatch"
    >
      <div className="space-y-3">
        {interventions.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3.5 rounded-[6px] bg-raised border border-border flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[6px] shrink-0 bg-surface border border-border text-accent">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-ink font-display">
                    {item.type}
                  </h5>
                  <p className="text-[11px] text-muted">{item.target}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-border bg-surface text-ink">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dotColor }} />
                  {item.status}
                </span>
                <p className="text-[10px] font-mono text-muted mt-1">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
