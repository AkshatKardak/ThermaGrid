import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import type { Location, RiskCurrent } from '../../types';
import { getRiskBand, TOKENS } from '../../theme/tokens';

interface LeafletBaseMapProps {
  wards: Location[];
  wardsRisk?: RiskCurrent[];
  selectedLocationId?: number;
  onSelectLocation?: (id: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Smooth map panning when selected ward updates
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const LeafletBaseMap: React.FC<LeafletBaseMapProps> = ({
  wards,
  wardsRisk = [],
  selectedLocationId,
  onSelectLocation,
  className = 'w-full h-full',
  style,
}) => {
  const [hasPulsed, setHasPulsed] = useState(false);

  // Map risk by ward_code
  const riskMap = useMemo(() => {
    const map = new Map<string, RiskCurrent>();
    wardsRisk.forEach((r) => map.set(r.ward_code, r));
    return map;
  }, [wardsRisk]);

  // Identify highest risk ward for initial 900ms ring pulse
  const highestRiskWard = useMemo(() => {
    if (!wards.length) return null;
    let maxWard = wards[0];
    let maxScore = -1;
    wards.forEach((w) => {
      const r = riskMap.get(w.ward_code);
      const score = r ? r.risk_score : 50;
      if (score > maxScore) {
        maxScore = score;
        maxWard = w;
      }
    });
    return maxWard;
  }, [wards, riskMap]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasPulsed(true);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const selectedWard = wards.find((w) => w.id === selectedLocationId) || wards[0];
  const center: [number, number] = selectedWard
    ? [selectedWard.latitude, selectedWard.longitude]
    : [19.076, 72.8777];

  return (
    <div className={`relative overflow-hidden bg-panel-dark border border-border rounded-[8px] ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', backgroundColor: TOKENS.panelDark }}
        attributionControl={false}
        zoomControl={false}
      >
        <MapUpdater center={center} zoom={12} />

        {/* Desaturated CartoDB tiles on panel-dark */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
          className="filter brightness-[0.82] contrast-[1.12]"
        />

        {/* Ward Polygons */}
        {wards.map((ward) => {
          const risk = riskMap.get(ward.ward_code);
          const score = risk ? risk.risk_score : 50;
          const band = getRiskBand(score);
          const isSelected = ward.id === selectedLocationId;
          const wbgtVal = risk?.wbgt_c ? `${risk.wbgt_c.toFixed(1)}°C` : '32.4°C';
          const workersVal = ward.outdoor_worker_ratio
            ? `${(ward.outdoor_worker_ratio * 100).toFixed(0)}%`
            : '28%';

          if (ward.geometry_geojson && ward.geometry_geojson.coordinates) {
            const polyCoords: [number, number][] = ward.geometry_geojson.coordinates[0].map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );

            return (
              <Polygon
                key={`ward-poly-${ward.id}`}
                positions={polyCoords}
                pathOptions={{
                  fillColor: band.color,
                  fillOpacity: isSelected ? 0.40 : 0.22,
                  color: isSelected ? TOKENS.accent : band.color,
                  weight: isSelected ? 2 : 1,
                  opacity: isSelected ? 1 : 0.55,
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      opacity: 1,
                      weight: 2,
                    });
                  },
                  mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      opacity: isSelected ? 1 : 0.55,
                      weight: isSelected ? 2 : 1,
                    });
                  },
                  click: () => {
                    if (onSelectLocation) {
                      onSelectLocation(ward.id);
                    }
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.96}>
                  <div className="p-2 font-mono text-xs bg-panel-dark border border-border text-raised rounded-[6px] space-y-1">
                    <div className="font-bold text-raised">{ward.ward_name}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                      <span className="font-bold text-raised">
                        Score: {score.toFixed(1)}/100
                      </span>
                      <span className="text-raised/70">({band.label})</span>
                    </div>
                    <div className="text-[11px] text-raised/70 pt-0.5 border-t border-border/40 flex items-center justify-between gap-3">
                      <span>WBGT: {wbgtVal}</span>
                      <span>Workers: {workersVal}</span>
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          }
          return null;
        })}

        {/* Highest-risk ward single 900ms ring pulse on load */}
        {highestRiskWard && !hasPulsed && (
          <CircleMarker
            center={[highestRiskWard.latitude, highestRiskWard.longitude]}
            radius={28}
            pathOptions={{
              color: '#C31D3C',
              weight: 2,
              fillColor: '#C31D3C',
              fillOpacity: 0.25,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
