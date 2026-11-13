import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { heatColor } from '../heat';
import { isWebGLAvailable, disposeThreeHierarchy } from '../useRenderLoop';
import { TOKENS, RISK_SCALE } from '../../theme/tokens';
import { formatNumber } from '../../utils/format';

export interface WardColumnData {
  id?: number | string;
  name?: string;
  risk?: number; // 0.0 – 1.0 or 0 – 100
  wbgt?: number;
  temp?: number;
  population?: number;
  latitude?: number;
  longitude?: number;
  ward_name?: string;
  ward_code?: string;
  risk_score?: number;
  score?: number;
  wbgt_c?: number;
  temperature_c?: number;
  location_id?: number;
  [key: string]: any;
}

interface NormalizedWardColumn {
  id: number | string;
  name: string;
  risk: number;
  wbgt?: number;
  temp?: number;
  population?: number;
  latitude?: number;
  longitude?: number;
}

interface WardHeatCityProps {
  wards?: WardColumnData[];
  onWardSelect?: (wardId: number | string) => void;
  height?: number | string;
}

export const WardHeatCity: React.FC<WardHeatCityProps> = ({
  wards,
  onWardSelect,
  height = 540,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredWard, setHoveredWard] = useState<NormalizedWardColumn | null>(null);
  const [activeWard, setActiveWard] = useState<NormalizedWardColumn | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [heightMode, setHeightMode] = useState<'risk' | 'population'>('risk');

  // Check mobile or prefers-reduced-motion
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process data from props
  const cityWards: NormalizedWardColumn[] = useMemo(() => {
    if (!wards || wards.length === 0) return [];
    return wards.map((w, idx) => ({
      id: w.id || w.ward_code || w.location_id || idx + 1,
      name: w.name || w.ward_name || `Ward ${w.ward_code || idx + 1}`,
      risk: Number(w.risk ?? w.risk_score ?? w.score ?? 0),
      wbgt: w.wbgt ?? w.wbgt_c,
      temp: w.temp ?? w.temperature_c,
      population: w.population || 400000 + (idx % 5) * 50000,
      latitude: w.latitude,
      longitude: w.longitude,
    }));
  }, [wards]);

  const maxPop = useMemo(() => {
    if (cityWards.length === 0) return 1000000;
    return Math.max(...cityWards.map((w) => w.population || 100000), 1000000);
  }, [cityWards]);

  // Three.js Scene Setup (for >= 768px and WebGL available and not prefersReducedMotion)
  useEffect(() => {
    if (isMobile || prefersReducedMotion || !isWebGLAvailable()) return;
    if (cityWards.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let heightPx = container.clientHeight || 540;

    // --- 1. Scene & Atmosphere Fog (Panel Dark #14181A) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14181A);
    scene.fog = new THREE.FogExp2(0x14181A, 0.035);

    // --- 2. Camera ---
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(6.0, 6.2, 6.0);
    camera.lookAt(0, 1.1, 0);

    // --- 3. Renderer ---
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // --- 4. Controls (Bounded Orbit) ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minDistance = 4.0;
    controls.maxDistance = 16.0;
    controls.target.set(0, 1.1, 0);

    let isDragging = false;
    controls.addEventListener('start', () => {
      isDragging = true;
    });
    controls.addEventListener('end', () => {
      isDragging = false;
    });

    // --- 5. Clean Restrained Lighting ---
    const ambientLight = new THREE.AmbientLight(0xd8e8e6, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(6, 9, 5);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8fb3d9, 0.4);
    fillLight.position.set(-6, 4, -5);
    scene.add(fillLight);

    // --- 6. Ground Grid ---
    const totalCount = cityWards.length;
    const gridHelper = new THREE.GridHelper(10, 16, 0x203A45, 0x142630);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Geo coordinates
    const hasGeo = cityWards.some((w) => w.latitude && w.longitude);
    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;
    if (hasGeo) {
      cityWards.forEach((w) => {
        if (w.latitude && w.longitude) {
          minLat = Math.min(minLat, w.latitude);
          maxLat = Math.max(maxLat, w.latitude);
          minLng = Math.min(minLng, w.longitude);
          maxLng = Math.max(maxLng, w.longitude);
        }
      });
      if (maxLat === minLat) maxLat += 0.01;
      if (maxLng === minLng) maxLng += 0.01;
    }

    // --- 7. InstancedMesh for Ward Columns ---
    const boxGeo = new THREE.BoxGeometry(0.48, 1, 0.48);
    boxGeo.translate(0, 0.5, 0);

    const boxMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.15,
      transparent: true,
      opacity: 0.95,
    });

    const instancedMesh = new THREE.InstancedMesh(boxGeo, boxMat, totalCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const baseHeights = new Float32Array(totalCount);
    const targetHeights = new Float32Array(totalCount);
    const originalColors: THREE.Color[] = [];
    const currentLifts = new Float32Array(totalCount);
    const targetLifts = new Float32Array(totalCount);
    const columnCoords: { cx: number; cz: number }[] = [];

    const colsPerRow = Math.ceil(Math.sqrt(totalCount));
    const spacing = 0.65;
    const halfGrid = (colsPerRow - 1) / 2;

    for (let i = 0; i < totalCount; i++) {
      const ward = cityWards[i];
      const normRisk = ward.risk > 1.0 ? ward.risk / 100 : Math.max(0, ward.risk);

      let cx: number;
      let cz: number;
      if (hasGeo && ward.latitude && ward.longitude) {
        cx = ((ward.longitude - minLng) / (maxLng - minLng) - 0.5) * 8.0;
        cz = -((ward.latitude - minLat) / (maxLat - minLat) - 0.5) * 8.0;
      } else {
        const row = Math.floor(i / colsPerRow);
        const col = i % colsPerRow;
        cx = (col - halfGrid) * spacing;
        cz = (row - halfGrid) * spacing;
      }
      columnCoords.push({ cx, cz });

      const hRisk = 0.2 + normRisk * 3.2;
      const normPop = (ward.population || 250000) / maxPop;
      const hPop = 0.2 + normPop * 3.2;

      baseHeights[i] = heightMode === 'risk' ? hRisk : hPop;
      targetHeights[i] = baseHeights[i];

      dummy.position.set(cx, 0, cz);
      dummy.scale.set(1, 0.01, 1);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
      const colColor = new THREE.Color(heatColor(normRisk));
      originalColors.push(colColor);
      instancedMesh.setColorAt(i, colColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    scene.add(instancedMesh);

    // --- 8. Outline Wireframe for Hovered Block (--accent-hover #2C4F80) ---
    const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 1, 0.5));
    outlineGeo.translate(0, 0.5, 0);
    const outlineMat = new THREE.LineBasicMaterial({
      color: 0x2c4f80, // --accent-hover
      linewidth: 2,
    });
    const outlineBox = new THREE.LineSegments(outlineGeo, outlineMat);
    outlineBox.visible = false;
    scene.add(outlineBox);

    // --- 9. Raycasting Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredInstanceId = -1;

    const updateMouse = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handlePointerMove = (e: MouseEvent) => {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(instancedMesh);

      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const id = hits[0].instanceId;
        if (id !== hoveredInstanceId) {
          hoveredInstanceId = id;
          renderer.domElement.style.cursor = 'pointer';
          const ward = cityWards[id];
          setHoveredWard(ward);

          // Update outline position and visibility
          const coord = columnCoords[id];
          outlineBox.visible = true;
          outlineBox.position.set(coord.cx, 0.5, coord.cz);
          outlineBox.scale.set(1.06, baseHeights[id], 1.06);

          for (let j = 0; j < totalCount; j++) {
            if (j === id) {
              targetLifts[j] = 0.5;
              instancedMesh.setColorAt(j, originalColors[j].clone().multiplyScalar(1.2));
            } else {
              targetLifts[j] = 0.0;
              instancedMesh.setColorAt(j, originalColors[j].clone().multiplyScalar(0.55));
            }
          }
          if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
        }
      } else {
        if (hoveredInstanceId !== -1) {
          hoveredInstanceId = -1;
          outlineBox.visible = false;
          renderer.domElement.style.cursor = 'default';
          setHoveredWard(null);
          for (let j = 0; j < totalCount; j++) {
            targetLifts[j] = 0.0;
            instancedMesh.setColorAt(j, originalColors[j]);
          }
          if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(instancedMesh);

      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const id = hits[0].instanceId;
        const ward = cityWards[id];
        setActiveWard(ward);
        if (onWardSelect) onWardSelect(ward.id);

        // Scroll to ward list if present
        const listEl = document.getElementById('ward-city-list');
        if (listEl) {
          listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // --- 10. Visibility & Resize ---
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      heightPx = container.clientHeight || 540;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
    };
    window.addEventListener('resize', onResize);

    // --- 11. Animation Loop ---
    let rafId: number;
    const clock = new THREE.Clock();
    let entranceComplete = false;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const elapsedMs = elapsed * 1000;

      let matricesNeedUpdate = false;

      if (!entranceComplete) {
        let allGrown = true;
        for (let i = 0; i < totalCount; i++) {
          const delay = i * 20;
          const targetH = baseHeights[i];

          if (elapsedMs > delay) {
            const progress = Math.min(1.0, (elapsedMs - delay) / 500);
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentH = Math.max(0.01, ease * targetH);

            const coord = columnCoords[i];
            dummy.position.set(coord.cx, 0, coord.cz);
            dummy.scale.set(1, currentH, 1);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);

            if (progress < 1.0) allGrown = false;
          } else {
            allGrown = false;
          }
        }
        matricesNeedUpdate = true;
        if (allGrown && elapsedMs > 1100) entranceComplete = true;
      } else {
        for (let i = 0; i < totalCount; i++) {
          const diff = targetLifts[i] - currentLifts[i];
          if (Math.abs(diff) > 0.001) {
            currentLifts[i] += diff * Math.min(1.0, dt * 12.0);
            const coord = columnCoords[i];
            dummy.position.set(coord.cx, currentLifts[i], coord.cz);
            dummy.scale.set(1, baseHeights[i], 1);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
            matricesNeedUpdate = true;
          }
        }
      }

      if (hoveredInstanceId !== -1) {
        const coord = columnCoords[hoveredInstanceId];
        outlineBox.position.set(coord.cx, currentLifts[hoveredInstanceId], coord.cz);
        outlineBox.scale.set(1.05, baseHeights[hoveredInstanceId], 1.05);
      }

      if (matricesNeedUpdate) {
        instancedMesh.instanceMatrix.needsUpdate = true;
      }

      // Idle camera orbit if user not dragging
      if (!isDragging) {
        const orbitAngle = elapsed * 0.1;
        const radius = 8.6;
        camera.position.x = Math.sin(orbitAngle) * radius;
        camera.position.z = Math.cos(orbitAngle) * radius;
        camera.lookAt(0, 1.1, 0);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);

      controls.dispose();
      disposeThreeHierarchy(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cityWards, isMobile, prefersReducedMotion, heightMode, maxPop, onWardSelect]);

  // Static Isometric SVG Fallback for < 768px or prefers-reduced-motion
  if (isMobile || prefersReducedMotion || !isWebGLAvailable()) {
    return (
      <div
        className="w-full rounded-[8px] overflow-hidden border border-border bg-panel-dark p-4 flex flex-col justify-between"
        style={{ minHeight: height }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div>
            <span className="text-xs font-mono font-medium text-raised uppercase tracking-wider block">
              Hyperlocal Ward Heat Landscape
            </span>
            <span className="text-[11px] font-mono text-raised/70 block">
              Static Isometric Projection • Height encodes {heightMode}
            </span>
          </div>
          {/* Toggle Button */}
          <div className="flex items-center gap-1 bg-surface/20 p-1 rounded-[6px] border border-border">
            <button
              type="button"
              onClick={() => setHeightMode('risk')}
              className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium transition-colors ${
                heightMode === 'risk'
                  ? 'bg-accent text-on-accent'
                  : 'text-raised/70 hover:text-raised'
              }`}
            >
              Height: Risk
            </button>
            <button
              type="button"
              onClick={() => setHeightMode('population')}
              className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium transition-colors ${
                heightMode === 'population'
                  ? 'bg-accent text-on-accent'
                  : 'text-raised/70 hover:text-raised'
              }`}
            >
              Height: Population
            </button>
          </div>
        </div>

        {/* SVG Isometric Grid */}
        <div className="w-full overflow-x-auto py-4 flex items-center justify-center">
          <svg
            viewBox="0 0 600 320"
            className="w-full max-w-[580px] h-auto select-none"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            {cityWards.map((w, idx) => {
              const cols = Math.ceil(Math.sqrt(cityWards.length));
              const row = Math.floor(idx / cols);
              const col = idx % cols;

              // Isometric coords
              const isoX = 300 + (col - row) * 24;
              const isoY = 120 + (col + row) * 12;

              const normRisk = w.risk > 1.0 ? w.risk / 100 : Math.max(0, w.risk);
              const normPop = (w.population || 250000) / maxPop;
              const val = heightMode === 'risk' ? normRisk : normPop;
              const blockH = Math.max(10, Math.round(val * 48));

              const topColor = heatColor(normRisk);
              const isSelected = activeWard?.id === w.id;

              return (
                <g
                  key={w.id || idx}
                  className="cursor-pointer transition-transform hover:opacity-90"
                  onClick={() => {
                    setActiveWard(w);
                    if (onWardSelect) onWardSelect(w.id);
                  }}
                >
                  <title>{`${w.name} — Risk: ${Math.round(w.risk > 1 ? w.risk : w.risk * 100)} / 100, WBGT: ${w.wbgt || 'N/A'}°C`}</title>

                  {/* Left Face */}
                  <polygon
                    points={`${isoX - 12},${isoY - blockH + 6} ${isoX},${isoY - blockH + 12} ${isoX},${isoY + 12} ${isoX - 12},${isoY + 6}`}
                    fill="#1A242B"
                    stroke={isSelected ? TOKENS.accentHover : TOKENS.border}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                  />
                  {/* Right Face */}
                  <polygon
                    points={`${isoX},${isoY - blockH + 12} ${isoX + 12},${isoY - blockH + 6} ${isoX + 12},${isoY + 6} ${isoX},${isoY + 12}`}
                    fill="#101A20"
                    stroke={isSelected ? TOKENS.accentHover : TOKENS.border}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                  />
                  {/* Top Face */}
                  <polygon
                    points={`${isoX},${isoY - blockH} ${isoX + 12},${isoY - blockH + 6} ${isoX},${isoY - blockH + 12} ${isoX - 12},${isoY - blockH + 6}`}
                    fill={topColor}
                    stroke={isSelected ? '#FBF9F4' : '#14181A'}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Card / Footer */}
        <div className="flex items-center justify-between text-[11px] font-mono text-raised/80 pt-2 border-t border-border/40">
          <span>Tap block to inspect ward</span>
          {activeWard && (
            <span className="font-semibold text-raised">
              {activeWard.name}: Risk {Math.round(activeWard.risk > 1 ? activeWard.risk : activeWard.risk * 100)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Desktop WebGL Scene
  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-[8px] overflow-hidden border border-border bg-panel-dark flex flex-col justify-between"
      style={{ minHeight: height }}
      aria-label="Interactive 3D Ward Heat Landscape"
    >
      {/* Stage Header, Mode Toggle, Legend Top-Right */}
      <div className="w-full flex flex-wrap items-center justify-between p-5 z-10 pointer-events-none gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-mono font-medium text-raised uppercase tracking-[0.10em] block">
            Hyperlocal Ward Heat Landscape
          </span>
          <span className="text-[11px] font-mono text-raised/70 block">
            {heightMode === 'risk'
              ? 'Extruded Height Encodes Multi-Factorial Human Thermal Stress'
              : 'Extruded Height Encodes Population Exposed'}
          </span>
        </div>

        {/* Toggle Button & Legend Top-Right */}
        <div className="flex items-center gap-3">
          {/* Toggle Height: Risk vs Population */}
          <div className="pointer-events-auto flex items-center gap-1 bg-panel-dark/90 p-1 rounded-[6px] border border-border shadow-sm">
            <button
              type="button"
              onClick={() => setHeightMode('risk')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-medium transition-colors cursor-pointer ${
                heightMode === 'risk'
                  ? 'bg-accent text-on-accent'
                  : 'text-raised/70 hover:text-raised'
              }`}
            >
              Height: Risk
            </button>
            <button
              type="button"
              onClick={() => setHeightMode('population')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-medium transition-colors cursor-pointer ${
                heightMode === 'population'
                  ? 'bg-accent text-on-accent'
                  : 'text-raised/70 hover:text-raised'
              }`}
            >
              Height: Population
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 bg-panel-dark/90 px-3 py-1.5 rounded-[6px] border border-border text-[11px] font-mono text-raised">
            <span className="text-raised/70">Risk:</span>
            <span className="flex items-center gap-1 text-raised">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk1 }} /> Low
            </span>
            <span className="flex items-center gap-1 text-raised">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk2 }} /> Mod
            </span>
            <span className="flex items-center gap-1 text-raised">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk3 }} /> High
            </span>
            <span className="flex items-center gap-1 text-raised">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk4 }} /> Very High
            </span>
            <span className="flex items-center gap-1 text-raised">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SCALE.risk5 }} /> Ext
            </span>
          </div>
        </div>
      </div>

      {/* HTML Tooltip on Hover */}
      {hoveredWard && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3.5 py-2 rounded-[6px] bg-panel-dark border border-border text-xs font-mono space-y-1 transition-transform duration-75 text-raised shadow-xl"
          style={{
            left: `${Math.min(window.innerWidth - 220, tooltipPos.x + 16)}px`,
            top: `${Math.max(10, tooltipPos.y - 48)}px`,
          }}
        >
          <div className="font-bold text-raised flex items-center justify-between gap-4">
            <span>{hoveredWard.name}</span>
            <span className="inline-flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: heatColor(hoveredWard.risk > 1 ? hoveredWard.risk / 100 : hoveredWard.risk) }}
              />
              Risk {Math.round(hoveredWard.risk > 1 ? hoveredWard.risk : hoveredWard.risk * 100)}
            </span>
          </div>
          <div className="text-[10px] text-raised/70 flex items-center gap-3">
            <span>WBGT: {hoveredWard.wbgt ? `${hoveredWard.wbgt}°C` : 'N/A'}</span>
            <span>Pop: {hoveredWard.population ? `${formatNumber(hoveredWard.population / 1000, 0)}k` : 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Caption Bottom-Left & Selected Ward Card Bottom-Right */}
      <div className="w-full p-4 flex flex-wrap items-end justify-between gap-4 z-10 pointer-events-none">
        <div className="text-[11px] font-mono text-raised/70 bg-panel-dark/90 px-3 py-1.5 rounded-[6px] border border-border">
          Left-drag to orbit • Scroll to zoom • Hover block to inspect ward telemetry • Click to select
        </div>

        {activeWard && (
          <div className="pointer-events-auto bg-panel-dark border border-border rounded-[6px] p-3 text-xs font-mono space-y-1 text-raised">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-raised">{activeWard.name}</span>
              <span className="font-medium px-2 py-0.5 rounded-[4px] text-[10px] bg-raised text-ink border border-border inline-flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: heatColor(activeWard.risk > 1 ? activeWard.risk / 100 : activeWard.risk) }}
                />
                Risk {Math.round(activeWard.risk > 1 ? activeWard.risk : activeWard.risk * 100)}
              </span>
            </div>
            <div className="text-[10px] text-raised/70">
              {activeWard.wbgt ? `Est. WBGT: ${activeWard.wbgt}°C` : ''}{' '}
              {activeWard.temp ? `• Dry-Bulb: ${activeWard.temp}°C` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
