import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import indiaGeo from '../../assets/geo/india-states.json';
import indiaBoundary from '../../assets/geo/india-boundary.json';

// Top 5 highest heatwave risk states
const TOP_5_RISK_STATES = new Set([
  'rajasthan',
  'odisha',
  'orissa',
  'andhra pradesh',
  'delhi',
  'uttar pradesh',
]);

export const Auth3DBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 flex items-center justify-center"
      style={{ backgroundColor: '#14181A' }}
    >
      {/* Dynamic Keyframes for slow subtle pulse on top risk states */}
      <style>{`
        @keyframes pulseRiskState {
          0%, 100% {
            fill: #FF704F;
            fill-opacity: 0.16;
          }
          50% {
            fill: #FF8F6B;
            fill-opacity: 0.34;
          }
        }
        .animate-risk-pulse {
          animation: pulseRiskState 4s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle radial ambient vignette in panel background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(31, 58, 95, 0.18) 0%, rgba(20, 24, 26, 0.95) 75%)',
        }}
      />

      <div className="w-[120%] h-[120%] flex items-center justify-center opacity-80">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 820,
            center: [82.5, 22.0],
          }}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <clipPath id="auth-india-boundary-mask">
              <Geographies geography={indiaBoundary as any}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#FFFFFF"
                    />
                  ))
                }
              </Geographies>
            </clipPath>
          </defs>

          {/* Masked India States */}
          <g clipPath="url(#auth-india-boundary-mask)">
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

                  const isHighRisk = TOP_5_RISK_STATES.has(stateName);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className={isHighRisk ? 'animate-risk-pulse' : undefined}
                      fill={isHighRisk ? '#FF704F' : '#5E645F'}
                      fillOpacity={isHighRisk ? 0.22 : 0.12}
                      stroke="#14181A"
                      strokeWidth={0.5}
                      style={{ outline: 'none' }}
                    />
                  );
                })
              }
            </Geographies>
          </g>

          {/* Crisp Survey of India Boundary Outline */}
          <Geographies geography={indiaBoundary as any}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={`auth-boundary-${geo.rsmKey}`}
                  geography={geo}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth={0.75}
                  style={{ outline: 'none' }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  );
};
