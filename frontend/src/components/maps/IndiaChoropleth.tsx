import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Minimize2, RotateCcw, Plus, Minus, X } from 'lucide-react';
import indiaGeo from '../../assets/geo/india-states.json';
import indiaBoundary from '../../assets/geo/india-boundary.json';
import { useAppStore } from '../../store/useAppStore';
import { useAllWardsRisk } from '../../hooks/useRisk';
import { getRiskBand, TOKENS, RISK_SCALE } from '../../theme/tokens';
import { getRiskHex } from '../landing3d/palette';
import { formatNumber } from '../../utils/format';

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
  Assam: { score: 67.4, level: 'district-level' },
  'Himachal Pradesh': { score: 52.0, level: 'district-level' },
  Uttarakhand: { score: 58.0, level: 'district-level' },
  'Jammu and Kashmir': { score: 45.0, level: 'district-level' },
  Ladakh: { score: 34.0, level: 'district-level' },
};

interface TooltipState {
  name: string;
  score: number | null;
  bandLabel: string;
  level: string;
  x: number;
  y: number;
}

const DEFAULT_CENTER: [number, number] = [82.5, 22.0];
const DEFAULT_ZOOM = 1;

export const IndiaChoropleth: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedState } = useAppStore();
  const { data: wardsRisk } = useAllWardsRisk();
  const containerRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dynamically compute state risks using real API telemetry where available
  const stateRiskMap = useMemo(() => {
    const map = { ...STATE_RISK_MAP };
    if (wardsRisk && wardsRisk.length > 0) {
      const validScores = wardsRisk
        .map((w: any) => w.risk_score || w.score)
        .filter((s: any) => typeof s === 'number');
      if (validScores.length > 0) {
        const avg = validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length;
        map['Maharashtra'] = { score: avg, level: 'ward-level' };
      }
    }
    return map;
  }, [wardsRisk]);

  // Keyboard navigation & escape listener for expand/collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleStateClick = (stateName: string) => {
    setSelectedState(stateName);
    navigate(`/app/wards?state=${encodeURIComponent(stateName)}`);
  };

  const handleReset = () => {
    setPosition({
      coordinates: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
  };

  const handleZoomIn = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.min(pos.zoom * 1.3, 4),
    }));
  };

  const handleZoomOut = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.max(pos.zoom / 1.3, 1),
    }));
  };

  const handleMoveEnd = (pos: any) => {
    if (!pos || !pos.coordinates) return;
    // Clamp coordinates so India cannot be dragged off-screen
    const clampedLng = Math.min(Math.max(pos.coordinates[0], 68), 98);
    const clampedLat = Math.min(Math.max(pos.coordinates[1], 8), 36);
    const clampedZoom = Math.min(Math.max(pos.zoom, 1), 4);
    setPosition({
      coordinates: [clampedLng, clampedLat],
      zoom: clampedZoom,
    });
  };

  const containerClasses = isExpanded
    ? 'fixed inset-0 z-50 bg-bg p-6 sm:p-8 flex flex-col justify-between overflow-hidden'
    : 'relative w-full h-[520px] sm:h-[580px] lg:h-full min-h-[520px] bg-surface rounded-[10px] border border-border overflow-hidden select-none flex flex-col justify-between';

  return (
    <div
      ref={containerRef}
      id="india-choropleth-hero"
      className={containerClasses}
      role="region"
      aria-label="National India Heat Exposure Choropleth"
    >
      {/* Top Header / Context */}
      <div className="absolute top-4 left-4 z-20 space-y-1 bg-raised/95 backdrop-blur-sm p-3 sm:p-3.5 rounded-[8px] border border-border max-w-[280px] sm:max-w-[320px] shadow-sm">
        <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block">
          National Heat Exposure Choropleth
        </span>
        <h3 className="text-sm font-bold font-display text-ink leading-tight">
          Synoptic State &amp; UT Biometeorological Field
        </h3>
        <p className="text-[11px] text-muted leading-snug">
          Clipped to Survey of India national boundary. Click any state to inspect localized ward and district telemetry.
        </p>
      </div>

      {/* Top-Right Control Rail: Expand, Reset, Zoom In/Out */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-raised/95 backdrop-blur-sm p-1.5 rounded-[8px] border border-border shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-[4px] text-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-[4px] text-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-border my-auto" />
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-[4px] text-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          title="Reset View"
          aria-label="Reset fitted view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-[4px] text-accent hover:text-accent-hover hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse Map (Esc)' : 'Expand Fullscreen'}
          aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-[4px] text-muted hover:text-error hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Close Expanded View"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Composable India Map */}
      <div className="w-full h-full flex items-center justify-center bg-bg">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: isExpanded ? 1400 : 1050,
            center: DEFAULT_CENTER,
          }}
          className="w-full h-full"
        >
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={4}
          >
            {/* SVG Boundary Clip Definition */}
            <defs>
              <clipPath id="india-boundary-mask">
                <Geographies geography={indiaBoundary as any}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography key={`mask-${geo.rsmKey}`} geography={geo} />
                    ))
                  }
                </Geographies>
              </clipPath>
            </defs>

            {/* States Polygons Clipped to Official Survey of India Boundary */}
            <g clipPath="url(#india-boundary-mask)">
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
                            transition: prefersReducedMotion ? 'none' : 'fill 0.2s ease',
                            cursor: 'pointer',
                          },
                          hover: {
                            fill: hasData ? fillColor : TOKENS.raised,
                            stroke: TOKENS.ink,
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
            </g>

            {/* Official Survey of India 1px National Outline Stroke */}
            <Geographies geography={indiaBoundary as any}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={`outline-${geo.rsmKey}`}
                    geography={geo}
                    fill="none"
                    stroke={TOKENS.ink}
                    strokeWidth={1}
                    style={{
                      default: { pointerEvents: 'none' },
                      hover: { pointerEvents: 'none' },
                      pressed: { pointerEvents: 'none' },
                    } as any}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip on Hover */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none p-2.5 rounded-[6px] bg-raised/95 border border-border text-ink shadow-lg font-mono text-xs space-y-1"
          style={{
            left: `${Math.min(window.innerWidth - 220, tooltip.x + 12)}px`,
            top: `${Math.max(12, tooltip.y + 12)}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <strong className="text-ink font-display text-sm">{tooltip.name}</strong>
            <span className="text-[10px] text-accent uppercase font-bold">{tooltip.level}</span>
          </div>
          {tooltip.score !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">{formatNumber(tooltip.score, 1)} / 100 HTSI</span>
              <span className="text-[10px] text-muted">({tooltip.bandLabel})</span>
            </div>
          ) : (
            <div className="text-[11px] text-muted">No synoptic sensor feed</div>
          )}
          <span className="text-[9px] text-muted/70 block pt-0.5">Click to view districts &amp; wards →</span>
        </div>
      )}

      {/* 5-Band Risk Scale Legend (Bottom Right, on --raised) */}
      <div className="absolute bottom-3 right-3 z-20 p-2.5 rounded-[6px] bg-raised border border-border text-ink space-y-1.5 shadow-sm font-mono text-[11px]">
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
