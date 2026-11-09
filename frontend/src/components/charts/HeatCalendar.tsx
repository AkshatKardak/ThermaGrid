import React, { useState } from 'react';
import { getRiskBand } from '../../theme/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

// Deterministic historical stress simulation for Indian cities (March-June peak)
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
        <span className="text-xs font-mono uppercase tracking-[0.10em] text-[#8B9AA8]">
          Synoptic Heat Stress Matrix (Monthly Average HTSI)
        </span>
        {hoveredCell && (
          <div className="text-xs font-mono text-[#D7E0E7] bg-[#0B141B] px-2.5 py-1 rounded border border-white/10">
            {hoveredCell.month} {hoveredCell.year}:{' '}
            <span
              className="font-bold"
              style={{ color: getRiskBand(hoveredCell.score).color }}
            >
              HTSI {hoveredCell.score} ({getRiskBand(hoveredCell.score).label})
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-[11px] font-medium text-[#5F7183] w-16">
                Year
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="p-2 text-center text-[11px] font-medium text-[#8B9AA8]"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YEARS.map((year) => (
              <tr key={year} className="border-t border-white/5">
                <td className="p-2 text-left text-[#8B9AA8] font-bold">{year}</td>
                {MONTHS.map((month, mIdx) => {
                  const score = getHistoricalRisk(year, mIdx);
                  const band = getRiskBand(score);

                  return (
                    <td key={month} className="p-1 text-center">
                      <div
                        onMouseEnter={() => setHoveredCell({ year, month, score })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className="w-full h-8 rounded-[4px] flex items-center justify-center font-bold text-[11px] tabular-nums transition-transform duration-100 hover:scale-110 cursor-pointer border border-black/20"
                        style={{
                          backgroundColor: `${band.color}25`,
                          color: band.color,
                          borderColor: `${band.color}40`,
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

      <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] font-mono text-[#8B9AA8] pt-1">
        <span>Low (&lt;25)</span>
        <span className="w-3 h-3 rounded bg-[#2FA37C]/40 border border-[#2FA37C]" />
        <span>Moderate (25-50)</span>
        <span className="w-3 h-3 rounded bg-[#E8C547]/40 border border-[#E8C547]" />
        <span>High (50-70)</span>
        <span className="w-3 h-3 rounded bg-[#F59E0B]/40 border border-[#F59E0B]" />
        <span>Very High (70-85)</span>
        <span className="w-3 h-3 rounded bg-[#FF704F]/40 border border-[#FF704F]" />
        <span>Extreme (85+)</span>
        <span className="w-3 h-3 rounded bg-[#C31D3C]/40 border border-[#C31D3C]" />
      </div>
    </div>
  );
};
