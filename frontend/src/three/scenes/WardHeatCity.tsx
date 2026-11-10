import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { heatColor } from '../heat';
import { isWebGLAvailable, disposeThreeHierarchy } from '../useRenderLoop';

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

  // Skip entirely below 768px (Section 7.8)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Process data from props. If no data provided, leaves nothing to render.
  const cityWards: NormalizedWardColumn[] = useMemo(() => {
    if (!wards || wards.length === 0) return [];
    return wards.map((w, idx) => ({
      id: w.id || w.ward_code || w.location_id || idx + 1,
      name: w.name || w.ward_name || `Ward ${w.ward_code || idx + 1}`,
      risk: Number(w.risk ?? w.risk_score ?? w.score ?? 0),
      wbgt: w.wbgt ?? w.wbgt_c,
      temp: w.temp ?? w.temperature_c,
      population: w.population,
      latitude: w.latitude,
      longitude: w.longitude,
    }));
  }, [wards]);

  useEffect(() => {
    if (isMobile || !isWebGLAvailable()) return;
    if (cityWards.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let heightPx = container.clientHeight || 540;

    // --- 1. Scene & Atmosphere Fog (Palette Midnight #0B141B) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B141B);
    scene.fog = new THREE.FogExp2(0x0B141B, 0.035);

    // --- 2. Camera ---
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(6.0, 6.2, 6.0);
    camera.lookAt(0, 1.1, 0);

    // --- 3. Renderer (Flat surfaces, restrained depth, no bloom halo) ---
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
    });
    renderer.setSize(width, heightPx);
    // Cap DPR at 1.5 (Section 7.8)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // --- 4. Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minDistance = 4.0;
    controls.maxDistance = 18.0;
    controls.target.set(0, 1.1, 0);

    let isDragging = false;
    controls.addEventListener('start', () => { isDragging = true; });
    controls.addEventListener('end', () => { isDragging = false; });

    // --- 5. Clean Restrained Lighting (no bloom halo, no amethyst rim) ---
    const ambientLight = new THREE.AmbientLight(0xd8e8e6, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(6, 9, 5);
    scene.add(dirLight);

    // Subtle steel-blue accent fill light from high rear angle
    const fillLight = new THREE.DirectionalLight(0x8fb3d9, 0.4);
    fillLight.position.set(-6, 4, -5);
    scene.add(fillLight);

    // --- 6. Ground Grid ---
    const totalCount = cityWards.length;
    const gridHelper = new THREE.GridHelper(10, 16, 0x203A45, 0x142630);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Compute geographic coordinate bounds if available
    const hasGeo = cityWards.some((w) => w.latitude && w.longitude);
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
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
        // Position from real geography
        cx = ((ward.longitude - minLng) / (maxLng - minLng) - 0.5) * 8.0;
        cz = -((ward.latitude - minLat) / (maxLat - minLat) - 0.5) * 8.0;
      } else {
        const row = Math.floor(i / colsPerRow);
        const col = i % colsPerRow;
        cx = (col - halfGrid) * spacing;
        cz = (row - halfGrid) * spacing;
      }
      columnCoords.push({ cx, cz });

      // Height formula: encodes multi-factorial risk
      const h = 0.2 + normRisk * 3.2;
      baseHeights[i] = h;

      dummy.position.set(cx, 0, cz);
      dummy.scale.set(1, 0.01, 1);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
      // Strictly from the risk scale
      const colColor = new THREE.Color(heatColor(normRisk));
      originalColors.push(colColor);
      instancedMesh.setColorAt(i, colColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    scene.add(instancedMesh);

    // --- 8. Raycasting Interaction ---
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
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // --- 9. Visibility & Resize ---
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

    // --- 10. Animation Loop & prefers-reduced-motion ---
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Render static frame under prefers-reduced-motion
    if (prefersReducedMotion) {
      for (let i = 0; i < totalCount; i++) {
        const coord = columnCoords[i];
        dummy.position.set(coord.cx, 0, coord.cz);
        dummy.scale.set(1, baseHeights[i], 1);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);

      return () => {
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
    }

    let rafId: number;
    const clock = new THREE.Clock();
    let entranceComplete = false;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return; // Pause render loop when off-screen or tab hidden

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

      if (matricesNeedUpdate) {
        instancedMesh.instanceMatrix.needsUpdate = true;
      }

      // Idle camera orbit if user not dragging
      if (!isDragging) {
        const orbitAngle = elapsed * 0.12;
        const radius = 8.6;
        camera.position.x = Math.sin(orbitAngle) * radius;
        camera.position.z = Math.cos(orbitAngle) * radius;
        camera.lookAt(0, 1.1, 0);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- 11. Cleanup ---
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
  }, [cityWards, isMobile, onWardSelect]);

  // If mobile or no data, do not render scene
  if (isMobile || cityWards.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-[14px] overflow-hidden border border-white/[0.075] bg-[#0B141B] shadow-2xl flex flex-col justify-between"
      style={{ minHeight: height }}
      aria-hidden="true"
    >
      {/* Stage Header & Legend Top-Right */}
      <div className="w-full flex items-center justify-between p-5 z-10 pointer-events-none">
        <div className="space-y-0.5">
          <span className="text-xs font-mono font-medium text-[#D8E8E6] uppercase tracking-[0.10em] block">
            Hyperlocal Ward Heat Landscape
          </span>
          <span className="text-[11px] font-mono text-[#6B7C8A] block">
            Extruded Height &amp; Color Encode Multi-Factorial Human Thermal Stress
          </span>
        </div>

        {/* Legend Top-Right */}
        <div className="flex items-center gap-2 bg-[#142630]/80 backdrop-blur-md px-3 py-1.5 rounded-[8px] border border-white/[0.075] text-[11px] font-mono">
          <span className="text-[#93A3B0]">Risk:</span>
          <span className="flex items-center gap-1 text-[#2FA37C]">
            <span className="w-2 h-2 rounded-full bg-[#2FA37C]" /> Low
          </span>
          <span className="flex items-center gap-1 text-[#E8C547]">
            <span className="w-2 h-2 rounded-full bg-[#E8C547]" /> Mod
          </span>
          <span className="flex items-center gap-1 text-[#F59E0B]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> High
          </span>
          <span className="flex items-center gap-1 text-[#FF704F]">
            <span className="w-2 h-2 rounded-full bg-[#FF704F]" /> Very High
          </span>
          <span className="flex items-center gap-1 text-[#C31D3C]">
            <span className="w-2 h-2 rounded-full bg-[#C31D3C]" /> Ext
          </span>
        </div>
      </div>

      {/* Tooltip on Hover */}
      {hoveredWard && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3.5 py-2 rounded-[8px] bg-[#0B141B]/95 backdrop-blur-md border border-white/[0.14] shadow-2xl text-xs font-mono space-y-1 transition-transform duration-75"
          style={{
            left: `${Math.min(window.innerWidth - 220, tooltipPos.x + 16)}px`,
            top: `${Math.max(10, tooltipPos.y - 48)}px`,
          }}
        >
          <div className="font-bold text-white flex items-center justify-between gap-4">
            <span>{hoveredWard.name}</span>
            <span style={{ color: heatColor(hoveredWard.risk) }}>
              Risk {Math.round(hoveredWard.risk > 1 ? hoveredWard.risk : hoveredWard.risk * 100)}
            </span>
          </div>
          <div className="text-[10px] text-[#93A3B0] flex items-center gap-3">
            <span>WBGT: {hoveredWard.wbgt ? `${hoveredWard.wbgt}°C` : 'N/A'}</span>
            <span>Pop: {hoveredWard.population ? `${(hoveredWard.population / 1000).toFixed(0)}k` : 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Caption Bottom-Left & Selected Ward Card Bottom-Right */}
      <div className="w-full p-4 flex flex-wrap items-end justify-between gap-4 z-10 pointer-events-none">
        <div className="text-[11px] font-mono text-[#6B7C8A] bg-[#0B141B]/80 px-3 py-1.5 rounded-[6px] border border-white/[0.05]">
          Left-drag to orbit • Scroll to zoom • Hover column to inspect ward telemetry
        </div>

        {activeWard && (
          <div className="pointer-events-auto bg-[#142630]/90 backdrop-blur-md border border-white/[0.14] rounded-[10px] p-3 text-xs font-mono space-y-1 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-white">{activeWard.name}</span>
              <span
                className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{
                  backgroundColor: `${heatColor(activeWard.risk)}25`,
                  color: heatColor(activeWard.risk),
                }}
              >
                Risk {Math.round(activeWard.risk > 1 ? activeWard.risk : activeWard.risk * 100)}
              </span>
            </div>
            <div className="text-[10px] text-[#93A3B0]">
              {activeWard.wbgt ? `Est. WBGT: ${activeWard.wbgt}°C` : ''} {activeWard.temp ? `• Dry-Bulb: ${activeWard.temp}°C` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
