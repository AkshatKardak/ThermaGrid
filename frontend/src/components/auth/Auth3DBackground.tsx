import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import indiaGeo from '../../assets/geo/india-states.json';
import indiaBoundary from '../../assets/geo/india-boundary.json';

// High-risk states to highlight with warm thermal stress tint
const HIGH_RISK_STATES = new Set([
  'rajasthan',
  'odisha',
  'orissa',
  'andhra pradesh',
  'delhi',
  'uttar pradesh',
  'gujarat',
  'madhya pradesh',
]);

// Monitored telemetry sensor nodes on the map
const TELEMETRY_NODES = [
  { name: 'Delhi', coords: [77.209, 28.6139] as [number, number], color: '#FF704F', size: 5 },
  { name: 'Mumbai', coords: [72.8777, 19.076] as [number, number], color: '#FF704F', size: 5 },
  { name: 'Jaipur', coords: [75.7873, 26.9124] as [number, number], color: '#FF704F', size: 4 },
  { name: 'Lucknow', coords: [80.9462, 26.8467] as [number, number], color: '#EA580C', size: 4 },
  { name: 'Kolkata', coords: [88.3639, 22.5726] as [number, number], color: '#EA580C', size: 4 },
  { name: 'Hyderabad', coords: [78.4867, 17.385] as [number, number], color: '#EA580C', size: 4 },
  { name: 'Bengaluru', coords: [77.5946, 12.9716] as [number, number], color: '#8FB3D9', size: 4 },
  { name: 'Chennai', coords: [80.2707, 13.0827] as [number, number], color: '#EA580C', size: 4 },
  { name: 'Ahmedabad', coords: [72.5714, 23.0225] as [number, number], color: '#FF704F', size: 4 },
  { name: 'Bhubaneswar', coords: [85.8245, 20.2961] as [number, number], color: '#FF704F', size: 4 },
];

export const Auth3DBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 flex items-center justify-center"
      style={{ backgroundColor: '#14181A' }}
    >
      {/* Keyframe animations for glowing pulses */}
      <style>{`
        @keyframes authMapPulse {
          0%, 100% {
            fill-opacity: 0.45;
          }
          50% {
            fill-opacity: 0.75;
          }
        }
        @keyframes nodePing {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(2.2);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }
        .animate-auth-state-pulse {
          animation: authMapPulse 3.5s ease-in-out infinite;
        }
        .animate-node-ping {
          animation: nodePing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          transform-origin: center;
        }
      `}</style>

      {/* Subtle radial ambient blue vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(31, 58, 95, 0.35) 0%, rgba(20, 24, 26, 0.95) 80%)',
        }}
      />

      {/* Grid Pattern Overlay for high-tech telemetry feel */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full h-full max-w-[620px] max-h-[820px] flex items-center justify-center opacity-90 transition-opacity duration-700">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 920,
            center: [82.0, 22.5],
          }}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Indian States Geometries (Solid, distinctly visible) */}
          <Geographies geography={indiaGeo as any}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const props = (geo.properties || {}) as Record<string, any>;
                const stateName = (
                  props.ST_NM ||
                  props.NAME_1 ||
                  props.name ||
                  ''
                )
                  .trim()
                  .toLowerCase();

                const isHighRisk = HIGH_RISK_STATES.has(stateName);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className={isHighRisk ? 'animate-auth-state-pulse' : undefined}
                    fill={isHighRisk ? '#EA580C' : '#223447'}
                    fillOpacity={isHighRisk ? 0.55 : 0.42}
                    stroke="#385473"
                    strokeWidth={0.8}
                    style={{ outline: 'none' }}
                  />
                );
              })
            }
          </Geographies>

          {/* Survey of India National Outer Boundary */}
          <Geographies geography={indiaBoundary as any}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={`auth-border-${geo.rsmKey}`}
                  geography={geo}
                  fill="none"
                  stroke="#8FB3D9"
                  strokeWidth={1.75}
                  strokeOpacity={0.85}
                  style={{ outline: 'none' }}
                />
              ))
            }
          </Geographies>

          {/* Telemetry Sensor Nodes */}
          {TELEMETRY_NODES.map((node) => (
            <Marker key={node.name} coordinates={node.coords}>
              <circle
                r={node.size * 2}
                fill={node.color}
                className="animate-node-ping"
              />
              <circle
                r={node.size}
                fill={node.color}
                stroke="#14181A"
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                y={-node.size - 4}
                className="fill-raised font-mono text-[9px] font-semibold"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                {node.name}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  );
};
