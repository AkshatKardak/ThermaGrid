import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { Location, RiskCurrent, CoolingCentre } from '../../types';
import { getRiskBand } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';

interface LeafletBaseMapProps {
  wards: Location[];
  wardsRisk?: RiskCurrent[];
  coolingCentres?: CoolingCentre[];
  selectedLocationId?: number;
  onSelectLocation?: (id: number) => void;
  height?: string;
}

// Center map smoothly on location change
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
  coolingCentres = [],
  selectedLocationId,
  onSelectLocation,
  height = '500px',
}) => {
  const { activeLayers } = useAppStore();

  const selectedWard = wards.find((w) => w.id === selectedLocationId) || wards[0];
  const center: [number, number] = selectedWard
    ? [selectedWard.latitude, selectedWard.longitude]
    : [19.076, 72.8777];

  // Helper map for risk by ward_code
  const riskMap = new Map<string, RiskCurrent>();
  wardsRisk.forEach((r) => riskMap.set(r.ward_code, r));

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl z-0" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', backgroundColor: '#101820' }}
        attributionControl={false}
      >
        <MapUpdater center={center} zoom={12} />

        {/* CartoDB Dark Matter Basemap */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Ward Polygons / Choropleth */}
        {activeLayers.wardChoropleth &&
          wards.map((ward) => {
            const risk = riskMap.get(ward.ward_code);
            const score = risk ? risk.risk_score : 50;
            const band = getRiskBand(score);
            const isSelected = ward.id === selectedLocationId;

            if (ward.geometry_geojson && ward.geometry_geojson.coordinates) {
              const polyCoords: [number, number][] = ward.geometry_geojson.coordinates[0].map(
                (coord: number[]) => [coord[1], coord[0]] as [number, number]
              );

              return (
                <Polygon
                  key={`poly-${ward.id}`}
                  positions={polyCoords}
                  pathOptions={{
                    fillColor: band.color,
                    fillOpacity: isSelected ? 0.65 : 0.40,
                    color: isSelected ? '#FFFFFF' : band.color,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => onSelectLocation && onSelectLocation(ward.id),
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs bg-[#101820] text-[#D7E0E7] rounded">
                      <div className="font-bold text-sm">{ward.ward_name}</div>
                      <div className="mt-1 font-mono font-bold" style={{ color: band.color }}>
                        Risk Score: {score.toFixed(1)}/100 ({band.label})
                      </div>
                      <div className="text-[11px] text-[#8B9AA8] mt-1">
                        Density: {ward.population_density_per_km2.toLocaleString()}/km²
                      </div>
                      <div className="text-[11px] text-[#8B9AA8]">
                        Outdoor Workforce: {(ward.outdoor_worker_ratio * 100).toFixed(0)}%
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            }

            // Fallback Circle Marker if no geometry
            return (
              <CircleMarker
                key={`circle-${ward.id}`}
                center={[ward.latitude, ward.longitude]}
                radius={isSelected ? 16 : 10}
                pathOptions={{
                  fillColor: band.color,
                  fillOpacity: 0.8,
                  color: isSelected ? '#FFFFFF' : band.color,
                  weight: isSelected ? 3 : 1,
                }}
                eventHandlers={{
                  click: () => onSelectLocation && onSelectLocation(ward.id),
                }}
              >
                <Popup>
                  <div className="p-2 text-xs bg-[#101820] text-[#D7E0E7] rounded">
                    <div className="font-bold">{ward.ward_name}</div>
                    <div className="font-mono text-sm" style={{ color: band.color }}>
                      Risk: {score.toFixed(1)} ({band.label})
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Cooling Centres Layer */}
        {activeLayers.coolingCentres &&
          coolingCentres.map((centre) => (
            <CircleMarker
              key={`cooling-${centre.id}`}
              center={[centre.latitude, centre.longitude]}
              radius={7}
              pathOptions={{
                fillColor: '#2FA37C',
                fillOpacity: 0.95,
                color: '#FFFFFF',
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-2 text-xs bg-[#101820] text-[#D7E0E7] rounded max-w-xs">
                  <div className="font-bold text-[#2FA37C] uppercase tracking-wider text-[10px]">
                    Municipal Cooling Centre
                  </div>
                  <div className="font-bold text-sm text-white mt-0.5">{centre.name}</div>
                  <div className="text-[11px] text-[#8B9AA8] mt-1">{centre.address}</div>
                  <div className="text-[11px] font-mono text-white mt-1">
                    Capacity: {centre.capacity_persons} | Open: {centre.operating_hours}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-[#101820]/90 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs shadow-xl space-y-1.5 pointer-events-auto">
        <div className="font-bold font-display text-[11px] text-[#8B9AA8] uppercase tracking-wider mb-1">
          Ward Heat Risk Scale
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#2FA37C]" />
          <span className="text-[11px]">Safe (&lt;25)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#E8C547]" />
          <span className="text-[11px]">Moderate (25-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#F59E0B]" />
          <span className="text-[11px]">High (50-69)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#FF704F]" />
          <span className="text-[11px]">Very High (70-84)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#C31D3C]" />
          <span className="text-[11px]">Extreme (85-100)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2FA37C] ring-2 ring-white" />
          <span className="text-[11px] text-[#2FA37C] font-semibold">Cooling Shelter</span>
        </div>
      </div>
    </div>
  );
};
