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
import { loadEarthTexture } from '../textures/earthTexture';

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

  // Synchronize selectedCity whenever real cities data arrives or updates
  useEffect(() => {
    if (cities && cities.length > 0) {
      // Find highest risk city among the real wards
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
    // Camera positioned closer to globe for wider Earth presence
    camera.position.set(0, 0.15, 2.38);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasContainer.appendChild(renderer.domElement);

    // --- 2. Post-Processing Bloom (Subtle Earth rim glow, NOT neon blowout) ---
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isMobile) {
      const renderPass = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width / 2, heightPx / 2),
        0.28, // subtle, refined bloom
        0.45,
        0.55  // higher threshold prevents blowout
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
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8eb, 1.4);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    // Earth atmospheric sky-blue rim light (replaces purple)
    const earthRimLight = new THREE.PointLight(0x38bdf8, 1.8, 12);
    earthRimLight.position.set(-3.5, 2.5, -3.5);
    scene.add(earthRimLight);

    // --- 5. Starfield ---
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 5.5 + Math.random() * 6.0;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.02,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- 6. Globe Group (Centered in dedicated viewport) ---
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, 0, 0);
    const initialFacingY = getFacingYRotation(78.5); // Orient toward India (78.5°E)
    globeGroup.rotation.y = initialFacingY;
    scene.add(globeGroup);

    // Base Earth Sphere with authentic texture map
    const sphereSegments = isMobile ? 36 : 64;
    const sphereGeo = new THREE.SphereGeometry(1.0, sphereSegments, sphereSegments);

    const earthTexture = loadEarthTexture((loadedTex) => {
      if (baseSphere && baseSphere.material) {
        (baseSphere.material as THREE.MeshStandardMaterial).map = loadedTex;
        (baseSphere.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    });

    const sphereMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.78,
      metalness: 0.12,
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // Earth Atmosphere Shell (1.06 radius - tight, authentic Rayleigh glow)
    const atmosGeo = new THREE.SphereGeometry(1.06, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // --- 7. City Heat Stress Pillars ---
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
        opacity: 0.88,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cityGroup.add(cylinderMesh);

      // Glowing tip sphere
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

    // --- 8. Dynamic Pulse Ring over highest-risk centroid ---
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

    // --- 9. Raycasting & Hover Interaction ---
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

    // --- 10. Visibility & Resize Handling ---
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvasContainer);

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

    // --- 11. Animation Loop ---
    let rafId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Slow, steady Earth rotation (0.04 rad/s)
      globeGroup.rotation.y = initialFacingY + elapsed * 0.04;

      // Pulse ring animation (expanding and fading over 3s cycle)
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
      {/* 3D WebGL Canvas Layer - absolute so it never inflates parent flex height */}
      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      />

      {/* Top Status Readout */}
      <div className="w-full flex items-center justify-between p-4 sm:p-5 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
          <span className="text-xs font-mono font-medium text-[#D7E0E7] uppercase tracking-[0.10em]">
            National Synoptic Thermal Field
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#38BDF8] bg-[#101820]/90 px-2.5 py-1 rounded-[6px] border border-white/10 backdrop-blur-sm">
          Live Synoptic Feed
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCity && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-[6px] bg-[#101820]/95 backdrop-blur-md border border-[#38BDF8]/40 shadow-xl text-xs font-mono"
          style={{
            left: `${Math.min(window.innerWidth - 220, tooltipPos.x - 20)}px`,
            top: `${Math.max(10, tooltipPos.y - 45)}px`,
          }}
        >
          <div className="font-bold text-white flex items-center gap-2">
            <span>{hoveredCity.name}</span>
            <span style={{ color: heatColor(hoveredCity.risk) }}>
              {(hoveredCity.risk * 100).toFixed(0)} / 100
            </span>
          </div>
          <div className="text-[10px] text-[#8B9AA8]">
            WBGT {hoveredCity.wbgt || 26.4}°C • Temp {hoveredCity.temp || 28.3}°C
          </div>
        </div>
      )}

      {/* Bottom Telemetry Card for Selected City */}
      <div className="w-full p-4 sm:p-5 z-10 pointer-events-auto">
        <div className="bg-[#101820]/90 border border-white/10 rounded-[10px] p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full shrink-0 animate-pulse"
              style={{
                backgroundColor: heatColor(selectedCity.risk),
              }}
            />
            <div>
              <span className="font-semibold text-white tracking-wide">{selectedCity.name}</span>
              <span className="text-[10px] text-[#8B9AA8] font-mono ml-2">
                {selectedCity.lat.toFixed(2)}°N, {selectedCity.lng.toFixed(2)}°E
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-[#8B9AA8] text-[10px] uppercase block">Thermal Risk</span>
              <strong style={{ color: heatColor(selectedCity.risk) }}>
                {(selectedCity.risk * 100).toFixed(1)} / 100
              </strong>
            </div>
            {selectedCity.temp !== undefined && (
              <div>
                <span className="text-[#8B9AA8] text-[10px] uppercase block">Dry-Bulb</span>
                <span className="text-white font-semibold">{selectedCity.temp}°C</span>
              </div>
            )}
            {selectedCity.wbgt !== undefined && (
              <div>
                <span className="text-[#8B9AA8] text-[10px] uppercase block">ISO WBGT</span>
                <span className="text-[#FF704F] font-semibold">{selectedCity.wbgt}°C</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
