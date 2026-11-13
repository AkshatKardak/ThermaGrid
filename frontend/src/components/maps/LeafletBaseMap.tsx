import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Tooltip,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Compass,
  MapPin,
  Layers,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import indiaBoundary from '../../assets/geo/india-boundary.json';
import type { Location, RiskCurrent } from '../../types';
import { getRiskBand, TOKENS, RISK_SCALE } from '../../theme/tokens';
import { getRiskHex } from '../landing3d/palette';
import { formatNumber } from '../../utils/format';

interface LeafletBaseMapProps {
  wards: Location[];
  wardsRisk?: RiskCurrent[];
  selectedLocationId?: number;
  onSelectLocation?: (id: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Bounding box of Republic of India (same as NagarWatch)
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.0, 67.5], // South-West
  [37.5, 98.0], // North-East
];

const PAN_INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const PAN_INDIA_ZOOM = 5;

// OpenStreetMap standard tile layer (100% free, zero watermark, crystal-clear roads and area names)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// Major Pan-India Monitored Urban Hubs across all States & UTs
interface NationalHub {
  name: string;
  state: string;
  lat: number;
  lng: number;
  riskScore: number;
  wbgt: number;
  workers: number;
}

const PAN_INDIA_HUBS: NationalHub[] = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, riskScore: 84.5, wbgt: 34.6, workers: 420000 },
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, riskScore: 86.2, wbgt: 35.1, workers: 380000 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, riskScore: 83.4, wbgt: 34.0, workers: 290000 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, riskScore: 87.1, wbgt: 35.4, workers: 240000 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, riskScore: 82.8, wbgt: 33.8, workers: 310000 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, riskScore: 78.6, wbgt: 33.2, workers: 350000 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, riskScore: 79.2, wbgt: 33.5, workers: 280000 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, riskScore: 80.4, wbgt: 33.7, workers: 270000 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, riskScore: 62.5, wbgt: 28.9, workers: 190000 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, riskScore: 84.8, wbgt: 34.8, workers: 210000 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, riskScore: 81.3, wbgt: 33.9, workers: 230000 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, riskScore: 81.5, wbgt: 34.1, workers: 195000 },
  { name: 'Chandigarh', state: 'Punjab / Haryana', lat: 30.7333, lng: 76.7794, riskScore: 78.4, wbgt: 32.8, workers: 120000 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, riskScore: 68.2, wbgt: 30.6, workers: 140000 },
  { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973, riskScore: 46.2, wbgt: 24.8, workers: 65000 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, riskScore: 58.4, wbgt: 29.2, workers: 110000 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, riskScore: 80.2, wbgt: 33.6, workers: 160000 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, riskScore: 77.5, wbgt: 32.7, workers: 155000 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, riskScore: 61.0, wbgt: 28.5, workers: 85000 },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, riskScore: 52.0, wbgt: 25.2, workers: 45000 },
  { name: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278, riskScore: 48.5, wbgt: 26.8, workers: 40000 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, riskScore: 81.8, wbgt: 33.7, workers: 275000 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, riskScore: 85.0, wbgt: 34.9, workers: 220000 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, riskScore: 83.1, wbgt: 34.2, workers: 190000 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, riskScore: 82.5, wbgt: 34.1, workers: 180000 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, riskScore: 79.8, wbgt: 33.4, workers: 170000 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, riskScore: 67.2, wbgt: 30.1, workers: 135000 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723, riskScore: 78.0, wbgt: 32.9, workers: 145000 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, riskScore: 88.4, wbgt: 35.8, workers: 165000 },
];

// Invalidate on Mount & Window Resize
const MapResizeInvalidator: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, isExpanded]);
  return null;
};

// Smooth Camera Navigator
const MapController: React.FC<{
  targetView: { center: [number, number]; zoom: number; key: number };
}> = ({ targetView }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(targetView.center, targetView.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [map, targetView]);
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'ward' | 'india'>('ward');

  // Map risk by ward_code
  const riskMap = useMemo(() => {
    const map = new Map<string, RiskCurrent>();
    wardsRisk.forEach((r) => map.set(r.ward_code, r));
    return map;
  }, [wardsRisk]);

  const selectedWard = wards.find((w) => w.id === selectedLocationId) || wards[0];
  const wardCenter: [number, number] = selectedWard
    ? [selectedWard.latitude, selectedWard.longitude]
    : [19.076, 72.8777];

  const [targetView, setTargetView] = useState<{
    center: [number, number];
    zoom: number;
    key: number;
  }>({
    center: wardCenter,
    zoom: 12,
    key: Date.now(),
  });

  // When selected ward changes, pan to it if in ward mode
  useEffect(() => {
    if (activeViewMode === 'ward' && selectedWard) {
      setTargetView({
        center: [selectedWard.latitude, selectedWard.longitude],
        zoom: 12,
        key: Date.now(),
      });
    }
  }, [selectedLocationId, selectedWard, activeViewMode]);

  // Esc key trap to minimize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleTogglePanIndia = useCallback(() => {
    setActiveViewMode('india');
    setTargetView({
      center: PAN_INDIA_CENTER,
      zoom: PAN_INDIA_ZOOM,
      key: Date.now(),
    });
  }, []);

  const handleFocusWard = useCallback(() => {
    setActiveViewMode('ward');
    if (selectedWard) {
      setTargetView({
        center: [selectedWard.latitude, selectedWard.longitude],
        zoom: 12,
        key: Date.now(),
      });
    }
  }, [selectedWard]);

  const containerClasses = isExpanded
    ? 'fixed inset-0 z-[2000] bg-surface flex flex-col p-4 sm:p-6 overflow-hidden'
    : `relative overflow-hidden bg-surface border border-border rounded-[8px] ${className}`;

  return (
    <div className={containerClasses} style={style}>
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none flex items-center justify-between gap-3">
        {/* Left Status & Breadcrumb */}
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-md px-3.5 py-1.5 rounded-[8px] border border-border shadow-md flex items-center gap-2.5 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-ink hidden sm:inline">
            National Heat Early Warning Map
          </span>
          <span className="text-muted hidden sm:inline">•</span>
          <span className="text-ink font-semibold">
            {activeViewMode === 'india'
              ? '🇮🇳 Pan-India National Telemetry'
              : `🎯 ${selectedWard?.ward_name || 'Mumbai Urban Sector'}`}
          </span>
        </div>

        {/* Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-surface/95 backdrop-blur-md p-1 rounded-[8px] border border-border shadow-md">
          {/* View Toggles */}
          <button
            type="button"
            onClick={handleTogglePanIndia}
            title="Pan-India National View"
            className={`px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'india'
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-ink hover:bg-raised'
            }`}
          >
            <span>Whole India</span>
          </button>

          <button
            type="button"
            onClick={handleFocusWard}
            title="Focus Current Ward / Sector"
            className={`px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'ward'
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-ink hover:bg-raised'
            }`}
          >
            <span>Ward Focus</span>
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Maximise / Minimise Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize Map (Esc)' : 'Maximize Map (Full Screen)'}
            className="p-1.5 rounded-[6px] text-muted hover:text-ink hover:bg-raised transition-colors cursor-pointer flex items-center justify-center"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-ink" />
            ) : (
              <Maximize2 className="w-4 h-4 text-ink" />
            )}
          </button>
        </div>
      </div>

      {/* Sovereign National Territory Tag (Bottom Left, like NagarWatch) */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto bg-surface/95 backdrop-blur-md px-3 py-1.5 rounded-[6px] text-[11px] font-mono text-muted border border-border flex items-center gap-2 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-accent" />
        <span className="font-semibold text-ink">Republic of India</span>
        <span className="text-border">|</span>
        <span>OpenStreetMap Highways &amp; Localities · Survey of India Boundary</span>
      </div>

      {/* 5-Band Risk Scale Legend (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-[1000] pointer-events-auto p-2.5 rounded-[6px] bg-surface/95 backdrop-blur-md border border-border text-ink space-y-1 shadow-sm font-mono text-[10px]">
        <span className="text-[10px] text-muted uppercase font-bold block">
          HTSI Risk Scale
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk1 }} />
            <span className="text-muted">Safe</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk2 }} />
            <span className="text-muted">Mod</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk3 }} />
            <span className="text-muted">High</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk4 }} />
            <span className="text-muted">Very</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk5 }} />
            <span className="text-muted">Ext</span>
          </span>
        </div>
      </div>

      {/* Leaflet Map Stage */}
      <MapContainer
        center={wardCenter}
        zoom={12}
        minZoom={4}
        maxZoom={18}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', backgroundColor: '#F3EFE7', zIndex: 1 }}
        attributionControl={false}
        zoomControl={false}
        scrollWheelZoom
      >
        <MapResizeInvalidator isExpanded={isExpanded} />
        <MapController targetView={targetView} />

        {/* Free OpenStreetMap Standard Tiles (Shows all roads, streets, highways, area names across India) */}
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
          tileSize={256}
          subdomains={['a', 'b', 'c']}
        />

        {/* Official India Sovereign Boundary Outline (from NagarWatch india-boundary.json) */}
        <GeoJSON
          data={indiaBoundary as any}
          style={() => ({
            color: '#1F3A5F',
            weight: 2,
            opacity: 0.85,
            fillColor: '#1F3A5F',
            fillOpacity: 0.02,
            dashArray: '6, 4',
          })}
        />

        {/* Ward Polygons (For detailed metropolitan surveyed wards) */}
        {wards.map((ward) => {
          const risk = riskMap.get(ward.ward_code);
          const score = risk ? risk.risk_score : 50;
          const band = getRiskBand(score);
          const isSelected = ward.id === selectedLocationId;
          const wbgtVal = risk?.wbgt_c ? `${formatNumber(risk.wbgt_c, 1)}°C` : '32.4°C';
          const workersVal = ward.outdoor_worker_ratio
            ? `${formatNumber(ward.outdoor_worker_ratio * 100, 0)}%`
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
                  fillOpacity: isSelected ? 0.45 : 0.25,
                  color: isSelected ? TOKENS.accent : band.color,
                  weight: isSelected ? 2.5 : 1.25,
                  opacity: isSelected ? 1 : 0.7,
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle({ opacity: 1, weight: 2.5 });
                  },
                  mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      opacity: isSelected ? 1 : 0.7,
                      weight: isSelected ? 2.5 : 1.25,
                    });
                  },
                  click: () => {
                    if (onSelectLocation) {
                      onSelectLocation(ward.id);
                    }
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.98}>
                  <div className="p-2.5 font-mono text-xs bg-panel-dark border border-border text-raised rounded-[6px] space-y-1 shadow-lg">
                    <div className="font-bold text-raised font-display">{ward.ward_name}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                      <span className="font-bold text-raised">
                        Score: {formatNumber(score, 1)}/100
                      </span>
                      <span className="text-raised/70">({band.label})</span>
                    </div>
                    <div className="text-[11px] text-raised/70 pt-0.5 border-t border-border/40 flex items-center justify-between gap-3">
                      <span>WBGT: {wbgtVal}</span>
                      <span>Outdoor Workforce: {workersVal}</span>
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          }
          return null;
        })}

        {/* Pan-India National Hub Pins (Visible across all states of India) */}
        {PAN_INDIA_HUBS.map((hub) => {
          const band = getRiskBand(hub.riskScore);
          return (
            <CircleMarker
              key={`hub-${hub.name}`}
              center={[hub.lat, hub.lng]}
              radius={7}
              pathOptions={{
                color: '#1A1E1C',
                weight: 1.5,
                fillColor: band.color,
                fillOpacity: 0.9,
              }}
              eventHandlers={{
                click: () => {
                  setTargetView({
                    center: [hub.lat, hub.lng],
                    zoom: 11,
                    key: Date.now(),
                  });
                },
              }}
            >
              <Tooltip direction="top" opacity={0.98}>
                <div className="p-2.5 font-mono text-xs bg-panel-dark border border-border text-raised rounded-[6px] space-y-1 shadow-lg">
                  <div className="font-bold text-raised font-display">{hub.name} ({hub.state})</div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                    <span className="font-bold text-raised">
                      Score: {formatNumber(hub.riskScore, 1)}/100
                    </span>
                    <span className="text-raised/70">({band.label})</span>
                  </div>
                  <div className="text-[11px] text-raised/70 pt-0.5 border-t border-border/40 flex items-center justify-between gap-3">
                    <span>WBGT: {formatNumber(hub.wbgt, 1)}°C</span>
                    <span>Labor Pool: {hub.workers.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] text-accent block pt-0.5">Click to zoom into city sector →</span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
