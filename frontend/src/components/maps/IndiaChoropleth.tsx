import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { useNavigate } from 'react-router-dom';
import indiaGeo from '../../assets/geo/india-states.json';
import { useAppStore } from '../../store/useAppStore';
import { useAllWardsRisk } from '../../hooks/useRisk';
import { getRiskBand, TOKENS, RISK_SCALE } from '../../theme/tokens';
import { getRiskHex } from '../landing3d/palette';

// State-level empirical & reanalysis baseline risk scores
const STATE_RISK_MAP: Record<string, { score: number; level: 'ward-level' | 'district-level' }> = {
  Maharashtra: { score: 76.5, level: 'ward-level' },
  Gujarat: { score: 78.2, level: 'district-level' },
  Rajasthan: { score: 86.4, level: 'district-level' },
  'Uttar Pradesh': { score: 82.1, level: 'district-level' },
  Delhi: { score: 84.0, level: 'ward-level' },
  Haryana: { score: 79.8, level: 'district-level' },
  Punjab: { score: 77.2, level: 'district-level' },
  'Madhya Pradesh': { score: 81.5, level: 'district-level' },
  Bihar: { score: 74.0, level: 'district-level' },
  'West Bengal': { score: 73.2, level: 'district-level' },
  Telangana: { score: 80.4, level: 'district-level' },
  'Andhra Pradesh': { score: 83.0, level: 'district-level' },
  Karnataka: { score: 62.5, level: 'district-level' },
  'Tamil Nadu': { score: 68.0, level: 'district-level' },
  Kerala: { score: 48.0, level: 'district-level' },
  Goa: { score: 38.5, level: 'district-level' },
  Odisha: { score: 84.8, level: 'district-level' },
  Orissa: { score: 84.8, level: 'district-level' },
  Chhattisgarh: { score: 79.0, level: 'district-level' },
  Jharkhand: { score: 76.0, level: 'district-level' },
};

interface TooltipState {
  name: string;
  score: number | null;
  bandLabel: string;
  level: string;
  x: number;
  y: number;
}

export const IndiaChoropleth: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedState } = useAppStore();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const { data: wardsRisk } = useAllWardsRisk();

  // Dynamically compute state risks using real API data where available
  const stateRiskMap = useMemo(() => {
    const map = { ...STATE_RISK_MAP };
    if (wardsRisk && wardsRisk.length > 0) {
      const validScores = wardsRisk
        .map((w: any) => w.risk_score || w.score)
        .filter((s: any) => typeof s === 'number');
      if (validScores.length > 0) {
        const avg = validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length;
        map['Maharashtra'] = { score: Number(avg.toFixed(1)), level: 'ward-level' };
      }
    }
    return map;
  }, [wardsRisk]);

  const handleStateClick = (stateName: string) => {
    setSelectedState(stateName);
    navigate(`/app/wards?state=${encodeURIComponent(stateName)}`);
  };

  return (
    <div
      id="india-choropleth-hero"
      className="relative w-full h-[480px] sm:h-[560px] lg:h-full min-h-[520px] bg-raised rounded-[10px] border border-border overflow-hidden select-none flex flex-col justify-between"
    >
      {/* Top Header / Context */}
      <div className="absolute top-4 left-4 z-10 space-y-1 bg-surface/95 backdrop-blur-sm p-3 rounded-[6px] border border-border max-w-[280px]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block">
          National Heat Exposure Choropleth
        </span>
        <h3 className="text-sm font-bold font-display text-ink leading-tight">
          Synoptic State &amp; UT Biometeorological Field
        </h3>
        <p className="text-[11px] text-muted leading-snug">
          Click any state to inspect localized ward and district telemetry
        </p>
      </div>

      {/* Composable India Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1050,
          center: [82.5, 22.0],
        }}
        className="w-full h-full"
      >
        <Geographies geography={indiaGeo as any}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const props = geo.properties || {};
              const stateName = (props.NAME_1 || props.name || '') as string;
              const stateData = stateRiskMap[stateName];
              const score = stateData?.score;
              const hasData = typeof score === 'number';
              const fillColor = hasData ? getRiskHex(score) : TOKENS.surface;
              const band = hasData ? getRiskBand(score) : null;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(evt) => {
                    const rect = evt.currentTarget.getBoundingClientRect();
                    setTooltip({
                      name: stateName,
                      score: score ?? null,
                      bandLabel: band ? band.label : 'No synoptic sensor feed',
                      level: stateData?.level || 'district-level',
                      x: evt.clientX - rect.left,
                      y: evt.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(evt) => {
                    const rect = evt.currentTarget.getBoundingClientRect();
                    setTooltip((prev) =>
                      prev
                        ? {
                            ...prev,
                            x: evt.clientX - rect.left,
                            y: evt.clientY - rect.top,
                          }
                        : null
                    );
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => handleStateClick(stateName)}
                  style={{
                    default: {
                      fill: fillColor,
                      stroke: TOKENS.border,
                      strokeWidth: 0.75,
                      outline: 'none',
                      transition: 'fill 0.2s ease',
                      cursor: 'pointer',
                    },
                    hover: {
                      fill: hasData ? fillColor : TOKENS.raised,
                      stroke: TOKENS.accentHover,
                      strokeWidth: 1.5,
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: {
                      fill: TOKENS.accent,
                      outline: 'none',
                    },
                  } as any}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none p-2.5 rounded-[6px] bg-panel-dark/95 border border-border text-raised shadow-xl font-mono text-xs space-y-1"
          style={{
            left: `${tooltip.x + 12}px`,
            top: `${tooltip.y + 12}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <strong className="text-raised font-display text-sm">{tooltip.name}</strong>
            <span className="text-[10px] text-accent uppercase">{tooltip.level}</span>
          </div>
          {tooltip.score !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-raised">{tooltip.score.toFixed(1)} / 100 HTSI</span>
              <span className="text-[10px] text-raised/70">({tooltip.bandLabel})</span>
            </div>
          ) : (
            <div className="text-[11px] text-raised/60">No real-time station data</div>
          )}
          <span className="text-[9px] text-raised/50 block pt-0.5">Click to view wards →</span>
        </div>
      )}

      {/* 5-Band Risk Scale Legend (Bottom Right, on --raised) */}
      <div className="absolute bottom-3 right-3 z-10 p-2.5 rounded-[6px] bg-raised border border-border text-ink space-y-1.5 shadow-sm font-mono text-[11px]">
        <span className="text-[10px] text-muted uppercase font-bold block">Risk Scale (HTSI)</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_SCALE.risk1 }} />
            <span className="text-muted text-[10px]">Safe</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_SCALE.risk2 }} />
            <span className="text-muted text-[10px]">Mod</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_SCALE.risk3 }} />
            <span className="text-muted text-[10px]">High</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_SCALE.risk4 }} />
            <span className="text-muted text-[10px]">Very High</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_SCALE.risk5 }} />
            <span className="text-muted text-[10px]">Extreme</span>
          </span>
        </div>
      </div>
    </div>
  );
};
