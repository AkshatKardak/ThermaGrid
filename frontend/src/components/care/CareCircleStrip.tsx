import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, AlertTriangle, ArrowRight, Phone, ShieldCheck } from 'lucide-react';
import { useDependents } from '../../hooks/useDependents';
import { getRiskBand } from '../../theme/tokens';

export const CareCircleStrip: React.FC = () => {
  const { data: dependents, isLoading } = useDependents();

  if (isLoading || !dependents || dependents.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[#1F3445]/60 border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/5 text-[#FF704F] flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Care Circle (People You Watch)</h4>
            <p className="text-[11px] text-[#8B9AA8]">
              Monitor elderly family members and loved ones across different wards.
            </p>
          </div>
        </div>

        <Link
          to="/app/account"
          className="text-xs font-mono text-[#7FA6C9] hover:text-[#5C82A3] flex items-center gap-1 shrink-0 font-medium"
        >
          <span>Add person</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Filter for people in high/veryhigh/extreme wards
  const alertPeople = dependents.filter(
    (d) => (d.current_risk_score ?? 0) >= 50 || d.current_band === 'high' || d.current_band === 'veryhigh' || d.current_band === 'extreme'
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-[#FF704F]" />
          <span className="font-mono text-[#8B9AA8] uppercase text-[11px] tracking-wider">
            People You Watch ({dependents.length})
          </span>
        </div>
        <Link
          to="/app/account"
          className="text-[11px] font-mono text-[#7FA6C9] hover:underline"
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
                  ? 'bg-[#FF704F]/10 border-[#FF704F]/40'
                  : 'bg-[#101820] border-white/10'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{person.name}</span>
                  <span
                    className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase"
                    style={{
                      color: bandDef.color,
                      backgroundColor: `${bandDef.color}20`,
                    }}
                  >
                    {person.current_band || bandDef.label}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B9AA8] truncate">
                  {person.ward_name || `Ward #${person.ward_id}`} · Risk {Math.round(score)}/100
                </p>
              </div>

              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-white flex items-center gap-1 shrink-0"
                  title={`Call ${person.name}`}
                >
                  <Phone className="w-3 h-3 text-[#2FA37C]" />
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
