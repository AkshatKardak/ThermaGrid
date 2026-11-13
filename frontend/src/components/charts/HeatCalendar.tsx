import React, { useState } from 'react';
import { getRiskBand } from '../../theme/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

// Deterministic historical heat stress dataset for Indian cities (March-June peak)
function getHistoricalRisk(year: number, monthIndex: number): number {
  const baseCurve = [24, 32, 58, 82, 89, 74, 52, 44, 46, 42, 30, 22];
  const yearAnomaly = (year - 2021) * 2.8; // Climate warming trend
  const value = baseCurve[monthIndex] + yearAnomaly;
  return Math.min(98, Math.max(15, Math.round(value)));
}

export const HeatCalendar: React.FC = () => {
  const [hoveredCell, setHoveredCell] = useState<{
    year: number;
    month: string;
    score: number;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
          Monthly Heat Danger History (Average Risk Score)
        </span>
        {hoveredCell && (
          <div className="text-xs font-mono text-ink bg-raised px-2.5 py-1 rounded-[4px] border border-border flex items-center gap-1.5">
            <span>{hoveredCell.month} {hoveredCell.year}:</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getRiskBand(hoveredCell.score).color }}
            />
            <span className="font-bold">
              HTSI {hoveredCell.score} ({getRiskBand(hoveredCell.score).label})
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-[11px] font-medium text-muted w-16">
                Year
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="p-2 text-center text-[11px] font-medium text-muted"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YEARS.map((year) => (
              <tr key={year} className="border-t border-border">
                <td className="p-2 text-left text-muted font-bold">{year}</td>
                {MONTHS.map((month, mIdx) => {
                  const score = getHistoricalRisk(year, mIdx);
                  const band = getRiskBand(score);
                  const isModerate = band.code === 'moderate';
                  const isExtreme = band.code === 'extreme';

                  return (
                    <td key={month} className="p-1 text-center">
                      <div
                        onMouseEnter={() => setHoveredCell({ year, month, score })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-full h-8 rounded-[4px] flex items-center justify-center font-bold text-[11px] tabular-nums transition-transform duration-100 hover:scale-105 cursor-pointer border ${
                          isExtreme ? 'text-risk-5' : 'text-ink'
                        }`}
                        style={{
                          backgroundColor: `color-mix(in srgb, ${band.color} ${isModerate ? '20%' : '15%'}, var(--surface))`,
                          borderColor: `color-mix(in srgb, ${band.color} ${isModerate ? '60%' : '55%'}, var(--ink))`,
                        }}
                      >
                        {score}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] font-mono text-muted pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[color-mix(in_srgb,var(--risk-1)_20%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]" />
          Low (&lt;25)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[color-mix(in_srgb,var(--risk-2)_25%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-2)_60%,var(--ink))]" />
          Moderate (25-50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[color-mix(in_srgb,var(--risk-3)_20%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-3)_55%,var(--ink))]" />
          High (50-70)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[color-mix(in_srgb,var(--risk-4)_20%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]" />
          Very High (70-85)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[color-mix(in_srgb,var(--risk-5)_20%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-5)_55%,var(--ink))]" />
          Extreme (85+)
        </span>
      </div>
    </div>
  );
};
