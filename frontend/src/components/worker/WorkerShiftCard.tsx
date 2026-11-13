import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Copy,
  Share2,
  Check,
  Clock,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Info,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkerShiftCard, ShiftBreak } from '../../hooks/useWorkerShiftCard';
import { Card } from '../ui/Card';
import { TYPOGRAPHY } from '../../theme/typography';
import { getRiskBand } from '../../theme/tokens';

interface WorkerShiftCardProps {
  locationId: number;
}

const PRESETS = [
  {
    id: 'construction',
    label: 'Construction & Roofing',
    icon: '🏗️',
    met: 8.0,
    exposure: 'sun',
    clothing: 'normal',
    acclimatised: true,
  },
  {
    id: 'agriculture',
    label: 'Field Agriculture',
    icon: '🌾',
    met: 6.0,
    exposure: 'sun',
    clothing: 'light',
    acclimatised: true,
  },
  {
    id: 'traffic',
    label: 'Traffic & Delivery',
    icon: '🦺',
    met: 4.0,
    exposure: 'sun',
    clothing: 'normal',
    acclimatised: true,
  },
  {
    id: 'factory',
    label: 'Foundry & Indoor Plant',
    icon: '🏭',
    met: 8.0,
    exposure: 'shade',
    clothing: 'heavy',
    acclimatised: false,
  },
];

export const WorkerShiftCard: React.FC<WorkerShiftCardProps> = ({ locationId }) => {
  const [met, setMet] = useState(6.0);
  const [exposure, setExposure] = useState('sun');
  const [clothing, setClothing] = useState('normal');
  const [acclimatised, setAcclimatised] = useState(true);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Interactive Features State
  const [simulatedHour, setSimulatedHour] = useState<number>(14);
  const [loggedWater, setLoggedWater] = useState<number>(1250);
  const [expandedBreakIdx, setExpandedBreakIdx] = useState<number | null>(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [breakTimer, setBreakTimer] = useState<number>(900); // 15 min default (in seconds)
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useWorkerShiftCard(
    locationId,
    met,
    exposure,
    start,
    end,
    clothing,
    acclimatised
  );

  // Break Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && breakTimer > 0) {
      interval = setInterval(() => {
        setBreakTimer((prev) => Math.max(prev - 1, 0));
      }, 1000);
    } else if (breakTimer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, breakTimer]);

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setActivePreset(p.id);
    setMet(p.met);
    setExposure(p.exposure);
    setClothing(p.clothing);
    setAcclimatised(p.acclimatised);
  };

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
EMERGENCY: Call 108 immediately for symptoms of heat stroke.
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
          text: `Today's Heat Shift Schedule for ${data.ward_name}: Drink ${data.water_ml_per_hour}mL/hr water. Heavy work window: ${data.recommended_heavy_work_window}. Emergency Call 108.`,
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

  // Calculate shift duration and target water
  const startH = parseInt(start.split(':')[0], 10) || 9;
  const endH = parseInt(end.split(':')[0], 10) || 18;
  const shiftHours = Math.max(endH - startH, 4);
  const totalWaterTarget = (data?.water_ml_per_hour || 750) * shiftHours;
  const hydrationPct = Math.min(Math.round((loggedWater / (totalWaterTarget || 1)) * 100), 150);

  // Find active series item based on simulated hour
  const currentSeriesItem = data?.wbgt_series?.find((s) => s.hour === simulatedHour) ||
    data?.wbgt_series?.[Math.floor((data?.wbgt_series?.length || 1) / 2)] || {
      hour: simulatedHour,
      time: `${simulatedHour}:00`,
      wbgt_c: data?.max_wbgt_c || 32.5,
      temperature_c: 38.0,
      risk_score: 80,
    };

  // Determine ISO 7243 Work/Rest ratio for active simulated hour
  const activeWbgt = currentSeriesItem.wbgt_c;
  let workRestRatioText = 'Continuous Work Permitted (Take Hydration Breaks)';
  let workRestBadgeClass = 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-1)_40%,var(--ink))]';
  if (activeWbgt >= 32.2) {
    workRestRatioText = 'Mandatory 15m Work / 45m Shaded Rest per hour (Severe Strain)';
    workRestBadgeClass = 'bg-[color-mix(in_srgb,var(--risk-5)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-5)_40%,var(--ink))]';
  } else if (activeWbgt >= 30.0) {
    workRestRatioText = '30m Work / 30m Shaded Rest per hour (High Strain)';
    workRestBadgeClass = 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-4)_40%,var(--ink))]';
  } else if (activeWbgt >= 28.0) {
    workRestRatioText = '45m Work / 15m Rest per hour (Moderate Strain)';
    workRestBadgeClass = 'bg-[color-mix(in_srgb,var(--risk-2)_20%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-2)_50%,var(--ink))]';
  }

  // Format timer minutes and seconds
  const timerMins = Math.floor(breakTimer / 60);
  const timerSecs = breakTimer % 60;
  const formattedTimer = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <Card className="p-6 space-y-5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-accent font-semibold block mb-1">
              ISO 7243 Work-Rest Dispatch
            </span>
            <h3 className={`${TYPOGRAPHY.h3} text-ink`}>Interactive Shift Planner</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-[6px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy text'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-[6px] bg-raised hover:bg-surface border border-border text-xs font-mono text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A5 Card</span>
            </button>
          </div>
        </div>

        {/* 1-Click Occupational Profile Presets */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
            Quick Occupational Presets
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`p-2.5 rounded-[6px] border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-raised border-accent ring-1 ring-accent text-ink font-semibold'
                      : 'bg-surface border-border text-muted hover:text-ink hover:bg-raised'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shift Options Form */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs pt-1">
          <div>
            <label className="font-mono text-xs uppercase text-muted block mb-1.5 font-medium">
              Start Time
            </label>
            <input
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setActivePreset(null);
              }}
              className="w-full bg-raised border border-border rounded-[6px] p-2.5 text-ink font-mono text-xs outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-muted block mb-1.5 font-medium">
              End Time
            </label>
            <input
              type="time"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setActivePreset(null);
              }}
              className="w-full bg-raised border border-border rounded-[6px] p-2.5 text-ink font-mono text-xs outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-muted block mb-1.5 font-medium">
              Sun Exposure
            </label>
            <select
              value={exposure}
              onChange={(e) => {
                setExposure(e.target.value);
                setActivePreset(null);
              }}
              className="w-full bg-raised border border-border rounded-[6px] p-2.5 text-ink font-mono text-xs outline-none focus:border-accent cursor-pointer"
            >
              <option value="sun">Direct Sunlight</option>
              <option value="shade">Covered / Shaded</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-muted block mb-1.5 font-medium" title="Metabolic Equivalent of Task (MET)">
              Work Intensity
            </label>
            <select
              value={met}
              onChange={(e) => {
                setMet(Number(e.target.value));
                setActivePreset(null);
              }}
              className="w-full bg-raised border border-border rounded-[6px] p-2.5 text-ink font-mono text-xs outline-none focus:border-accent cursor-pointer"
            >
              <option value={4.0}>Moderate (4.0 MET)</option>
              <option value={6.0}>Heavy (6.0 MET)</option>
              <option value={8.0}>Very heavy (8.0 MET)</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-muted block mb-1.5 font-medium">
              Clothing (CAV)
            </label>
            <select
              value={clothing}
              onChange={(e) => {
                setClothing(e.target.value);
                setActivePreset(null);
              }}
              className="w-full bg-raised border border-border rounded-[6px] p-2.5 text-ink font-mono text-xs outline-none focus:border-accent cursor-pointer"
            >
              <option value="light">Light (+0°C CAV)</option>
              <option value="normal">Standard (+1°C CAV)</option>
              <option value="heavy">Heavy PPE (+3°C CAV)</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-muted block mb-1.5 font-medium">
              Acclimatisation
            </label>
            <select
              value={acclimatised ? 'yes' : 'no'}
              onChange={(e) => {
                setAcclimatised(e.target.value === 'yes');
                setActivePreset(null);
              }}
              className="w-full bg-raised border border-border rounded-[6px] p-2.5 text-ink font-mono text-xs outline-none focus:border-accent cursor-pointer"
            >
              <option value="yes">Acclimatised</option>
              <option value="no">Unacclimatised (+2°C)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Printable / Interactive Shift Card */}
      <div
        ref={cardRef}
        id="printable-shift-card"
        className="shift-card-print bg-surface border border-border rounded-[10px] p-6 sm:p-8 space-y-6 relative text-ink shadow-none"
      >
        {/* Printable Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-[4px] bg-raised border border-border">
                Official Shift Advisory
              </span>
              <span className="text-xs font-mono text-muted">
                ISO 7243 Heat Stress Standard
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
              {data?.ward_name || `Ward Location #${locationId}`}
            </h2>
            <p className="text-xs font-mono text-muted leading-relaxed">
              Shift Hours: <strong className="text-ink">{data?.start || start} – {data?.end || end}</strong> · Exposure:{' '}
              <strong className="text-ink">{exposure.toUpperCase()}</strong> · Clothing:{' '}
              <strong className="text-ink">{clothing.toUpperCase()}</strong> ·{' '}
              {acclimatised ? 'Acclimatised' : 'Unacclimatised (+2°C limit penalty)'}
            </p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-raised border border-border text-left sm:text-right shrink-0 space-y-0.5">
            <span className="text-xs font-mono uppercase text-muted block" title="Max Effective WBGT">
              Hottest part of the shift
            </span>
            <span className="text-3xl font-mono font-bold text-ink tabular-nums block">
              {data?.max_wbgt_c.toFixed(1)}°C
            </span>
            <span className="text-[11px] font-mono text-muted block">WBGT · ISO 7243 Peak</span>
          </div>
        </div>

        {/* 2 Core Directives: Interactive Hydration Tracker & Heavy Work Window */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Hydration Interactive Tracker Card */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-raised border border-border flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-surface text-accent flex items-center justify-center shrink-0 border border-border">
                  <Droplets className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase text-muted block font-medium">
                    Water to drink today
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-ink tabular-nums">
                      {data?.water_ml_per_hour || 750} mL / hour
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono text-muted bg-surface px-2.5 py-1 rounded-[4px] border border-border shrink-0">
                Shift Target: {(totalWaterTarget / 1000).toFixed(1)}L
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Drink small cups every 15–20 minutes continuously; add oral rehydration salts (ORS).
            </p>

            {/* Interactive Hydration Tracker Widget */}
            <div className="pt-3 border-t border-border/60 space-y-2.5 no-print">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted">Today's Intake Log:</span>
                <span className="font-bold text-ink">
                  {loggedWater} mL ({hydrationPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.min(hydrationPct, 100)}%` }}
                />
              </div>

              {/* Quick Logger Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLoggedWater((prev) => prev + 250)}
                  className="flex-1 py-1.5 px-2 rounded-[6px] bg-surface hover:bg-raised border border-border text-xs font-mono text-ink flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-accent" />
                  <span>+250mL (1 Cup)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoggedWater((prev) => prev + 500)}
                  className="flex-1 py-1.5 px-2 rounded-[6px] bg-surface hover:bg-raised border border-border text-xs font-mono text-ink flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-accent" />
                  <span>+500mL Bottle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoggedWater(0)}
                  title="Reset Hydration Count"
                  className="p-1.5 rounded-[6px] bg-surface hover:bg-raised border border-border text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Heavy Work Window & Active Shift Status Card */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-raised border border-border flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-surface text-accent flex items-center justify-center shrink-0 border border-border">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase text-muted block font-medium">
                    Best time for heavy work
                  </span>
                  <span className="text-xl font-mono font-bold text-ink">
                    {data?.recommended_heavy_work_window || '06:00 – 10:30'}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 rounded-[4px] bg-surface border border-border text-accent font-semibold shrink-0">
                Safe Metabolic Zone
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Avoid strenuous physical exertion during peak solar irradiance (11:30 – 16:00).
            </p>

            {/* Simulated Live Condition Indicator */}
            <div className="pt-3 border-t border-border/60 space-y-2 no-print">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted">Simulated Time: <strong>{currentSeriesItem.time}</strong></span>
                <span className="font-bold text-ink">{currentSeriesItem.wbgt_c}°C WBGT</span>
              </div>
              <div className={`p-2 rounded-[6px] border text-xs font-mono leading-tight ${workRestBadgeClass}`}>
                {workRestRatioText}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Shift 24-Hour WBGT Scrubber */}
        <div className="p-5 rounded-[8px] bg-raised border border-border space-y-3 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
                Interactive Shift 24-Hour WBGT Scrubber
              </span>
              <p className="text-xs text-muted">
                Scrub or click an hour to simulate heat strain and ISO 7243 rest requirements:
              </p>
            </div>
            <div className="text-xs font-mono text-ink bg-surface px-3 py-1 rounded-[4px] border border-border font-bold">
              Current: {currentSeriesItem.time} · {currentSeriesItem.wbgt_c}°C WBGT
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="pt-1">
            <input
              type="range"
              min={startH}
              max={endH}
              step={1}
              value={simulatedHour}
              onChange={(e) => setSimulatedHour(parseInt(e.target.value, 10))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-muted pt-1">
              <span>{startH}:00 (Start)</span>
              <span>12:00 (Noon)</span>
              <span>15:00 (Peak Heat)</span>
              <span>{endH}:00 (End)</span>
            </div>
          </div>

          {/* 24-Hour WBGT Hourly Rail */}
          {data?.wbgt_series && data.wbgt_series.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
              {data.wbgt_series.map((item) => {
                const isSelected = item.hour === simulatedHour;
                const band = getRiskBand(item.wbgt_c >= 32 ? 80 : item.wbgt_c >= 29 ? 55 : 20);
                return (
                  <button
                    key={item.hour}
                    type="button"
                    onClick={() => setSimulatedHour(item.hour)}
                    className={`px-3 py-2 rounded-[6px] border text-center shrink-0 font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-raised border-accent ring-2 ring-accent text-ink shadow-none font-bold'
                        : 'bg-surface hover:bg-raised border-border text-muted hover:text-ink'
                    }`}
                  >
                    <span className="text-[10px] block opacity-80">{item.time}</span>
                    <span className="text-xs font-bold text-ink tabular-nums flex items-center justify-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: band.color }} />
                      {item.wbgt_c}°C
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Scheduled Breaks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
              Scheduled Breaks (ISO 7243 Compliant)
            </span>
            <span className="text-xs font-mono text-muted hidden sm:inline">
              Click any break to view protocol &amp; start timer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {data?.breaks.map((b, idx) => {
              const isExpanded = expandedBreakIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setExpandedBreakIdx(isExpanded ? null : idx)}
                  className={`p-4 rounded-[8px] border transition-all cursor-pointer space-y-2 ${
                    isExpanded
                      ? 'bg-raised border-accent ring-1 ring-accent'
                      : 'bg-raised border-border hover:border-accent/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-ink text-sm">{b.start} – {b.end}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-[4px] text-[11px] bg-surface text-muted border border-border font-medium">
                        {b.duration || 'Rest'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{b.reason}</p>

                  {/* Expanded Rest Protocol & Timer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-border/60 space-y-2.5 text-xs no-print"
                      >
                        <div className="text-[11px] font-mono text-muted space-y-1">
                          <p className="flex items-center gap-1 text-ink font-semibold">
                            <Sparkles className="w-3 h-3 text-accent" />
                            Required Protocol:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 text-muted pl-1">
                            <li>Move to shaded shelter (&lt;28°C)</li>
                            <li>Drink 250mL chilled water + ORS</li>
                            <li>Loosen heavy clothing/harness</li>
                          </ul>
                        </div>

                        {/* Interactive Countdown Timer */}
                        <div className="p-2.5 rounded-[6px] bg-surface border border-border flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-ink">
                            Timer: {formattedTimer}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTimerRunning(!isTimerRunning);
                              }}
                              className="px-2 py-1 rounded-[4px] bg-accent text-on-accent text-[11px] font-mono font-medium flex items-center gap-1 shadow-none"
                            >
                              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTimerRunning(false);
                                setBreakTimer(900);
                              }}
                              className="p-1 rounded-[4px] bg-raised hover:bg-surface border border-border text-muted text-[11px]"
                              title="Reset 15m"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statutory Disclaimer & Interactive Emergency 108 Call Button */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted shrink-0" />
            <span>{data?.disclaimer || 'Advisory only — not clinical medical advice.'}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowEmergencyModal(true)}
            className="font-bold text-risk-5 hover:text-risk-5/90 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[6px] bg-surface hover:bg-raised border border-risk-5/30 transition-all cursor-pointer self-start sm:self-auto"
          >
            <PhoneCall className="w-3.5 h-3.5 text-risk-5 animate-pulse" />
            <span>Emergency: call 108 (View Protocol)</span>
          </button>
        </div>
      </div>

      {/* Interactive Emergency 108 Action Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-surface border-2 border-risk-5 rounded-[12px] p-6 sm:p-8 space-y-5 text-ink shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="w-12 h-12 rounded-[8px] bg-risk-5/15 border border-risk-5/40 text-risk-5 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-risk-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-ink">
                    Heat Stroke Emergency Response
                  </h3>
                  <span className="text-xs font-mono text-muted">
                    National Emergency Medical Services · Dial 108
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3.5 rounded-[8px] bg-raised border border-border space-y-1">
                  <span className="font-bold text-ink block text-sm">
                    Critical Red Flags (Heat Stroke vs Heat Exhaustion):
                  </span>
                  <ul className="list-disc list-inside text-muted space-y-1 pl-1">
                    <li>Core body temperature above 40°C (104°F)</li>
                    <li>Altered mental state, confusion, slurred speech, delirium</li>
                    <li>Hot, flushed skin with cessation of sweating</li>
                    <li>Rapid heart rate, nausea, seizures, or fainting</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-[8px] bg-raised border border-border space-y-1.5">
                  <span className="font-bold text-ink block text-sm">
                    Immediate Life-Saving Actions (Before Ambulance Arrives):
                  </span>
                  <ol className="list-decimal list-inside text-muted space-y-1 pl-1">
                    <li>Move the worker to the coldest available shaded area immediately.</li>
                    <li>Loosen all restrictive PPE, boots, and clothing.</li>
                    <li>Douse body with cool water and fan actively to maximize evaporative cooling.</li>
                    <li>Apply ice or chilled cloth to armpits, groin, and neck.</li>
                    <li><strong>Do not force oral fluids</strong> if the person is disoriented or unconscious.</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="tel:108"
                  className="flex-1 py-3 px-4 rounded-[8px] bg-risk-5 hover:bg-risk-5/90 text-on-accent text-center font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-none"
                >
                  <PhoneCall className="w-4 h-4 text-on-accent" />
                  <span>Call 108 Immediately</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-5 py-3 rounded-[8px] bg-raised hover:bg-surface border border-border font-mono text-xs text-ink transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
