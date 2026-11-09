import React from 'react';
import { Truck, Home, Shield, Bell, CheckCircle2 } from 'lucide-react';
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
      color: '#FF704F',
      time: '12:30 PM Today',
    },
    {
      id: 2,
      type: 'Cooling Shelter Activation',
      target: 'Govandi Maternity Home & Concourse',
      status: 'Active (24x7 Standby)',
      priority: 'Urgent',
      icon: Home,
      color: '#2FA37C',
      time: 'Immediate',
    },
    {
      id: 3,
      type: 'Labor Work Shift Directive',
      target: 'All Metro & Construction Sites',
      status: 'Enforced',
      priority: 'Mandatory',
      icon: Shield,
      color: '#F59E0B',
      time: 'Cease 12:00 - 16:00',
    },
    {
      id: 4,
      type: 'Loudspeaker Public Broadcast',
      target: 'Deonar & Shivaji Nagar Slum Pockets',
      status: 'Scheduled',
      priority: 'Medium',
      icon: Bell,
      color: '#8FB3D9',
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
              className="p-3.5 rounded-xl bg-[#0B141B]/60 border border-white/5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${item.color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white font-display">
                    {item.type}
                  </h5>
                  <p className="text-[11px] text-[#8B9AA8]">{item.target}</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className="inline-block text-[10px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    borderColor: `${item.color}30`,
                  }}
                >
                  {item.status}
                </span>
                <p className="text-[10px] font-mono text-[#8B9AA8] mt-1">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
