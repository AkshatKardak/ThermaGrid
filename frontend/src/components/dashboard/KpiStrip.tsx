import React from 'react';
import { Thermometer, Wind, Droplets, Sun, AlertTriangle, Users } from 'lucide-react';
import type { RiskCurrent, ThermalCurrent } from '../../types';

interface KpiStripProps {
  risk?: RiskCurrent;
  thermal?: ThermalCurrent;
}

export const KpiStrip: React.FC<KpiStripProps> = ({ risk, thermal }) => {
  const cards = [
    {
      label: 'Ambient Air Temp',
      value: risk ? `${risk.temperature_c.toFixed(1)}°C` : '--',
      subtext: 'Surface 2m dry-bulb',
      icon: Thermometer,
      color: '#D7E0E7',
    },
    {
      label: 'Effective WBGT',
      value: thermal ? `${thermal.wbgt_c.toFixed(1)}°C` : (risk ? `${risk.wbgt_c.toFixed(1)}°C` : '--'),
      subtext: thermal ? thermal.wbgt_category : 'Work-rest index',
      icon: Sun,
      color: '#FF704F',
    },
    {
      label: 'Universal Climate (UTCI)',
      value: thermal ? `${thermal.utci_c.toFixed(1)}°C` : (risk ? `${risk.utci_c.toFixed(1)}°C` : '--'),
      subtext: thermal ? thermal.utci_category : 'Human strain',
      icon: Wind,
      color: '#F59E0B',
    },
    {
      label: 'Heat Index (NWS/HI)',
      value: thermal ? `${thermal.heat_index_c.toFixed(1)}°C` : '--',
      subtext: thermal ? thermal.heat_index_category : 'Apparent temperature',
      icon: Droplets,
      color: '#E8C547',
    },
    {
      label: 'Composite Risk Score',
      value: risk ? `${risk.risk_score.toFixed(1)}` : '--',
      subtext: risk ? risk.band_label : 'Hazard × Exp × Vuln',
      icon: AlertTriangle,
      color: risk ? risk.alert_color : '#9B6FD8',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-[#1F3445]/80 border border-white/10 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#8B9AA8] text-xs">
              <span className="font-medium truncate pr-1">{card.label}</span>
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: card.color }} />
            </div>
            <div className="mt-2">
              <div
                className="text-2xl font-mono font-bold tracking-tight"
                style={{ color: card.color }}
              >
                {card.value}
              </div>
              <div className="text-[11px] text-[#8B9AA8] truncate mt-0.5">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
