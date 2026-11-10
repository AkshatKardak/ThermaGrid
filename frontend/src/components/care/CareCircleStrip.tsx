import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Phone } from 'lucide-react';
import { useDependents } from '../../hooks/useDependents';
import { getRiskBand } from '../../theme/tokens';

export const CareCircleStrip: React.FC = () => {
  const { data: dependents, isLoading } = useDependents();

  if (isLoading || !dependents || dependents.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-raised border border-border text-risk-4 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ink">Care Circle (People You Watch)</h4>
            <p className="text-[11px] text-muted">
              Monitor elderly family members and loved ones across different wards.
            </p>
          </div>
        </div>

        <Link
          to="/app/account"
          className="text-xs font-mono text-accent hover:text-accent-hover flex items-center gap-1 shrink-0 font-medium"
        >
          <span>Add person</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-risk-4" />
          <span className="font-mono text-muted uppercase text-[11px] tracking-wider">
            People You Watch ({dependents.length})
          </span>
        </div>
        <Link
          to="/app/account"
          className="text-[11px] font-mono text-accent hover:underline"
        >
          Manage Circle →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {dependents.map((person) => {
          const score = person.current_risk_score ?? 50;
          const bandDef = getRiskBand(score);
          const needsAlert = score >= 65;

          return (
            <div
              key={person.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                needsAlert
                  ? 'bg-[color-mix(in_srgb,var(--risk-4)_12%,var(--surface))] border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]'
                  : 'bg-surface border-border'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink truncate">{person.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase"
                    style={{
                      color: bandDef.code === 'extreme' ? 'var(--risk-5)' : 'var(--ink)',
                      backgroundColor: `color-mix(in srgb, ${bandDef.color} 15%, var(--surface))`,
                      border: `1px solid color-mix(in srgb, ${bandDef.color} ${bandDef.code === 'moderate' ? '60%' : '55%'}, var(--ink))`,
                    }}
                  >
                    {person.current_band || bandDef.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted truncate">
                  {person.ward_name || `Ward #${person.ward_id}`} · Risk {Math.round(score)}/100
                </p>
              </div>

              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  className="px-2.5 py-1 rounded-lg bg-raised hover:bg-surface border border-border text-[11px] font-mono text-ink flex items-center gap-1 shrink-0 transition-colors"
                  title={`Call ${person.name}`}
                >
                  <Phone className="w-3 h-3 text-accent" />
                  <span>Call</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
