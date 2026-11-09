import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react';
import { useSafeWindows, SafeWindow } from '../../hooks/usePlanner';
import { Card } from '../ui/Card';
import { getRiskBand, THEME_COLORS } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';

interface SafeWindowCardProps {
  locationId: number;
}

const ACTIVITIES = [
  { id: 'walk', label: 'Walk' },
  { id: 'commute', label: 'Commute' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'work', label: 'Work' },
];

export const SafeWindowCard: React.FC<SafeWindowCardProps> = ({ locationId }) => {
  const [activity, setActivity] = useState('walk');
  const [durationMin, setDurationMin] = useState(45);
  const [expandedWindowIndex, setExpandedWindowIndex] = useState<number | null>(null);

  const { data, isLoading } = useSafeWindows(locationId, activity, durationMin);

  const toggleExpand = (idx: number) => {
    setExpandedWindowIndex(expandedWindowIndex === idx ? null : idx);
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8B9AA8] block mb-1">
            Activity Safe-Window Planner
          </span>
          <h3 className={`${TYPOGRAPHY.h3} text-white`}>When Can I Go Out?</h3>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Sliding diurnal risk analysis calibrated to your activity's thermal threshold.
          </p>
        </div>

        {/* Activity Segmented Control */}
        <div className="flex items-center p-1 bg-[#101820] rounded-[8px] border border-white/10 self-start sm:self-auto">
          {ACTIVITIES.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => setActivity(act.id)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-all cursor-pointer ${
                activity === act.id
                  ? 'bg-[#7FA6C9] text-white shadow-sm font-semibold'
                  : 'text-[#8B9AA8] hover:text-[#D7E0E7]'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[#8B9AA8] uppercase text-[11px] tracking-wider">
            Planned Duration
          </span>
          <span className="font-mono text-white font-bold bg-[#101820] px-2 py-0.5 rounded border border-white/10">
            {durationMin} minutes
          </span>
        </div>
        <input
          type="range"
          min={15}
          max={180}
          step={15}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="w-full accent-[#7FA6C9] h-1.5 bg-[#101820] rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-[#5F7183]">
          <span>15 min</span>
          <span>45 min</span>
          <span>90 min</span>
          <span>180 min</span>
        </div>
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Zero-State Warning if no safe window exists */}
          {data?.no_safe_window_message && (
            <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#D7E0E7] space-y-1">
              <div className="flex items-center gap-2 text-[#F59E0B] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No Safe Window Available Today</span>
              </div>
              <p className="text-[11px] text-[#8B9AA8] leading-relaxed">
                {data.no_safe_window_message}
              </p>
            </div>
          )}

          {/* Safe Window Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
              Recommended Safe Windows (Threshold: {data?.threshold}/100)
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              <AnimatePresence mode="popLayout">
                {data?.windows && data.windows.length > 0 ? (
                  data.windows.map((win, idx) => {
                    const bandDef = getRiskBand(win.peak_risk);
                    const isExpanded = expandedWindowIndex === idx;

                    return (
                      <motion.div
                        key={`${win.start}-${idx}`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25, delay: idx * 0.07 }}
                        className="rounded-xl border transition-all overflow-hidden"
                        style={{
                          backgroundColor: '#101820',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpand(idx)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/[0.02] cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: bandDef.color }}
                            />
                            <div>
                              <span className="text-sm font-mono font-bold text-white tracking-wide">
                                {win.start} – {win.end}
                              </span>
                              <span className="text-xs text-[#8B9AA8] ml-2">
                                · Peak Risk {win.peak_risk} ({bandDef.label})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold"
                              style={{
                                color: bandDef.color,
                                backgroundColor: `${bandDef.color}20`,
                              }}
                            >
                              Optimal #{idx + 1}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#8B9AA8]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#8B9AA8]" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 text-xs text-[#8B9AA8] border-t border-white/5 bg-white/[0.01] space-y-1 animate-in fade-in duration-150">
                            <p className="text-white font-medium">{win.why}</p>
                            <p className="text-[11px] text-[#5F7183]">
                              Mean thermal loading: {win.mean_risk}/100 across the {durationMin} min duration.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#101820] border border-white/10 text-xs text-[#8B9AA8]">
                    No window satisfies the strict thermal limit for {activity}.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Avoid Block (Worst diurnal window) */}
          {data?.avoid && data.avoid.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF704F] block mb-2">
                Dangerous Window To Avoid
              </span>
              {data.avoid.map((avoidBlock, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#C31D3C]/10 border border-[#C31D3C]/30 flex items-center justify-between animate-pulse-once"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-[#FF704F]">
                        Avoid {avoidBlock.start} – {avoidBlock.end}
                      </span>
                      <span className="text-xs text-[#8B9AA8]">
                        · Peak Risk {avoidBlock.peak_risk}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D7E0E7]">{avoidBlock.why}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-mono uppercase font-bold bg-[#C31D3C]/20 text-[#FF704F] shrink-0 ml-3">
                    High Danger
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
