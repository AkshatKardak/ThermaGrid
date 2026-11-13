import React from 'react';
import { evaluateThermalLag } from '../../lib/thermalLag';
import { getRiskHex } from './palette';

export const ThermalLagStaticFallback: React.FC = () => {
  const dayState = evaluateThermalLag(15.0); // 15:00 Day Peak
  const nightState = evaluateThermalLag(3.0); // 03:00 Night Cooldown

  return (
    <div className="w-full space-y-6 select-none">
      {/* 2-Panel Comparison: Midday Peak vs Nocturnal Heat Retention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: 15:00 Daily Peak */}
        <div className="p-6 rounded-[8px] bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-xs font-mono font-medium text-ink">15:00 DAILY PEAK</span>
            </div>
            <span className="text-xs font-mono text-muted">
              Outdoor Ambient: <strong className="text-ink">{dayState.outdoorTemp.toFixed(1)}°C</strong>
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {/* Tin House */}
            <div className="p-3.5 rounded-[6px] bg-raised border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-sans font-medium text-ink block">
                  Informal Corrugated Tin
                </span>
                <span className="text-[11px] text-muted">
                  Immediate solar penetration (τ ≈ 0.9h)
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-ink tabular-nums block">
                  {dayState.tinIndoorTemp.toFixed(1)}°C
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono text-ink">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskHex(80) }} />
                  {dayState.tinAlertGrade}
                </span>
              </div>
            </div>

            {/* RCC House */}
            <div className="p-3.5 rounded-[6px] bg-raised border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-sans font-medium text-ink block">
                  Concrete RCC Slab
                </span>
                <span className="text-[11px] text-muted">
                  Thermal mass attenuates peak (τ ≈ 3.4h)
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-ink tabular-nums block">
                  {dayState.rccIndoorTemp.toFixed(1)}°C
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono text-ink">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskHex(45) }} />
                  {dayState.rccAlertGrade}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs font-mono text-muted pt-1">
            ● At 15:00: Tin indoor spikes +2.4°C above outdoor ambient, while concrete envelope buffers indoor heat.
          </p>
        </div>

        {/* Panel 2: 03:00 Nocturnal Trapping */}
        <div className="p-6 rounded-[8px] bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-xs font-mono font-medium text-ink">03:00 NOCTURNAL RETENTION</span>
            </div>
            <span className="text-xs font-mono text-muted">
              Outdoor Ambient: <strong className="text-ink">{nightState.outdoorTemp.toFixed(1)}°C</strong>
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {/* Tin House */}
            <div className="p-3.5 rounded-[6px] bg-raised border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-sans font-medium text-ink block">
                  Informal Corrugated Tin
                </span>
                <span className="text-[11px] text-muted">
                  Rapid nocturnal radiation to ambient
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-ink tabular-nums block">
                  {nightState.tinIndoorTemp.toFixed(1)}°C
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono text-ink">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskHex(20) }} />
                  {nightState.tinAlertGrade}
                </span>
              </div>
            </div>

            {/* RCC House */}
            <div className="p-3.5 rounded-[6px] bg-raised border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-sans font-medium text-ink block">
                  Concrete RCC Slab
                </span>
                <span className="text-[11px] text-muted">
                  Delayed release: trapped sensible heat
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-ink tabular-nums block">
                  {nightState.rccIndoorTemp.toFixed(1)}°C
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono text-ink">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskHex(65) }} />
                  {nightState.rccAlertGrade}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs font-mono text-muted pt-1">
            ● At 03:00: Concrete slab acts as a nocturnal thermal battery (+3.1°C), preventing core physiological recovery.
          </p>
        </div>
      </div>
    </div>
  );
};
