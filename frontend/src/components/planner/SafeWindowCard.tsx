import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useSafeWindows } from '../../hooks/usePlanner';
import { Card } from '../ui/Card';
import { getRiskBand } from '../../theme/tokens';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted block mb-1">
            Activity Safe-Window Planner
          </span>
          <h3 className={`${TYPOGRAPHY.h3} text-ink`}>When Can I Go Out?</h3>
          <p className="text-xs text-muted mt-0.5">
            Sliding daily cycle risk analysis calibrated to your activity's thermal threshold.
          </p>
        </div>

        {/* Activity Segmented Control */}
        <div className="flex items-center p-1 bg-surface rounded-[6px] border border-border self-start sm:self-auto">
          {ACTIVITIES.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => setActivity(act.id)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-medium transition-colors cursor-pointer ${
                activity === act.id
                  ? 'bg-raised text-ink border border-border font-semibold'
                  : 'text-muted hover:text-ink'
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
          <span className="font-mono text-muted uppercase text-[11px] tracking-wider">
            Planned Duration
          </span>
          <span className="font-mono text-ink font-bold bg-raised px-2 py-0.5 rounded-[4px] border border-border">
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
          className="w-full accent-[var(--accent)] h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-muted">
          <span>15 min</span>
          <span>45 min</span>
          <span>90 min</span>
          <span>180 min</span>
        </div>
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="h-14 bg-border/40 rounded-[6px] animate-pulse" />
          <div className="h-14 bg-border/40 rounded-[6px] animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Zero-State Warning if no safe window exists */}
          {data?.no_safe_window_message && (
            <div className="p-3.5 rounded-[6px] bg-[color-mix(in_srgb,var(--risk-3)_12%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-3)_55%,var(--ink))] text-xs text-ink space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-risk-3 shrink-0" />
                <span>No Safe Window Available Today</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                {data.no_safe_window_message}
              </p>
            </div>
          )}

          {/* Safe Window Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
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
                        className="rounded-[6px] border border-border bg-raised transition-colors overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpand(idx)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-surface cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: bandDef.color }}
                            />
                            <div>
                              <span className="text-sm font-mono font-bold text-ink tracking-wide">
                                {win.start} – {win.end}
                              </span>
                              <span className="text-xs text-muted ml-2">
                                · Peak Risk {win.peak_risk} ({bandDef.label})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase font-semibold bg-surface text-ink border border-border inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bandDef.color }} />
                              Optimal #{idx + 1}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 text-xs text-muted border-t border-border bg-surface space-y-1">
                            <p className="text-ink font-medium">{win.why}</p>
                            <p className="text-[11px] text-muted">
                              Mean thermal loading: {win.mean_risk}/100 across the {durationMin} min duration.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-3.5 rounded-[6px] bg-raised border border-border text-xs text-muted">
                    No window satisfies the strict thermal limit for {activity}.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Avoid Block */}
          {data?.avoid && data.avoid.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-error block mb-2 font-semibold">
                Dangerous Window To Avoid
              </span>
              {data.avoid.map((avoidBlock, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[6px] bg-[color-mix(in_srgb,var(--risk-5)_12%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-5)_55%,var(--ink))] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-ink">
                        Avoid {avoidBlock.start} – {avoidBlock.end}
                      </span>
                      <span className="text-xs text-muted">
                        · Peak Risk {avoidBlock.peak_risk}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{avoidBlock.why}</p>
                  </div>
                  <span className="px-2 py-1 rounded-[4px] text-[10px] font-mono uppercase font-bold bg-raised text-error border border-border shrink-0 ml-3">
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
