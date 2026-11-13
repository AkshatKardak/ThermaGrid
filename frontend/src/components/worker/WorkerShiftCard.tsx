import React, { useState, useRef } from 'react';
import { Printer, Copy, Share2, Check, Clock, Droplets, ShieldCheck } from 'lucide-react';
import { useWorkerShiftCard } from '../../hooks/useWorkerShiftCard';
import { Card } from '../ui/Card';
import { TYPOGRAPHY } from '../../theme/typography';
import { getRiskBand } from '../../theme/tokens';

interface WorkerShiftCardProps {
  locationId: number;
}

export const WorkerShiftCard: React.FC<WorkerShiftCardProps> = ({ locationId }) => {
  const [met, setMet] = useState(6.0);
  const [exposure, setExposure] = useState('sun');
  const [clothing, setClothing] = useState('normal');
  const [acclimatised, setAcclimatised] = useState(true);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data } = useWorkerShiftCard(locationId, met, exposure, start, end, clothing, acclimatised);

  const handleCopyText = () => {
    if (!data) return;
    const text = `
THERMAGRID WORKER HEAT SAFETY SHIFT CARD
Ward: ${data.ward_name} · Shift: ${data.start} – ${data.end}
Exposure: ${data.exposure.toUpperCase()} · Work Rate: ${met === 4.0 ? 'Moderate' : met === 6.0 ? 'Heavy' : 'Very Heavy'}
Water to drink: ${data.water_ml_per_hour} mL per hour (continuous intake)
Best time for heavy work: ${data.recommended_heavy_work_window}

SCHEDULED BREAKS (ISO 7243 Compliant):
${data.breaks.map((b) => `• ${b.start} – ${b.end}: ${b.reason} (${b.duration || 'Rest'})`).join('\n')}

NOTICE: ${data.disclaimer}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Worker Shift Card - ${data.ward_name}`,
          text: `Today's Heat Shift Schedule for ${data.ward_name}: Drink ${data.water_ml_per_hour}mL/hr water. Heavy work window: ${data.recommended_heavy_work_window}.`,
        });
      } catch {
        // Share dismissed
      }
    } else {
      handleCopyText();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <Card className="p-5 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-accent block mb-1">
              ISO 7243 Work-Rest Dispatch
            </span>
            <h3 className={`${TYPOGRAPHY.h3} text-ink`}>Make today's card</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-[6px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy text'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-[6px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Shift Options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="font-mono text-[10px] uppercase text-muted block mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-raised border border-border rounded-[6px] p-2 text-ink font-mono text-xs outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-muted block mb-1">
              End Time
            </label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-raised border border-border rounded-[6px] p-2 text-ink font-mono text-xs outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-muted block mb-1">
              Sun Exposure
            </label>
            <select
              value={exposure}
              onChange={(e) => setExposure(e.target.value)}
              className="w-full bg-raised border border-border rounded-[6px] p-2 text-ink font-mono text-xs outline-none focus:border-accent"
            >
              <option value="sun">Direct Sunlight</option>
              <option value="shade">Covered / Shaded</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-muted block mb-1" title="Metabolic Equivalent of Task (MET)">
              Work Intensity
            </label>
            <select
              value={met}
              onChange={(e) => setMet(Number(e.target.value))}
              className="w-full bg-raised border border-border rounded-[6px] p-2 text-ink font-mono text-xs outline-none focus:border-accent"
            >
              <option value={4.0} title="4.0 MET">Moderate work</option>
              <option value={6.0} title="6.0 MET">Heavy work</option>
              <option value={8.0} title="8.0 MET">Very heavy work</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-muted block mb-1">
              Clothing (CAV)
            </label>
            <select
              value={clothing}
              onChange={(e) => setClothing(e.target.value)}
              className="w-full bg-raised border border-border rounded-[6px] p-2 text-ink font-mono text-xs outline-none focus:border-accent"
            >
              <option value="light">Light (+0°C CAV)</option>
              <option value="normal">Standard (+1°C CAV)</option>
              <option value="heavy">Heavy PPE (+3°C CAV)</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-muted block mb-1">
              Acclimatisation
            </label>
            <select
              value={acclimatised ? 'yes' : 'no'}
              onChange={(e) => setAcclimatised(e.target.value === 'yes')}
              className="w-full bg-raised border border-border rounded-[6px] p-2 text-ink font-mono text-xs outline-none focus:border-accent"
            >
              <option value="yes">Acclimatised</option>
              <option value="no">Unacclimatised (+2°C)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Printable Shift Card (A5 Ratio Container) */}
      <div
        ref={cardRef}
        id="printable-shift-card"
        className="shift-card-print bg-surface border border-border rounded-[8px] p-6 sm:p-8 space-y-6 relative corner-ticks text-ink"
      >
        {/* Printable Card Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent px-2 py-0.5 rounded-[4px] bg-raised border border-border">
                Official Shift Advisory
              </span>
              <span className="text-xs font-mono text-muted">
                ISO 7243 Heat Stress Standard
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
              {data?.ward_name || `Ward Location #${locationId}`}
            </h2>
            <p className="text-xs text-muted font-mono">
              Shift Hours: {data?.start} – {data?.end} · Exposure: {data?.exposure.toUpperCase()} · Clothing: {data?.clothing?.toUpperCase() || 'NORMAL'} · {data?.acclimatised !== false ? 'Acclimatised' : 'Unacclimatised (+2°C limit)'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted block" title="Max Effective WBGT">
              Hottest part of the shift
            </span>
            <span className="text-2xl font-mono font-bold text-ink tabular-nums">
              {data?.max_wbgt_c.toFixed(1)}°C
            </span>
            <span className="text-[10px] text-muted block">WBGT · ISO 7243</span>
          </div>
        </div>

        {/* 2 Core Directives: Hydration & Heavy Work Windows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-[6px] bg-raised border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-surface text-accent flex items-center justify-center shrink-0 border border-border">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-muted block" title="Hydration Target">
                Water to drink today
              </span>
              <span className="text-lg font-mono font-bold text-ink tabular-nums">
                {data?.water_ml_per_hour} mL / hour
              </span>
              <p className="text-[10px] text-muted">Small cups every 15-20 min; add electrolytes</p>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-raised border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-surface text-accent flex items-center justify-center shrink-0 border border-border">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-muted block" title="Recommended Heavy Work">
                Best time for heavy work
              </span>
              <span className="text-sm font-mono font-bold text-ink">
                {data?.recommended_heavy_work_window}
              </span>
              <p className="text-[10px] text-muted">Avoid strenuous exertion during peak solar hours</p>
            </div>
          </div>
        </div>

        {/* Horizontal Breaks Timeline */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted block" title="Scheduled Rest Intervals">
            Scheduled Breaks
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data?.breaks.map((b, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[6px] bg-raised border border-border space-y-1 relative"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-ink">{b.start} – {b.end}</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] bg-surface text-muted border border-border">
                    {b.duration || 'Rest'}
                  </span>
                </div>
                <p className="text-xs text-muted">{b.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Diurnal WBGT Hourly Rail */}
        {data?.wbgt_series && data.wbgt_series.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
              Shift Diurnal WBGT Progression
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {data.wbgt_series.map((item, idx) => {
                const band = getRiskBand(item.wbgt_c >= 32 ? 80 : item.wbgt_c >= 29 ? 55 : 20);
                return (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-[4px] bg-raised border border-border text-center shrink-0 font-mono"
                  >
                    <span className="text-[9px] text-muted block">{item.time}</span>
                    <span className="text-xs font-bold text-ink tabular-nums flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                      {item.wbgt_c}°C
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Statutory Disclaimer on Card */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-4 text-[10px] font-mono text-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>{data?.disclaimer || 'Advisory only — not medical advice.'}</span>
          </div>
          <span className="font-bold text-risk-5 flex items-center gap-1 text-xs">Emergency: call 108</span>
        </div>
      </div>
    </div>
  );
};
