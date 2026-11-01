import React, { useState } from 'react';
import { heatColor } from '../heat';
import { THREE_TOKENS } from '../tokens';

export interface StaticCityData {
  name: string;
  lat: number;
  lng: number;
  risk: number; // 0.0 - 1.0
  temp?: number;
  wbgt?: number;
}

export const DEFAULT_CITIES: StaticCityData[] = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, risk: 0.784, temp: 36.2, wbgt: 31.4 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, risk: 0.862, temp: 42.5, wbgt: 33.1 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, risk: 0.820, temp: 41.8, wbgt: 32.5 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, risk: 0.841, temp: 43.1, wbgt: 32.8 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, risk: 0.685, temp: 38.5, wbgt: 30.2 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, risk: 0.740, temp: 37.0, wbgt: 31.8 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, risk: 0.798, temp: 36.8, wbgt: 32.0 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, risk: 0.813, temp: 41.2, wbgt: 31.9 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, risk: 0.380, temp: 31.0, wbgt: 26.4 },
];

interface StaticGlobeProps {
  cities?: StaticCityData[];
  onCitySelect?: (cityName: string) => void;
  height?: number | string;
}

export const StaticGlobe: React.FC<StaticGlobeProps> = ({
  cities = DEFAULT_CITIES,
  onCitySelect,
  height = 450,
}) => {
  const [hoveredCity, setHoveredCity] = useState<StaticCityData | null>(null);

  // Geographic bounds for India projection inside 400x400 viewBox
  // India approx: Lat 8° to 37° N, Lng 68° to 98° E
  const projectToSvg = (lat: number, lng: number) => {
    const minLng = 68.0;
    const maxLng = 98.0;
    const minLat = 8.0;
    const maxLat = 37.0;

    const x = 50 + ((lng - minLng) / (maxLng - minLng)) * 300;
    const y = 350 - ((lat - minLat) / (maxLat - minLat)) * 300;
    return { x, y };
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#1F3445]/60 to-[#101820] flex flex-col items-center justify-between p-6 shadow-2xl"
      style={{ minHeight: height }}
    >
      {/* Telemetry Header */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E8C547]" />
          <span className="text-xs font-mono font-semibold text-[#D7E0E7] uppercase tracking-wider">
            National Thermal Surveillance (Static 2D Mode)
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#8B9AA8]">
          Accessible Low-Power Mode
        </div>
      </div>

      {/* 2D Vector Globe Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center my-4">
        <svg
          viewBox="0 0 400 400"
          className="w-72 h-72 sm:w-80 sm:h-80 select-none overflow-visible"
          role="img"
          aria-label="Synoptic India Thermal Map displaying high-risk urban hotspots"
        >
          {/* Outer Globe Circle & Graticules */}
          <circle
            cx="200"
            cy="200"
            r="170"
            fill="#14232E"
            stroke="rgba(155, 111, 216, 0.3)"
            strokeWidth="1.5"
          />
          <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
          <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />

          {/* Graticule Crosshairs */}
          <line x1="30" y1="200" x2="370" y2="200" stroke="rgba(255, 255, 255, 0.08)" />
          <line x1="200" y1="30" x2="200" y2="370" stroke="rgba(255, 255, 255, 0.08)" />

          {/* India Continental Approximate Outline Path */}
          <path
            d="M 120 150 Q 150 110 200 90 Q 230 110 260 140 Q 270 190 240 230 Q 220 270 200 320 Q 180 270 160 230 Q 130 190 120 150 Z"
            fill="none"
            stroke="rgba(60, 86, 106, 0.6)"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* City Thermal Hotspot Pins */}
          {cities.map((city) => {
            const { x, y } = projectToSvg(city.lat, city.lng);
            const color = heatColor(city.risk);
            const radius = 5 + city.risk * 7;
            const isHovered = hoveredCity?.name === city.name;

            return (
              <g
                key={city.name}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredCity(city)}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() => onCitySelect && onCitySelect(city.name)}
                tabIndex={0}
                role="button"
                aria-label={`${city.name}: Risk score ${(city.risk * 100).toFixed(0)}, Temperature ${city.temp || '--'}°C`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onCitySelect && onCitySelect(city.name);
                  }
                }}
              >
                {/* Pulsing ring for high risk */}
                {city.risk >= 0.7 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.4"
                    className="animate-ping"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />
                )}
                {/* Main point */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={color}
                  stroke="#101820"
                  strokeWidth="2"
                  filter={isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : `drop-shadow(0 0 4px ${color})`}
                />
                {/* City name text */}
                <text
                  x={x}
                  y={y - radius - 4}
                  textAnchor="middle"
                  fill="#D7E0E7"
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered / Active City Detail Card */}
      <div className="w-full bg-[#101820]/90 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs z-10 min-h-[52px]">
        {hoveredCity ? (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: heatColor(hoveredCity.risk) }}
              />
              <span className="font-semibold text-white">{hoveredCity.name}</span>
              <span className="text-[#8B9AA8] font-mono">
                {hoveredCity.lat.toFixed(2)}°N, {hoveredCity.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span>Risk: <strong style={{ color: heatColor(hoveredCity.risk) }}>{(hoveredCity.risk * 100).toFixed(1)}</strong></span>
              {hoveredCity.temp && <span>T: <strong>{hoveredCity.temp}°C</strong></span>}
              {hoveredCity.wbgt && <span>WBGT: <strong>{hoveredCity.wbgt}°C</strong></span>}
            </div>
          </>
        ) : (
          <span className="text-[#8B9AA8] text-[11px] font-mono italic">
            Hover over or tap a city pin to inspect local thermal stress indices.
          </span>
        )}
      </div>

      {/* Screen Reader Accessible Table (Hidden Visually) */}
      <div className="sr-only">
        <table>
          <caption>Pan-India Urban Thermal Stress Telemetry</caption>
          <thead>
            <tr>
              <th scope="col">City</th>
              <th scope="col">Latitude</th>
              <th scope="col">Longitude</th>
              <th scope="col">Thermal Risk Score (0-100)</th>
              <th scope="col">Temperature</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.lat}</td>
                <td>{c.lng}</td>
                <td>{(c.risk * 100).toFixed(0)}</td>
                <td>{c.temp ? `${c.temp}°C` : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
