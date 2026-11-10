import React from 'react';
import type { HourlyRiskForecastItem } from '../../types';
import { getRiskBand } from '../../theme/tokens';

interface HourlyStripProps {
  items: HourlyRiskForecastItem[];
}

export const HourlyStrip: React.FC<HourlyStripProps> = ({ items }) => {
  // Take next 24 hours
  const next24h = items.slice(0, 24);
  if (next24h.length === 0) return null;

  // Find peak hour
  let peakItem = next24h[0];
  for (const item of next24h) {
    if (item.predicted_risk_score > peakItem.predicted_risk_score) {
      peakItem = item;
    }
  }

  const formatHour = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoStr.slice(11, 16);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
          <span>Diurnal Heat Progression (24 Hours)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">Peak stress expected:</span>
          <span className="font-mono font-bold text-ink bg-raised px-2 py-0.5 rounded-[4px] border border-border inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-4" />
            {formatHour(peakItem.time)} ({peakItem.predicted_risk_score.toFixed(0)}/100)
          </span>
        </div>
      </div>

      {/* Horizontal Strip */}
      <div className="flex items-end gap-1.5 overflow-x-auto pb-2 pt-4">
        {next24h.map((h, i) => {
          const band = getRiskBand(h.predicted_risk_score);
          const isPeak = h.time === peakItem.time;

          return (
            <div
              key={i}
              className={`flex flex-col items-center shrink-0 w-9 transition-transform ${
                isPeak ? 'scale-105 -translate-y-1' : ''
              }`}
            >
              {/* Temperature */}
              <span className="text-[10px] font-mono text-muted mb-1 tabular-nums">
                {h.temperature_c.toFixed(0)}°
              </span>

              {/* Bar indicator */}
              <div
                className="w-full rounded-t-[4px] transition-all duration-300 relative group cursor-pointer"
                style={{
                  height: `${Math.max(20, (h.predicted_risk_score / 100) * 64)}px`,
                  backgroundColor: band.color,
                  border: isPeak ? '2px solid var(--accent)' : 'none',
                }}
              >
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none z-20 bg-raised text-ink text-[10px] p-1.5 rounded-[4px] border border-border whitespace-nowrap">
                  <div className="font-bold text-ink">{formatHour(h.time)}</div>
                  <div className="text-muted">Risk: {h.predicted_risk_score.toFixed(1)} ({band.label})</div>
                  <div className="text-muted">WBGT: {h.predicted_wbgt.toFixed(1)}°C</div>
                </div>
              </div>

              {/* Hour Label */}
              <span className={`text-[10px] font-mono mt-1 ${isPeak ? 'font-bold text-ink' : 'text-muted'}`}>
                {formatHour(h.time).slice(0, 2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
