import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { THREE_TOKENS } from '../tokens';
import { heatColor } from '../heat';
import { isWebGLAvailable, disposeThreeHierarchy } from '../useRenderLoop';

export interface WardColumnData {
  id: number | string;
  name: string;
  risk: number; // 0.0 – 1.0 or 0 – 100
  wbgt?: number;
  temp?: number;
  population?: number;
}

interface WardHeatCityProps {
  wards?: WardColumnData[];
  gridSize?: number; // 14 desktop / 9 mobile
  onWardSelect?: (wardId: number | string) => void;
  height?: number | string;
}

export const WardHeatCity: React.FC<WardHeatCityProps> = ({
  wards,
  gridSize: userGridSize,
  onWardSelect,
  height = 540,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredWard, setHoveredWard] = useState<WardColumnData | null>(null);
  const [activeWard, setActiveWard] = useState<WardColumnData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Generate N x N wards if not provided
  const isMobileInitial = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const gridSize = userGridSize || (isMobileInitial ? 9 : 14);

  const cityWards = React.useMemo(() => {
    if (wards && wards.length > 0) return wards;

    const items: WardColumnData[] = [];
    const wardPrefixes = [
      'M/East', 'A/Colaba', 'F/North', 'G/South', 'H/West', 'K/East',
      'L/Kurla', 'P/North', 'R/Central', 'N/Ghatkopar', 'S/Bhandup', 'T/Mulund'
    ];
    const count = gridSize * gridSize;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const distFromCenter = Math.sqrt(
        Math.pow(row - gridSize / 2, 2) + Math.pow(col - gridSize / 2, 2)
      );
      const baseRisk = 0.88 - (distFromCenter / gridSize) * 0.65;
      const noise = (Math.sin(row * 2.1) + Math.cos(col * 1.8)) * 0.08;
      const risk = Math.min(0.98, Math.max(0.12, baseRisk + noise));

      const prefix = wardPrefixes[i % wardPrefixes.length];
      items.push({
        id: i + 1,
        name: `Ward ${prefix} - S${col + 1}`,
        risk,
        wbgt: +(26.0 + risk * 7.5).toFixed(1),
        temp: +(33.0 + risk * 9.5).toFixed(1),
        population: Math.floor(45000 + risk * 120000),
      });
    }
    return items;
  }, [wards, gridSize]);

  useEffect(() => {
    if (!isWebGLAvailable()) return;

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let heightPx = container.clientHeight || 540;
    const isMobile = window.innerWidth < 768;

    // --- 1. Scene & Depth Fog ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101820);
    scene.fog = new THREE.FogExp2(0x101820, 0.035);

    // --- 2. Camera ---
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    // Orbit camera at radius 8.6, height 6.2, lookAt(0, 1.1, 0)
    camera.position.set(6.0, 6.2, 6.0);
    camera.lookAt(0, 1.1, 0);

    // --- 3. Renderer ---
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- 4. Post-Processing Bloom ---
    let composer: EffectComposer | null = null;
    if (!isMobile) {
      const renderPass = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width / 2, heightPx / 2),
        0.55,
        0.5,
        0.22
      );
      composer = new EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
    }

    // --- 5. Controls ---
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

    // --- 6. Lighting (Amethyst rim point light from behind-left) ---
    const ambientLight = new THREE.AmbientLight(0x8899bb, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(6, 9, 5);
    scene.add(dirLight);

    // Amethyst rim light from behind-left (-7, 4, -6)
    const amethystRim = new THREE.PointLight(new THREE.Color(THREE_TOKENS.accent), 2.5, 20);
    amethystRim.position.set(-7, 4, -6);
    scene.add(amethystRim);

    // --- 7. Ground Grid ---
    const totalCount = Math.min(cityWards.length, gridSize * gridSize);
    const spacing = 0.58;
    const gridSpan = gridSize * spacing;
    const gridHelper = new THREE.GridHelper(gridSpan, gridSize, 0x1c2c38, 0x16232d);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // --- 8. InstancedMesh for Ward Columns ---
    // BoxGeometry(0.46, 1, 0.46) translated so base sits at y=0
    const boxGeo = new THREE.BoxGeometry(0.46, 1, 0.46);
    boxGeo.translate(0, 0.5, 0);

    const boxMat = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95,
    });

    const instancedMesh = new THREE.InstancedMesh(boxGeo, boxMat, totalCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const halfGrid = (gridSize - 1) / 2;
    const baseHeights = new Float32Array(totalCount);
    const originalColors: THREE.Color[] = [];
    const currentLifts = new Float32Array(totalCount);
    const targetLifts = new Float32Array(totalCount);
    const columnCoords: { x: number; z: number; cx: number; cz: number }[] = [];

    for (let i = 0; i < totalCount; i++) {
      const ward = cityWards[i];
      const normRisk = ward.risk > 1.0 ? ward.risk / 100 : ward.risk;
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      const cx = (col - halfGrid) * spacing;
      const cz = (row - halfGrid) * spacing;

      columnCoords.push({ x: col, z: row, cx, cz });

      // Height formula: h = 0.18 + risk * 3.1
      const h = 0.18 + normRisk * 3.1;
      baseHeights[i] = h;

      dummy.position.set(cx, 0, cz);
      dummy.scale.set(1, 0.01, 1); // starts flat for diagonal entrance stagger
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

          // Spring lift hovered column +0.5; dim neighbors to 55%
          for (let j = 0; j < totalCount; j++) {
            if (j === id) {
              targetLifts[j] = 0.5;
              instancedMesh.setColorAt(j, originalColors[j].clone().multiplyScalar(1.2));
            } else {
              targetLifts[j] = 0.0;
              // Dim neighbors to 55%
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
          // Restore all colors and lifts
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
      if (composer) composer.setSize(width, heightPx);
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

      // Entrance diagonal stagger: delay = (x + z) * 14ms over 900ms total
      let matricesNeedUpdate = false;

      if (!entranceComplete) {
        let allGrown = true;
        for (let i = 0; i < totalCount; i++) {
          const coord = columnCoords[i];
          const delay = (coord.x + coord.z) * 14;
          const targetH = baseHeights[i];

          if (elapsedMs > delay) {
            const progress = Math.min(1.0, (elapsedMs - delay) / 500);
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentH = Math.max(0.01, ease * targetH);

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
        // Idle spring physics for hovered column lift (+0.5)
        for (let i = 0; i < totalCount; i++) {
          const diff = targetLifts[i] - currentLifts[i];
          if (Math.abs(diff) > 0.001) {
            currentLifts[i] += diff * Math.min(1.0, dt * 12.0); // smooth spring ease
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

      // Idle camera orbit 0.16 rad/s at radius ~8.6 if user not dragging
      if (!isDragging) {
        const orbitAngle = elapsed * 0.16;
        const radius = 8.6;
        camera.position.x = Math.sin(orbitAngle) * radius;
        camera.position.z = Math.cos(orbitAngle) * radius;
        camera.lookAt(0, 1.1, 0);
      }

      controls.update();

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // --- 12. Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);

      controls.dispose();
      disposeThreeHierarchy(scene);
      if (composer) {
        composer.renderTarget1.dispose();
        composer.renderTarget2.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cityWards, gridSize, onWardSelect]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-[14px] overflow-hidden border border-white/8 bg-[#0B141B] shadow-2xl flex flex-col justify-between"
      style={{ minHeight: height }}
      aria-hidden="true"
    >
      {/* Stage Header & Legend Top-Right */}
      <div className="w-full flex items-center justify-between p-5 z-10 pointer-events-none">
        <div className="space-y-0.5">
          <span className="text-xs font-mono font-medium text-[#D7E0E7] uppercase tracking-[0.10em] block">
            Hyperlocal Ward Heat City (Extruded Risk Landscape)
          </span>
          <span className="text-[11px] font-mono text-[#5F7183] block">
            Height + Color = Normative Human Thermal Stress Index
          </span>
        </div>

        {/* Legend Top-Right */}
        <div className="flex items-center gap-2 bg-[#142630]/80 backdrop-blur-md px-3 py-1.5 rounded-[8px] border border-white/8 text-[11px] font-mono">
          <span className="text-[#8B9AA8]">Risk:</span>
          <span className="flex items-center gap-1 text-[#2FA37C]">
            <span className="w-2 h-2 rounded-full bg-[#2FA37C]" /> Low
          </span>
          <span className="flex items-center gap-1 text-[#E8C547]">
            <span className="w-2 h-2 rounded-full bg-[#E8C547]" /> Mod
          </span>
          <span className="flex items-center gap-1 text-[#FF704F]">
            <span className="w-2 h-2 rounded-full bg-[#FF704F]" /> High
          </span>
          <span className="flex items-center gap-1 text-[#C31D3C]">
            <span className="w-2 h-2 rounded-full bg-[#C31D3C]" /> Ext
          </span>
        </div>
      </div>

      {/* Tooltip on Hover */}
      {hoveredWard && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3.5 py-2 rounded-[8px] bg-[#0B141B]/95 backdrop-blur-md border border-white/16 shadow-2xl text-xs font-mono space-y-1 transition-transform duration-75"
          style={{
            left: `${Math.min(window.innerWidth - 220, tooltipPos.x + 16)}px`,
            top: `${Math.max(10, tooltipPos.y - 48)}px`,
          }}
        >
          <div className="font-bold text-white flex items-center justify-between gap-4">
            <span>{hoveredWard.name}</span>
            <span style={{ color: heatColor(hoveredWard.risk) }}>
              HTSI {Math.round(hoveredWard.risk > 1 ? hoveredWard.risk : hoveredWard.risk * 100)}
            </span>
          </div>
          <div className="text-[10px] text-[#8B9AA8] flex items-center gap-3">
            <span>WBGT: {hoveredWard.wbgt || 33.5}°C</span>
            <span>Pop: {hoveredWard.population ? `${(hoveredWard.population / 1000).toFixed(0)}k` : 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Caption Bottom-Left & Selected Ward Card Bottom-Right */}
      <div className="w-full p-4 flex flex-wrap items-end justify-between gap-4 z-10 pointer-events-none">
        <div className="text-[11px] font-mono text-[#5F7183] bg-[#0B141B]/80 px-3 py-1.5 rounded-[6px] border border-white/6">
          Left-drag to orbit • Scroll to zoom • Hover/click column to isolate ward
        </div>

        {activeWard && (
          <div className="pointer-events-auto bg-[#142630]/90 backdrop-blur-md border border-white/16 rounded-[10px] p-3 text-xs font-mono space-y-1 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-white">{activeWard.name}</span>
              <span
                className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{
                  backgroundColor: `${heatColor(activeWard.risk)}25`,
                  color: heatColor(activeWard.risk),
                }}
              >
                Score {Math.round(activeWard.risk > 1 ? activeWard.risk : activeWard.risk * 100)}
              </span>
            </div>
            <div className="text-[10px] text-[#8B9AA8]">
              Est. WBGT: {activeWard.wbgt}°C • Dry-Bulb: {activeWard.temp}°C
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
