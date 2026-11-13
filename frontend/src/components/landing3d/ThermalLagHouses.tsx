import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './useThreeScene';
import { useScrollProgress } from './useScrollProgress';
import { evaluateThermalLag, getOutdoorTemp, getAlertGrade } from '../../lib/thermalLag';
import { getRiskColor, getRiskHex } from './palette';
import { THEME_COLORS } from '../../theme/tokens';

export interface ThermalLagHousesProps {
  className?: string;
  staticHour?: number; // For static fallback mode
}

export const ThermalLagHouses: React.FC<ThermalLagHousesProps> = ({
  className = '',
  staticHour,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // When staticHour is provided (static fallback), progress is fixed; otherwise scrubs with sticky scroll
  const scrollProgress = useScrollProgress(containerRef, { mode: 'sticky' });
  const hour = staticHour !== undefined ? staticHour : scrollProgress * 24;

  const thermalState = useMemo(() => evaluateThermalLag(hour), [hour]);

  // Mesh and light refs for direct Three.js mutations
  const tinInteriorRef = useRef<THREE.Mesh | null>(null);
  const rccInteriorRef = useRef<THREE.Mesh | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const { containerRef: canvasContainerRef } = useThreeScene({
    cameraFov: 40,
    cameraNear: 0.1,
    cameraFar: 100,
    cameraPosition: [0, 9, 17],
    cameraLookAt: [0, 1.2, 0],
    clearAlpha: 0,
    onInit: ({ scene }) => {
      // 1. Soft Ambient Light
      const ambient = new THREE.AmbientLight(0xd8e8e6, 0.55);
      scene.add(ambient);

      // 2. Sunlight Directional
      const sunLight = new THREE.DirectionalLight(0xfffaed, 0.95);
      sunLight.position.set(0, 15, 6);
      scene.add(sunLight);
      sunLightRef.current = sunLight;

      // 3. Sun Marker Sphere (overhead arc)
      const sunGeo = new THREE.SphereGeometry(0.4, 24, 24);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
      const sunMesh = new THREE.Mesh(sunGeo, sunMat);
      scene.add(sunMesh);
      sunMeshRef.current = sunMesh;

      // 4. Ground Grid & Base Platform in --raised
      const grid = new THREE.GridHelper(20, 20, THEME_COLORS.raised, THEME_COLORS.raised);
      grid.position.y = 0;
      if (grid.material instanceof THREE.Material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.25;
      }
      scene.add(grid);

      const baseMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEME_COLORS.surface),
        roughness: 0.95,
        metalness: 0,
      });

      // -------------------------------------------------------------
      // HOUSE 1 (LEFT): Informal / Corrugated Tin Roof
      // -------------------------------------------------------------
      const leftHouseGroup = new THREE.Group();
      leftHouseGroup.position.set(-3.6, 0, 0);

      // Clay walls material (back, left, right walls — front cut away)
      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEME_COLORS.raised),
        roughness: 0.9,
        metalness: 0,
        flatShading: true,
      });

      // Back wall
      const backWallGeo = new THREE.BoxGeometry(4.0, 3.2, 0.2);
      const backWallLeft = new THREE.Mesh(backWallGeo, wallMat);
      backWallLeft.position.set(0, 1.6, -1.9);
      leftHouseGroup.add(backWallLeft);

      // Left wall
      const sideWallGeo = new THREE.BoxGeometry(0.2, 3.2, 3.8);
      const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
      leftWall.position.set(-1.9, 1.6, 0);
      leftHouseGroup.add(leftWall);

      // Right wall
      const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
      rightWall.position.set(1.9, 1.6, 0);
      leftHouseGroup.add(rightWall);

      // Floor slab
      const floorGeo = new THREE.BoxGeometry(4.2, 0.2, 4.2);
      const floorLeft = new THREE.Mesh(floorGeo, baseMat);
      floorLeft.position.set(0, 0.1, 0);
      leftHouseGroup.add(floorLeft);

      // Corrugated Tin Roof (sloped thin sheets in #6B7C8A)
      const tinRoofGeo = new THREE.BoxGeometry(4.6, 0.1, 4.4);
      const tinRoofMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEME_COLORS.muted),
        roughness: 0.6,
        metalness: 0.25,
      });
      const tinRoof = new THREE.Mesh(tinRoofGeo, tinRoofMat);
      tinRoof.position.set(0, 3.35, 0);
      tinRoof.rotation.z = -0.06; // slight single-pitch corrugated slope
      leftHouseGroup.add(tinRoof);

      // Interior Air Volume (Responsive to heat)
      const interiorGeo = new THREE.BoxGeometry(3.6, 2.9, 3.5);
      const tinInteriorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(getRiskColor(50)),
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.85,
      });
      const tinInterior = new THREE.Mesh(interiorGeo, tinInteriorMat);
      tinInterior.position.set(0, 1.55, 0.05);
      leftHouseGroup.add(tinInterior);
      tinInteriorRef.current = tinInterior;

      scene.add(leftHouseGroup);

      // -------------------------------------------------------------
      // HOUSE 2 (RIGHT): Heavy Concrete / RCC Roof
      // -------------------------------------------------------------
      const rightHouseGroup = new THREE.Group();
      rightHouseGroup.position.set(3.6, 0, 0);

      // Back wall
      const backWallRight = new THREE.Mesh(backWallGeo, wallMat);
      backWallRight.position.set(0, 1.6, -1.9);
      rightHouseGroup.add(backWallRight);

      // Left wall
      const leftWallRight = new THREE.Mesh(sideWallGeo, wallMat);
      leftWallRight.position.set(-1.9, 1.6, 0);
      rightHouseGroup.add(leftWallRight);

      // Right wall
      const rightWallRight = new THREE.Mesh(sideWallGeo, wallMat);
      rightWallRight.position.set(1.9, 1.6, 0);
      rightHouseGroup.add(rightWallRight);

      // Floor slab
      const floorRight = new THREE.Mesh(floorGeo, baseMat);
      floorRight.position.set(0, 0.1, 0);
      rightHouseGroup.add(floorRight);

      // Heavy Reinforced Concrete RCC Roof (thick slab in panel-dark)
      const rccRoofGeo = new THREE.BoxGeometry(4.4, 0.55, 4.4);
      const rccRoofMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEME_COLORS.raised),
        roughness: 0.95,
        metalness: 0,
      });
      const rccRoof = new THREE.Mesh(rccRoofGeo, rccRoofMat);
      rccRoof.position.set(0, 3.5, 0);
      rightHouseGroup.add(rccRoof);

      // Interior Air Volume (Responsive to heat)
      const rccInteriorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(getRiskColor(50)),
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.85,
      });
      const rccInterior = new THREE.Mesh(interiorGeo, rccInteriorMat);
      rccInterior.position.set(0, 1.55, 0.05);
      rightHouseGroup.add(rccInterior);
      rccInteriorRef.current = rccInterior;

      scene.add(rightHouseGroup);
    },
    onRender: ({ camera }) => {
      // 1. Arc sun position and direction light across diurnal cycle (06:00 to 18:00)
      const currentHour = hour;
      const sunAngle = ((currentHour - 6) / 12) * Math.PI; // -pi/2 at 00:00, 0 at 12:00, pi at 18:00
      const isDaytime = currentHour >= 6 && currentHour <= 18;

      if (sunMeshRef.current && sunLightRef.current) {
        const radius = 10;
        const sunX = Math.cos(sunAngle) * radius;
        const sunY = Math.sin(sunAngle) * radius;
        const sunZ = -2;

        sunMeshRef.current.position.set(-sunX, Math.max(sunY, -3), sunZ);
        sunLightRef.current.position.set(-sunX * 1.5, Math.max(sunY * 1.5, 2), sunZ + 5);

        // Day vs Night light intensity
        const dayIntensity = Math.max(0.15, Math.sin(Math.max(sunAngle, 0)) * 0.9);
        sunLightRef.current.intensity = isDaytime ? dayIntensity : 0.08;
        sunMeshRef.current.visible = isDaytime;
      }

      // 2. Dynamically update interior volume colors based on indoor temp
      // Map indoor temp to risk score: 25°C -> 10 (safe), 32°C -> 45 (mod), 37°C -> 75 (high), 41°C -> 95 (extreme)
      const mapTempToScore = (temp: number) => {
        return Math.min(Math.max(((temp - 25) / 16) * 100, 0), 100);
      };

      if (tinInteriorRef.current) {
        const tinScore = mapTempToScore(thermalState.tinIndoorTemp);
        const targetColor = getRiskColor(tinScore);
        const mat = tinInteriorRef.current.material as THREE.MeshStandardMaterial;
        mat.color.lerp(targetColor, 0.2);
      }

      if (rccInteriorRef.current) {
        const rccScore = mapTempToScore(thermalState.rccIndoorTemp);
        const targetColor = getRiskColor(rccScore);
        const mat = rccInteriorRef.current.material as THREE.MeshStandardMaterial;
        mat.color.lerp(targetColor, 0.2);
      }

      // 3. Camera subtle azimuth drift
      const drift = (scrollProgress - 0.5) * 0.08;
      camera.position.x = Math.sin(drift) * 17;
      camera.position.z = Math.cos(drift) * 17;
      camera.lookAt(0, 1.2, 0);
    },
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${staticHour !== undefined ? 'h-[420px]' : 'h-[125vh]'} ${className}`}
    >
      {/* Sticky Viewport Container */}
      <div className={`${staticHour !== undefined ? 'relative h-full' : 'sticky top-16 h-[460px] sm:h-[500px]'} w-full overflow-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none`}>
        {/* TOP HUD: Clock & Shared Outdoor Ambient */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 p-4 rounded-[8px] bg-panel-dark/95 border border-border">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <div>
              <span className="text-[10px] font-mono uppercase text-raised/70 block">
                DIURNAL TIMELINE
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-raised tabular-nums tracking-tight">
                {thermalState.timeFormatted}
              </span>
            </div>
          </div>

          {/* Scrub Instruction */}
          {staticHour === undefined && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-raised/80">
              <span>Scroll to scrub 24-hour sun cycle</span>
              <span className="text-raised/60">({Math.round(scrollProgress * 100)}%)</span>
            </div>
          )}

          {/* Shared Ambient Temperature */}
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-raised/70 block">
              SHARED OUTDOOR AMBIENT
            </span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-raised tabular-nums">
              {thermalState.outdoorTemp.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* 3D WebGL Cutaway Scene */}
        <div
          ref={canvasContainerRef}
          className="absolute inset-0 z-10 w-full h-full"
          aria-label="3D Cutaway Comparison: Corrugated Tin vs Reinforced Concrete Roof"
          tabIndex={-1}
        />

        {/* BOTTOM HUD: Side-by-Side Building Dynamics Comparison */}
        <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Tin Roof Card */}
          <div className="p-4 rounded-[8px] bg-panel-dark/95 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-raised font-display">
                Informal / Corrugated Tin
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] font-medium bg-raised text-ink border border-border inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskHex(thermalState.tinIndoorTemp > 35 ? 75 : 30) }} />
                {thermalState.tinAlertGrade}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-raised tabular-nums">
                {thermalState.tinIndoorTemp.toFixed(1)}°C
              </span>
              <span className="text-xs text-raised/70">
                {thermalState.tinIndoorTemp >= thermalState.outdoorTemp ? '+' : ''}
                {(thermalState.tinIndoorTemp - thermalState.outdoorTemp).toFixed(1)}°C vs Outdoor
              </span>
            </div>
            <p className="text-xs text-raised/70 leading-relaxed">
              Low thermal mass (τ ≈ 0.9h). Rapid solar absorption causes steep peak at 14:30; radiates quickly after sunset.
            </p>
          </div>

          {/* RCC Roof Card */}
          <div className="p-4 rounded-[8px] bg-panel-dark/95 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-raised font-display">
                Reinforced Concrete Slab (RCC)
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] font-medium bg-raised text-ink border border-border inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskHex(thermalState.rccIndoorTemp > 35 ? 75 : 30) }} />
                {thermalState.rccAlertGrade}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-raised tabular-nums">
                {thermalState.rccIndoorTemp.toFixed(1)}°C
              </span>
              <span className="text-xs text-raised/70">
                {thermalState.rccIndoorTemp >= thermalState.outdoorTemp ? '+' : ''}
                {(thermalState.rccIndoorTemp - thermalState.outdoorTemp).toFixed(1)}°C vs Outdoor
              </span>
            </div>
            <p className="text-xs text-raised/70 leading-relaxed">
              High thermal mass (τ ≈ 3.4h). Peak is delayed ~2.7h until 17:15; nocturnal concrete mass retains +2.7°C at 03:00.
            </p>
          </div>
        </div>

        {/* Phase Lag Callout Banner */}
        {hour >= 14 && hour <= 18 && (
          <div className="relative z-20 mt-2 p-2.5 rounded-[6px] bg-panel-dark/95 border border-border text-center text-xs font-mono text-raised">
            <span className="text-accent font-medium mr-2">● Phase Lag Observed:</span>
            While outdoor temp cools from 39°C to 35°C, concrete thermal inertia delays RCC indoor peak to 17:15.
          </div>
        )}
        {(hour < 5 || hour >= 23) && (
          <div className="relative z-20 mt-2 p-2.5 rounded-[6px] bg-panel-dark/95 border border-border text-center text-xs font-mono text-raised">
            <span className="text-accent font-medium mr-2">● Nocturnal Retention:</span>
            At 03:00, tin sheds heat to 25.4°C while concrete mass retains 28.1°C (+2.7°C nighttime thermal strain).
          </div>
        )}
      </div>
    </div>
  );
};
