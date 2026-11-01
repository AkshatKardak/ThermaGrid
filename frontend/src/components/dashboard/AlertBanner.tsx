import React from 'react';
import { AlertTriangle, Bell, ArrowRight } from 'lucide-react';
import type { Alert } from '../../types';

interface AlertBannerProps {
  alerts: Alert[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;
  const activeAlert = alerts[0];

  const isRed = activeAlert.alert_level.toLowerCase().includes('red') || activeAlert.alert_level.toLowerCase().includes('extreme');

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-lg ${
        isRed
          ? 'bg-[#C31D3C]/20 border-[#C31D3C]/40 text-white'
          : 'bg-[#FF704F]/15 border-[#FF704F]/35 text-[#D7E0E7]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            isRed ? 'bg-[#C31D3C]' : 'bg-[#FF704F]'
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isRed ? 'bg-[#C31D3C] text-white' : 'bg-[#FF704F] text-black'
              }`}
            >
              {activeAlert.alert_level}
            </span>
            <span className="text-xs text-[#8B9AA8] font-mono">
              {activeAlert.ward_name || 'Metropolitan Area'}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white font-display mt-0.5">
            {activeAlert.title}
          </h4>
          <p className="text-xs text-[#D7E0E7]/90 mt-1 max-w-3xl leading-relaxed">
            {activeAlert.action_directives}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
        <span className="text-[11px] font-mono text-[#8B9AA8]">
          Broadcast: SMS & WhatsApp Active
        </span>
      </div>
    </div>
  );
};
