import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
      className={`p-4 rounded-[8px] border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isRed
          ? 'bg-[color-mix(in_srgb,var(--risk-5)_12%,var(--surface))] border-[color-mix(in_srgb,var(--risk-5)_55%,var(--ink))] text-ink'
          : 'bg-[color-mix(in_srgb,var(--risk-4)_12%,var(--surface))] border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))] text-ink'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-[6px] shrink-0 bg-raised border border-border">
          <AlertTriangle className="w-5 h-5 text-error animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider bg-raised text-ink border border-border">
              {activeAlert.alert_level}
            </span>
            <span className="text-xs text-muted font-mono">
              {activeAlert.ward_name || 'Metropolitan Area'}
            </span>
          </div>
          <h4 className="text-sm font-bold text-ink font-display mt-0.5">
            {activeAlert.title}
          </h4>
          <p className="text-xs text-muted mt-1 max-w-3xl leading-relaxed">
            {activeAlert.action_directives}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        <span className="text-[11px] font-mono text-muted">
          Broadcast: SMS & WhatsApp Active
        </span>
      </div>
    </div>
  );
};
