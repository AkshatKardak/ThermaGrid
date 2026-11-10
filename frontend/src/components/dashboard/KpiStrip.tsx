import React from 'react';
import { Thermometer, Wind, Droplets, Sun, AlertTriangle } from 'lucide-react';
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
      dotColor: 'var(--muted)',
    },
    {
      label: 'Effective WBGT',
      value: thermal ? `${thermal.wbgt_c.toFixed(1)}°C` : (risk ? `${risk.wbgt_c.toFixed(1)}°C` : '--'),
      subtext: thermal ? thermal.wbgt_category : 'Work-rest index',
      icon: Sun,
      dotColor: 'var(--risk-4)',
    },
    {
      label: 'Universal Climate (UTCI)',
      value: thermal ? `${thermal.utci_c.toFixed(1)}°C` : (risk ? `${risk.utci_c.toFixed(1)}°C` : '--'),
      subtext: thermal ? thermal.utci_category : 'Human strain',
      icon: Wind,
      dotColor: 'var(--risk-3)',
    },
    {
      label: 'Heat Index (NWS/HI)',
      value: thermal ? `${thermal.heat_index_c.toFixed(1)}°C` : '--',
      subtext: thermal ? thermal.heat_index_category : 'Apparent temperature',
      icon: Droplets,
      dotColor: 'var(--risk-2)',
    },
    {
      label: 'Composite Risk Score',
      value: risk ? `${risk.risk_score.toFixed(1)}` : '--',
      subtext: risk ? risk.band_label : 'Hazard × Exp × Vuln',
      icon: AlertTriangle,
      dotColor: 'var(--risk-4)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-3.5 rounded-[6px] bg-surface border border-border flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted text-xs">
              <span className="font-medium truncate pr-1">{card.label}</span>
              <Icon className="w-4 h-4 shrink-0 text-muted" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-mono font-bold tracking-tight text-ink tabular-nums flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: card.dotColor }} />
                <span>{card.value}</span>
              </div>
              <div className="text-[11px] text-muted truncate mt-0.5">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
