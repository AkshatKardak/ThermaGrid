import React, { useState, useRef } from 'react';
import { Printer, Copy, Share2, Check, Clock, Droplets, HardHat, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useWorkerShiftCard } from '../../hooks/useWorkerShiftCard';
import { Card } from '../ui/Card';
import { TYPOGRAPHY } from '../../theme/typography';

interface WorkerShiftCardProps {
  locationId: number;
}

export const WorkerShiftCard: React.FC<WorkerShiftCardProps> = ({ locationId }) => {
  const [met, setMet] = useState(6.0);
  const [exposure, setExposure] = useState('sun');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useWorkerShiftCard(locationId, met, exposure, start, end);

  const handleCopyText = () => {
    if (!data) return;
    const text = `
THERMAGRID WORKER HEAT SAFETY SHIFT CARD
Ward: ${data.ward_name} · Shift: ${data.start} – ${data.end}
Exposure: ${data.exposure.toUpperCase()} · Work Rate: ${data.met} MET
Hydration Target: ${data.water_ml_per_hour} mL per hour (continuous intake)
Heavy Work Window: ${data.recommended_heavy_work_window}

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
      } catch (err) {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#F59E0B] block mb-1">
              ISO 7243 Work-Rest Dispatch
            </span>
            <h3 className={`${TYPOGRAPHY.h3} text-white`}>Generate Worker Shift Card</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#D7E0E7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2FA37C]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy text'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#D7E0E7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#7FA6C9] hover:bg-[#5C82A3] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A5 card</span>
            </button>
          </div>
        </div>

        {/* Shift Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-mono text-[10px] uppercase text-[#8B9AA8] block mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-[#101820] border border-white/10 rounded-lg p-2 text-white font-mono text-xs outline-none"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-[#8B9AA8] block mb-1">
              End Time
            </label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-[#101820] border border-white/10 rounded-lg p-2 text-white font-mono text-xs outline-none"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-[#8B9AA8] block mb-1">
              Sun Exposure
            </label>
            <select
              value={exposure}
              onChange={(e) => setExposure(e.target.value)}
              className="w-full bg-[#101820] border border-white/10 rounded-lg p-2 text-white font-mono text-xs outline-none"
            >
              <option value="sun">Direct Sunlight</option>
              <option value="shade">Covered / Shaded</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-[#8B9AA8] block mb-1">
              Labor Intensity (MET)
            </label>
            <select
              value={met}
              onChange={(e) => setMet(Number(e.target.value))}
              className="w-full bg-[#101820] border border-white/10 rounded-lg p-2 text-white font-mono text-xs outline-none"
            >
              <option value={4.0}>Moderate (4.0 MET)</option>
              <option value={6.0}>Heavy Manual (6.0 MET)</option>
              <option value={8.0}>Very Heavy (8.0 MET)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Printable Shift Card (A5 Ratio Container) */}
      <div
        ref={cardRef}
        id="printable-shift-card"
        className="shift-card-print bg-[#1F3445] border border-white/15 rounded-[14px] p-6 sm:p-8 space-y-6 shadow-2xl relative corner-ticks text-[#D7E0E7]"
      >
        {/* Printable Card Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#7FA6C9] px-2 py-0.5 rounded bg-[#7FA6C9]/15 border border-[#7FA6C9]/30">
                Official Shift Advisory
              </span>
              <span className="text-xs font-mono text-[#8B9AA8]">
                ISO 7243 Heat Stress Standard
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              {data?.ward_name || `Ward Location #${locationId}`}
            </h2>
            <p className="text-xs text-[#8B9AA8] font-mono">
              Shift Hours: {data?.start} – {data?.end} · Exposure: {data?.exposure.toUpperCase()}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-[#8B9AA8] block">Max Effective WBGT</span>
            <span className="text-2xl font-mono font-bold text-[#FF704F]">
              {data?.max_wbgt_c.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* 2 Core Directives: Hydration & Heavy Work Windows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#101820] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8B9AA8] block">Hydration Target</span>
              <span className="text-lg font-mono font-bold text-white">
                {data?.water_ml_per_hour} mL / hour
              </span>
              <p className="text-[10px] text-[#8B9AA8]">Small cups every 15-20 min; add electrolytes</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#101820] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8B9AA8] block">Recommended Heavy Work</span>
              <span className="text-sm font-mono font-bold text-[#F59E0B]">
                {data?.recommended_heavy_work_window}
              </span>
              <p className="text-[10px] text-[#8B9AA8]">Avoid strenuous exertion during peak solar hours</p>
            </div>
          </div>
        </div>

        {/* Horizontal Breaks Timeline */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
            Scheduled Rest Intervals
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data?.breaks.map((b, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#101820] border border-white/10 space-y-1 relative"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#7FA6C9]">{b.start} – {b.end}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-[#8B9AA8]">
                    {b.duration || 'Rest'}
                  </span>
                </div>
                <p className="text-xs text-[#D7E0E7]">{b.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Diurnal WBGT Hourly Rail */}
        {data?.wbgt_series && data.wbgt_series.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F7183] block">
              Shift Diurnal WBGT Progression
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {data.wbgt_series.map((item, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-lg bg-[#101820] border border-white/5 text-center shrink-0"
                >
                  <span className="text-[9px] font-mono text-[#5F7183] block">{item.time}</span>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{
                      color: item.wbgt_c >= 32 ? '#FF704F' : item.wbgt_c >= 29 ? '#F59E0B' : '#2FA37C',
                    }}
                  >
                    {item.wbgt_c}°C
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statutory Disclaimer on Card */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4 text-[10px] font-mono text-[#8B9AA8]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2FA37C] shrink-0" />
            <span>{data?.disclaimer || 'Advisory only — not medical advice.'}</span>
          </div>
          <span className="hidden sm:inline">Emergency SOS: 108</span>
        </div>
      </div>
    </div>
  );
};
