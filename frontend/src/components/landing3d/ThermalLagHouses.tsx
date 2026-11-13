import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Sun, Moon, Clock, Info } from 'lucide-react';
import { useThreeScene } from './useThreeScene';
import { useScrollProgress } from './useScrollProgress';
import { evaluateThermalLag } from '../../lib/thermalLag';
import { getRiskColor, getRiskHex } from './palette';
import { THEME_COLORS } from '../../theme/tokens';
import { formatNumber } from '../../utils/format';

export interface ThermalLagHousesProps {
  className?: string;
  staticHour?: number; // For static fallback mode
}

const PRESET_HOURS = [
  { label: 'Dawn (06:00)', hour: 6.0, icon: Sun, desc: 'Cool morning baseline before sunrise' },
  { label: 'Solar Peak (12:00)', hour: 12.0, icon: Sun, desc: 'Sun directly overhead at maximum intensity' },
  { label: 'Tin Roof Peak (14:30)', hour: 14.5, icon: Clock, desc: 'Thin metal roof peaks at dangerous 41.2°C' },
  { label: 'Concrete Delayed Peak (17:15)', hour: 17.25, icon: Clock, desc: 'Concrete roof heat delay causes late afternoon indoor peak' },
  { label: 'Night Heat Trap (03:00)', hour: 3.0, icon: Moon, desc: 'Concrete retains trapped heat all night long' },
];

export const ThermalLagHouses: React.FC<ThermalLagHousesProps> = ({
  className = '',
  staticHour,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hour state: default to 14.5 (14:30 Tin peak) so the scene is immediately bright & informative
  const [hour, setHour] = useState<number>(staticHour !== undefined ? staticHour : 14.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(staticHour === undefined);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);

  const hourRef = useRef<number>(hour);
  hourRef.current = hour;

  // Auto-play 24-hour cycle loop
  useEffect(() => {
    if (!isPlaying || staticHour !== undefined) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Advance ~1.2 hours per second (full 24h cycle in 20 seconds)
      const nextHour = (hourRef.current + delta * 1.2) % 24;
      hourRef.current = nextHour;
      setHour(nextHour);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, staticHour]);

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
    cameraPosition: [0, 8.5, 16.5],
    cameraLookAt: [0, 1.2, 0],
    clearAlpha: 0,
    onInit: ({ scene }) => {
      // 1. Soft Ambient Light
      const ambient = new THREE.AmbientLight(0xd8e8e6, 0.65);
      scene.add(ambient);

      // 2. Sunlight Directional
      const sunLight = new THREE.DirectionalLight(0xfffaed, 1.1);
      sunLight.position.set(0, 15, 6);
      scene.add(sunLight);
      sunLightRef.current = sunLight;

      // 3. Sun Marker Sphere with warm glow
      const sunGeo = new THREE.SphereGeometry(0.45, 24, 24);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
      const sunMesh = new THREE.Mesh(sunGeo, sunMat);
      scene.add(sunMesh);
      sunMeshRef.current = sunMesh;

      // 4. Ground Grid & Base Platform in --raised
      const grid = new THREE.GridHelper(22, 22, THEME_COLORS.raised, THEME_COLORS.raised);
      grid.position.y = 0;
      if (grid.material instanceof THREE.Material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.22;
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

      // Corrugated Tin Roof
      const tinRoofGeo = new THREE.BoxGeometry(4.6, 0.12, 4.4);
      const tinRoofMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEME_COLORS.muted),
        roughness: 0.55,
        metalness: 0.35,
      });
      const tinRoof = new THREE.Mesh(tinRoofGeo, tinRoofMat);
      tinRoof.position.set(0, 3.35, 0);
      tinRoof.rotation.z = -0.06;
      leftHouseGroup.add(tinRoof);

      // Interior Air Volume (Responsive to heat)
      const interiorGeo = new THREE.BoxGeometry(3.6, 2.9, 3.5);
      const tinInteriorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(getRiskColor(75)),
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.82,
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

      // Heavy Reinforced Concrete RCC Roof
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
        color: new THREE.Color(getRiskColor(45)),
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.82,
      });
      const rccInterior = new THREE.Mesh(interiorGeo, rccInteriorMat);
      rccInterior.position.set(0, 1.55, 0.05);
      rightHouseGroup.add(rccInterior);
      rccInteriorRef.current = rccInterior;

      scene.add(rightHouseGroup);
    },
    onRender: ({ camera }) => {
      const currentHour = hourRef.current;
      // Solar angle: 0 at 06:00, PI/2 at 12:00, PI at 18:00
      const SOLAR_SPAN_HOURS = 12;
      const sunAngle = ((currentHour - 6) / SOLAR_SPAN_HOURS) * Math.PI;
      const isDaytime = currentHour >= 5.5 && currentHour <= 18.5;

      if (sunMeshRef.current && sunLightRef.current) {
        const radius = 11;
        const sunX = Math.cos(sunAngle) * radius;
        const sunY = Math.sin(sunAngle) * radius;
        const sunZ = -2;

        sunMeshRef.current.position.set(-sunX, Math.max(sunY, -3), sunZ);
        sunLightRef.current.position.set(-sunX * 1.5, Math.max(sunY * 1.5, 2), sunZ + 5);

        // Day vs Night light intensity
        const dayIntensity = Math.max(0.2, Math.sin(Math.max(sunAngle, 0)) * 1.1);
        sunLightRef.current.intensity = isDaytime ? dayIntensity : 0.08;
        sunMeshRef.current.visible = isDaytime;
      }

      // Map indoor temp to risk score: 25°C -> 10, 32°C -> 45, 37°C -> 75, 41°C -> 95
      const mapTempToScore = (temp: number) => {
        return Math.min(Math.max(((temp - 25) / 16) * 100, 0), 100);
      };

      if (tinInteriorRef.current) {
        const tinScore = mapTempToScore(thermalState.tinIndoorTemp);
        const targetColor = getRiskColor(tinScore);
        const mat = tinInteriorRef.current.material as THREE.MeshStandardMaterial;
        mat.color.lerp(targetColor, 0.25);
      }

      if (rccInteriorRef.current) {
        const rccScore = mapTempToScore(thermalState.rccIndoorTemp);
        const targetColor = getRiskColor(rccScore);
        const mat = rccInteriorRef.current.material as THREE.MeshStandardMaterial;
        mat.color.lerp(targetColor, 0.25);
      }

      // Subtle camera angle
      camera.position.x = Math.sin(0.04) * 16.5;
      camera.position.z = Math.cos(0.04) * 16.5;
      camera.lookAt(0, 1.2, 0);
    },
  });

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setUserInteracted(true);
    setIsPlaying(false);
    setHour(val);
  };

  const handlePresetClick = (presetHour: number) => {
    setUserInteracted(true);
    setIsPlaying(false);
    setHour(presetHour);
  };

  const togglePlay = () => {
    setUserInteracted(true);
    setIsPlaying((prev) => !prev);
  };

  const resetToPeak = () => {
    setUserInteracted(true);
    setIsPlaying(false);
    setHour(14.5);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative w-full rounded-[8px] border border-border bg-panel-dark overflow-hidden select-none ${className}`}
    >
      <div className="relative w-full min-h-[520px] sm:min-h-[560px] flex flex-col justify-between p-4 sm:p-6 lg:p-7">
        {/* TOP HUD: Clock, Interactive Controls & Outdoor Temp */}
        <div className="relative z-20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 rounded-[8px] bg-panel-dark/90 backdrop-blur-md border border-border">
            {/* Clock & Time Display */}
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
              <div>
                <span className="text-[10px] font-mono uppercase text-raised/70 block">
                  DAILY CYCLE CLOCK
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-raised tabular-nums tracking-tight">
                  {thermalState.timeFormatted}
                </span>
              </div>
            </div>

            {/* Play/Pause & Interactive Scrubber */}
            <div className="flex-1 max-w-xs sm:max-w-sm flex items-center gap-2.5 px-2">
              <button
                type="button"
                onClick={togglePlay}
                title={isPlaying ? 'Pause 24-hour cycle' : 'Play 24-hour cycle'}
                className="w-8 h-8 rounded-[6px] bg-raised hover:bg-surface border border-border text-ink flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={hour}
                  onChange={handleSliderChange}
                  className="w-full accent-accent cursor-pointer h-1.5 bg-raised/30 rounded-lg appearance-none"
                  aria-label="Scrub 24-hour pattern"
                />
                <div className="flex justify-between text-[9px] font-mono text-raised/50 px-0.5">
                  <span>00h</span>
                  <span>06h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>24h</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetToPeak}
                title="Reset to 14:30 Peak"
                className="w-8 h-8 rounded-[6px] bg-raised/70 hover:bg-raised border border-border text-ink flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shared Ambient Temperature */}
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-raised/70 block">
                OUTDOOR AMBIENT
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-raised tabular-nums">
                {formatNumber(thermalState.outdoorTemp, 1)}°C
              </span>
            </div>
          </div>

          {/* Quick Jump Scenario Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-raised/60 mr-1 hidden sm:inline">
              Key Timestamps:
            </span>
            {PRESET_HOURS.map((p) => {
              const isActive = Math.abs(hour - p.hour) < 0.75;
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetClick(p.hour)}
                  title={p.desc}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-accent text-on-accent border border-accent font-semibold shadow-none'
                      : 'bg-panel-dark/80 hover:bg-panel-dark text-raised/70 hover:text-raised border border-border/70'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
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
        <div className="relative z-20 space-y-4 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Tin Roof Card */}
            <div className="p-5 sm:p-6 rounded-[10px] bg-panel-dark/95 backdrop-blur-md border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-raised font-display">
                  Informal Tin-Roof Home
                </span>
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-[4px] font-medium bg-raised text-ink border border-border inline-flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getRiskHex(thermalState.tinIndoorTemp > 35 ? 75 : 30) }}
                  />
                  {thermalState.tinAlertGrade}
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono my-1">
                <span className="text-3xl sm:text-4xl font-bold text-raised tabular-nums">
                  {formatNumber(thermalState.tinIndoorTemp, 1)}°C
                </span>
                <span className="text-xs text-raised/80 font-medium">
                  {thermalState.tinIndoorTemp >= thermalState.outdoorTemp ? '+' : ''}
                  {formatNumber(thermalState.tinIndoorTemp - thermalState.outdoorTemp, 1)}°C vs Outdoor
                </span>
              </div>
              <p className="text-xs sm:text-sm text-raised/70 leading-relaxed pt-1 border-t border-border/40">
                Thin metal absorbs direct sunlight immediately. By 2:30 PM the room turns into an oven (41°C). Once the sun sets, it cools down quickly.
              </p>
            </div>

            {/* RCC Roof Card */}
            <div className="p-5 sm:p-6 rounded-[10px] bg-panel-dark/95 backdrop-blur-md border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-raised font-display">
                  Engineered Concrete (RCC) Home
                </span>
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-[4px] font-medium bg-raised text-ink border border-border inline-flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getRiskHex(thermalState.rccIndoorTemp > 35 ? 75 : 30) }}
                  />
                  {thermalState.rccAlertGrade}
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono my-1">
                <span className="text-3xl sm:text-4xl font-bold text-raised tabular-nums">
                  {formatNumber(thermalState.rccIndoorTemp, 1)}°C
                </span>
                <span className="text-xs text-raised/80 font-medium">
                  {thermalState.rccIndoorTemp >= thermalState.outdoorTemp ? '+' : ''}
                  {formatNumber(thermalState.rccIndoorTemp - thermalState.outdoorTemp, 1)}°C vs Outdoor
                </span>
              </div>
              <p className="text-xs sm:text-sm text-raised/70 leading-relaxed pt-1 border-t border-border/40">
                Thick concrete delays heat from penetrating, reaching its hottest indoor temperature late at 5:15 PM. At night, it traps heat and stays warm until morning.
              </p>
            </div>
          </div>

          {/* Dynamic Scientific Callout Banners */}
          <AnimatePresence mode="wait">
            {hour >= 14 && hour <= 18 && (
              <motion.div
                key="phase-lag"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="p-2.5 rounded-[6px] bg-panel-dark/95 border border-border text-center text-xs font-mono text-raised flex items-center justify-center gap-2"
              >
                <span className="text-accent font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                  Heat Delay Observed:
                </span>
                <span>
                  While outdoor air cools from 39°C down to 35°C, heat soaked into the concrete roof continues warming the room until 5:15 PM.
                </span>
              </motion.div>
            )}
            {(hour < 5.5 || hour >= 22.5) && (
              <motion.div
                key="nocturnal"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="p-2.5 rounded-[6px] bg-panel-dark/95 border border-border text-center text-xs font-mono text-raised flex items-center justify-center gap-2"
              >
                <span className="text-accent font-semibold flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-accent shrink-0" />
                  Trapped Nighttime Heat:
                </span>
                <span>
                  At night, tin roofs cool to 25°C while concrete holds 28°C (+3°C trapped heat), disrupting sleep and recovery.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
