import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { heatColor } from '../heat';
import { latLngToVec3, getFacingYRotation } from '../geo';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders/atmosphere.glsl';
import { isWebGLAvailable, disposeThreeHierarchy } from '../useRenderLoop';
import { StaticGlobe, DEFAULT_CITIES } from '../fallbacks/StaticGlobe';

export interface CityRisk {
  name: string;
  lat: number;
  lng: number;
  risk: number; // 0.0 – 1.0
  temp?: number;
  wbgt?: number;
}

interface RiskGlobeProps {
  cities?: CityRisk[];
  onCitySelect?: (cityName: string) => void;
  height?: number | string;
  interactive?: boolean;
}

export const RiskGlobe: React.FC<RiskGlobeProps> = ({
  cities = DEFAULT_CITIES,
  onCitySelect,
  height = '100%',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState<CityRisk>(cities[0] || DEFAULT_CITIES[0]);
  const [hoveredCity, setHoveredCity] = useState<CityRisk | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (cities && cities.length > 0) {
      const highest = [...cities].sort((a, b) => b.risk - a.risk)[0];
      setSelectedCity(highest);
    }
  }, [cities]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isWebGLAvailable() || reducedMotion) {
      setUseFallback(true);
      return;
    }

    const canvasContainer = canvasRef.current;
    if (!canvasContainer) return;

    let width = canvasContainer.clientWidth || 550;
    let heightPx = canvasContainer.clientHeight || 500;
    const isMobile = window.innerWidth < 768;

    // --- 1. Scene & Camera ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.15, 2.38);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    canvasContainer.appendChild(renderer.domElement);

    // --- 2. Post-Processing Bloom (Reduced to 0.18, captures only heat columns) ---
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isMobile) {
      const renderPass = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width / 2, heightPx / 2),
        0.18, // bloom <= 0.18 strictly
        0.3,
        0.75  // threshold captures only heat column tips
      );
      composer = new EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
    }

    // --- 3. Controls ---
    let controls: OrbitControls | null = null;
    if (interactive && !isMobile) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false;
      controls.target.set(0, 0, 0);
    }

    // --- 4. Lights ---
    const ambientLight = new THREE.AmbientLight(0xd7e0e7, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 3, 4);
    scene.add(dirLight);

    // --- 5. Globe Group (Oriented toward India) ---
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, 0, 0);
    const initialFacingY = getFacingYRotation(78.5); // India centroid (78.5°E)
    globeGroup.rotation.y = initialFacingY;
    scene.add(globeGroup);

    // Flat dark #141C24 diagram sphere (no photoreal texture, no stars)
    const sphereSegments = isMobile ? 32 : 48;
    const sphereGeo = new THREE.SphereGeometry(1.0, sphereSegments, sphereSegments);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x141C24,
      wireframe: false,
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // Subtle #22303C graticule at 12% opacity
    const graticuleGeo = new THREE.SphereGeometry(1.002, 24, 24);
    const graticuleMat = new THREE.MeshBasicMaterial({
      color: 0x22303C,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const graticuleMesh = new THREE.Mesh(graticuleGeo, graticuleMat);
    globeGroup.add(graticuleMesh);

    // Thin subtle fresnel rim
    const rimGeo = new THREE.SphereGeometry(1.04, 36, 36);
    const rimMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    globeGroup.add(rimMesh);

    // --- 6. City Heat Stress Pillars ---
    const sortedCities = [...cities].sort((a, b) => a.lng - b.lng);
    const upVector = new THREE.Vector3(0, 1, 0);
    const columnObjects: {
      group: THREE.Group;
      cylinderMesh: THREE.Mesh;
      tipMesh: THREE.Mesh;
      baseDotMesh: THREE.Mesh;
      city: CityRisk;
      normal: THREE.Vector3;
      basePos: THREE.Vector3;
      h: number;
    }[] = [];

    let highestRiskCity = sortedCities[0];
    for (const c of sortedCities) {
      if (c.risk > highestRiskCity.risk) highestRiskCity = c;
    }

    sortedCities.forEach((city) => {
      const basePos = latLngToVec3(city.lat, city.lng, 1.0);
      const normal = basePos.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, normal);

      const h = 0.08 + city.risk * 0.42;
      const colColor = new THREE.Color(heatColor(city.risk));

      const cityGroup = new THREE.Group();
      cityGroup.position.copy(basePos);
      cityGroup.quaternion.copy(quaternion);

      // Base footprint dot
      const baseDotGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.003, 8);
      const baseDotMat = new THREE.MeshBasicMaterial({ color: colColor });
      const baseDotMesh = new THREE.Mesh(baseDotGeo, baseDotMat);
      baseDotMesh.position.y = 0.001;
      cityGroup.add(baseDotMesh);

      // Vertical heat pillar
      const cylinderGeo = new THREE.CylinderGeometry(0.010, 0.010, h, 6, 1, true);
      cylinderGeo.translate(0, h / 2, 0);
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: colColor.clone(),
        transparent: true,
        opacity: 0.90,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cityGroup.add(cylinderMesh);

      // Tip sphere
      const tipGeo = new THREE.SphereGeometry(0.014, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.y = h;
      cityGroup.add(tipMesh);

      cityGroup.userData = { city, cylinderMesh, tipMesh, colColor, h };
      globeGroup.add(cityGroup);

      columnObjects.push({
        group: cityGroup,
        cylinderMesh,
        tipMesh,
        baseDotMesh,
        city,
        normal,
        basePos,
        h,
      });
    });

    // --- 7. Pulse Ring over highest-risk centroid ---
    const ringGeo = new THREE.RingGeometry(0.018, 0.024, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(heatColor(highestRiskCity.risk)),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    const highestPos = latLngToVec3(highestRiskCity.lat, highestRiskCity.lng, 1.002);
    const highestNormal = highestPos.clone().normalize();
    pulseRing.position.copy(highestPos);
    pulseRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), highestNormal);
    globeGroup.add(pulseRing);

    // --- 8. Raycasting & Interaction ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(
        columnObjects.map((c) => c.cylinderMesh),
        false
      );

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const parent = hitMesh.parent;
        if (parent && parent.userData.city) {
          const hitCity: CityRisk = parent.userData.city;
          setHoveredCity(hitCity);
          setTooltipPos({ x: e.clientX, y: e.clientY });
          setSelectedCity(hitCity);
          if (onCitySelect) onCitySelect(hitCity.name);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        setHoveredCity(null);
        renderer.domElement.style.cursor = 'default';
      }
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // --- 9. Visibility & Resize ---
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvasContainer);

    const onVisibilityChange = () => {
      // Pause loop immediately when tab is hidden
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      if (!canvasContainer) return;
      width = canvasContainer.clientWidth || 550;
      heightPx = canvasContainer.clientHeight || 500;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
      if (composer) composer.setSize(width, heightPx);
    };
    window.addEventListener('resize', onResize);

    // --- 10. Animation Loop ---
    let rafId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const elapsed = clock.getElapsedTime();

      // Steady diagram rotation (0.02 rad/s)
      globeGroup.rotation.y = initialFacingY + elapsed * 0.02;

      // Pulse ring animation
      const pulseCycle = (elapsed % 3.0) / 3.0;
      const ringScale = 1.0 + pulseCycle * 3.5;
      pulseRing.scale.set(ringScale, ringScale, 1.0);
      ringMat.opacity = Math.max(0, 1.0 - pulseCycle);

      if (controls) controls.update();

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      if (controls) controls.dispose();
      disposeThreeHierarchy(scene);
      renderer.dispose();
      if (composer) composer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [cities, onCitySelect, height, interactive]);

  if (useFallback) {
    return (
      <StaticGlobe
        cities={cities}
        onCitySelect={(name) => {
          const c = cities.find((x) => x.name === name);
          if (c) setSelectedCity(c);
          if (onCitySelect) onCitySelect(name);
        }}
        height={height}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] lg:min-h-[500px] flex flex-col justify-between overflow-hidden rounded-[14px]"
      style={{ height }}
    >
      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      />

      {/* Top Status Readout */}
      <div className="w-full flex items-center justify-between p-4 sm:p-5 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-mono font-medium text-raised uppercase tracking-[0.10em]">
            National Synoptic Thermal Field
          </span>
        </div>
        <div className="text-[11px] font-mono text-raised/70 bg-panel-dark px-2.5 py-1 rounded-[6px] border border-border">
          Live Synoptic Feed
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCity && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-[6px] bg-panel-dark border border-border text-xs font-mono text-raised"
          style={{
            left: `${Math.min(window.innerWidth - 220, tooltipPos.x - 20)}px`,
            top: `${Math.max(10, tooltipPos.y - 45)}px`,
          }}
        >
          <div className="font-bold text-raised flex items-center gap-2">
            <span>{hoveredCity.name}</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: heatColor(hoveredCity.risk) }} />
              {(hoveredCity.risk * 100).toFixed(0)} / 100
            </span>
          </div>
          <div className="text-[10px] text-raised/70">
            WBGT {hoveredCity.wbgt || 26.4}°C • Temp {hoveredCity.temp || 28.3}°C
          </div>
        </div>
      )}

      {/* Bottom Telemetry Card for Selected City */}
      <div className="w-full p-4 sm:p-5 z-10 pointer-events-auto">
        <div className="bg-panel-dark border border-border rounded-[8px] p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-raised">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: heatColor(selectedCity.risk),
              }}
            />
            <div>
              <span className="font-semibold text-raised tracking-wide">{selectedCity.name}</span>
              <span className="text-[10px] text-raised/70 font-mono ml-2">
                {selectedCity.lat.toFixed(2)}°N, {selectedCity.lng.toFixed(2)}°E
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-raised/70 text-[10px] uppercase block">Thermal Risk</span>
              <strong className="text-raised inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: heatColor(selectedCity.risk) }} />
                {(selectedCity.risk * 100).toFixed(1)} / 100
              </strong>
            </div>
            {selectedCity.temp !== undefined && (
              <div>
                <span className="text-raised/70 text-[10px] uppercase block">Dry-Bulb</span>
                <span className="text-raised font-semibold">{selectedCity.temp}°C</span>
              </div>
            )}
            {selectedCity.wbgt !== undefined && (
              <div>
                <span className="text-raised/70 text-[10px] uppercase block">ISO WBGT</span>
                <span className="text-raised font-semibold">{selectedCity.wbgt}°C</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
