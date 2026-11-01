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
  gridSize?: number; // e.g. 14 for 14x14 = 196 wards
  onWardSelect?: (wardId: number | string) => void;
  height?: number | string;
}

export const WardHeatCity: React.FC<WardHeatCityProps> = ({
  wards,
  gridSize = 14,
  onWardSelect,
  height = 540,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredWard, setHoveredWard] = useState<WardColumnData | null>(null);
  const [activeWard, setActiveWard] = useState<WardColumnData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Generate N x N wards if not provided
  const cityWards = React.useMemo(() => {
    if (wards && wards.length > 0) return wards;

    const items: WardColumnData[] = [];
    const wardPrefixes = ['M/East', 'A/Colaba', 'F/North', 'G/South', 'H/West', 'K/East', 'L/Kurla', 'P/North', 'R/Central', 'N/Ghatkopar', 'S/Bhandup', 'T/Mulund', 'C/Marine', 'D/Malabar'];
    const count = gridSize * gridSize;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      // Synthesize realistic spatial clustering (hot central/eastern wards)
      const distFromCenter = Math.sqrt(Math.pow(row - gridSize / 2, 2) + Math.pow(col - gridSize / 2, 2));
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
    scene.background = new THREE.Color(0x0b1219);
    // Fog: scene.fog = new THREE.Fog(0x0B1219, 9, 20) per specification
    scene.fog = new THREE.Fog(0x0b1219, 9, 22);

    // --- 2. Camera ---
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    // Orbit camera on radius ~8.6 at height 6.2 looking at center (0, 1.1, 0)
    camera.position.set(6.8, 6.2, 5.2);
    camera.lookAt(0, 1.1, 0);

    // --- 3. WebGL Renderer ---
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
        0.6, // bloom strength
        0.7, // radius
        0.2  // threshold
      );
      composer = new EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
    }

    // --- 5. Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below ground
    controls.minDistance = 4.0;
    controls.maxDistance = 18.0;
    controls.target.set(0, 1.1, 0);

    // --- 6. Lighting (Key, Ambient, and Amethyst Rim Light) ---
    const ambientLight = new THREE.AmbientLight(0x8899bb, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(6, 9, 5);
    scene.add(keyLight);

    // Rim point light in amethyst #9B6FD8 from (-7, 4, -6)
    const amethystRim = new THREE.PointLight(new THREE.Color(THREE_TOKENS.accent), 2.5, 20);
    amethystRim.position.set(-7, 4, -6);
    scene.add(amethystRim);

    // Secondary fill light
    const fillLight = new THREE.PointLight(0x3c566a, 0.8, 15);
    fillLight.position.set(0, 8, 0);
    scene.add(fillLight);

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
      roughness: 0.55,
      metalness: 0.25,
    });

    const instancedMesh = new THREE.InstancedMesh(boxGeo, boxMat, totalCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const halfGrid = (gridSize - 1) / 2;
    const defaultHeights = new Float32Array(totalCount);
    const currentLifts = new Float32Array(totalCount);
    const targetLifts = new Float32Array(totalCount);

    for (let i = 0; i < totalCount; i++) {
      const ward = cityWards[i];
      const normRisk = ward.risk > 1.0 ? ward.risk / 100 : ward.risk;
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      const cx = (col - halfGrid) * spacing;
      const cz = (row - halfGrid) * spacing;

      // Height formula: h = 0.18 + risk * 3.1
      const h = 0.18 + normRisk * 3.1;
      defaultHeights[i] = h;

      dummy.position.set(cx, 0, cz);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
      instancedMesh.setColorAt(i, new THREE.Color(heatColor(normRisk)));
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
    let selectedInstanceId = -1;

    const updateMouse = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handlePointerMove = (e: MouseEvent) => {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const intersection = raycaster.intersectObject(instancedMesh);

      if (intersection.length > 0 && intersection[0].instanceId !== undefined) {
        const id = intersection[0].instanceId;
        if (id !== hoveredInstanceId) {
          hoveredInstanceId = id;
          const ward = cityWards[id];
          setHoveredWard(ward);
        }
      } else {
        hoveredInstanceId = -1;
        setHoveredWard(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const intersection = raycaster.intersectObject(instancedMesh);

      if (intersection.length > 0 && intersection[0].instanceId !== undefined) {
        const id = intersection[0].instanceId;
        selectedInstanceId = id;
        const ward = cityWards[id];
        setActiveWard(ward);
        if (onWardSelect) onWardSelect(ward.id);

        // Spring lift: set target lift +0.6 for clicked column
        for (let j = 0; j < totalCount; j++) {
          targetLifts[j] = j === id ? 0.6 : 0.0;
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // --- 10. Visibility & Resize Handlers ---
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
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

    // --- 11. Render Loop with Smooth Spring Lifting ---
    let rafId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const dt = clock.getDelta();
      controls.update();

      // Smoothly damp instance lifts (+0.6 on select)
      let matricesDirty = false;
      for (let i = 0; i < totalCount; i++) {
        const diff = targetLifts[i] - currentLifts[i];
        if (Math.abs(diff) > 0.002) {
          currentLifts[i] += diff * Math.min(1.0, dt * 10.0);
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          const cx = (col - halfGrid) * spacing;
          const cz = (row - halfGrid) * spacing;
          const baseH = defaultHeights[i];
          const totalH = baseH + currentLifts[i];

          dummy.position.set(cx, currentLifts[i] * 0.4, cz);
          dummy.scale.set(1, totalH, 1);
          dummy.updateMatrix();

          instancedMesh.setMatrixAt(i, dummy.matrix);
          matricesDirty = true;
        }
      }

      if (matricesDirty) {
        instancedMesh.instanceMatrix.needsUpdate = true;
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // --- 12. Cleanup & Disposal ---
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

  const activeOrHovered = hoveredWard || activeWard;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0B1219] shadow-2xl"
      style={{ minHeight: height }}
    >
      {/* City Stage Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 pointer-events-none">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9B6FD8] animate-pulse" />
            <h3 className="text-sm font-semibold text-white tracking-wide font-display">
              Ward Heat City — Hyperlocal Extruded Surface
            </h3>
          </div>
          <p className="text-[11px] text-[#8B9AA8] font-mono mt-0.5">
            Height + Chroma = Human Thermal Strain Index (Instanced GPU Mesh)
          </p>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#D7E0E7]">
            {cityWards.length} Wards Active
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#9B6FD8]/20 border border-[#9B6FD8]/40 text-[#9B6FD8]">
            Amethyst Rim Light Active
          </span>
        </div>
      </div>

      {/* Floating Hover / Click Tooltip */}
      {hoveredWard && tooltipPos && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="bg-[#101820]/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[180px] text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-white tracking-tight">{hoveredWard.name}</span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: heatColor(hoveredWard.risk) }}
              />
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#8B9AA8]">Risk Score:</span>
                <span className="font-bold" style={{ color: heatColor(hoveredWard.risk) }}>
                  {(hoveredWard.risk * 100).toFixed(1)} / 100
                </span>
              </div>
              {hoveredWard.wbgt && (
                <div className="flex justify-between">
                  <span className="text-[#8B9AA8]">Est. WBGT:</span>
                  <span className="text-[#FF704F] font-semibold">{hoveredWard.wbgt}°C</span>
                </div>
              )}
              {hoveredWard.population && (
                <div className="flex justify-between">
                  <span className="text-[#8B9AA8]">Population:</span>
                  <span className="text-white">{hoveredWard.population.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] text-[#8B9AA8] italic">
              Click to lift column and pin details
            </div>
          </div>
        </div>
      )}

      {/* Persistent Selected Ward Footer Strip */}
      {activeOrHovered && (
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <div className="bg-[#1F3445]/90 border border-white/15 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md pointer-events-auto">
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-3.5 rounded-md"
                style={{ backgroundColor: heatColor(activeOrHovered.risk) }}
              />
              <div>
                <span className="font-bold text-white text-sm">{activeOrHovered.name}</span>
                <span className="text-[11px] text-[#8B9AA8] ml-2 font-mono">
                  NDMA Risk Band:{' '}
                  <strong style={{ color: heatColor(activeOrHovered.risk) }}>
                    {activeOrHovered.risk >= 0.85
                      ? 'EXTREME'
                      : activeOrHovered.risk >= 0.70
                      ? 'VERY HIGH'
                      : activeOrHovered.risk >= 0.50
                      ? 'HIGH'
                      : activeOrHovered.risk >= 0.25
                      ? 'MODERATE'
                      : 'SAFE'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <span>Risk: <strong style={{ color: heatColor(activeOrHovered.risk) }}>{(activeOrHovered.risk * 100).toFixed(1)}</strong></span>
              {activeOrHovered.wbgt && <span>WBGT: <strong className="text-[#FF704F]">{activeOrHovered.wbgt}°C</strong></span>}
              {activeOrHovered.temp && <span>T: <strong>{activeOrHovered.temp}°C</strong></span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
