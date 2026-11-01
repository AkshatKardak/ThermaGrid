import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { THREE_TOKENS } from '../tokens';
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
  height = 560,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState<CityRisk>(cities[0] || DEFAULT_CITIES[0]);
  const [hoveredCity, setHoveredCity] = useState<CityRisk | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isWebGLAvailable() || reducedMotion) {
      setUseFallback(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let heightPx = container.clientHeight || 560;
    const isMobile = window.innerWidth < 768;

    // --- 1. Scene & Camera ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101820, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    // Start camera z at 6.5 (dollies to 4.75 during entrance)
    camera.position.set(0, 0.22, 6.5);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- 2. Post-Processing Bloom ---
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isMobile) {
      const renderPass = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width / 2, heightPx / 2),
        0.0, // starts at 0, ramps to 0.68
        0.5,
        0.22
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
      controls.target.set(0.65, 0, 0);
    }

    // --- 4. Lights ---
    const ambientLight = new THREE.AmbientLight(0x8899bb, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(5, 4, 3);
    scene.add(dirLight);

    // Amethyst rim light for atmospheric coherence
    const rimLight = new THREE.PointLight(new THREE.Color(THREE_TOKENS.accent), 2.4, 14);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // --- 5. Starfield 900 Points ---
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 7.0 + Math.random() * 9.0;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x8899bb,
      size: 0.026,
      transparent: true,
      opacity: 0.0, // fades in during entrance
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- 6. Globe Group ---
    const globeGroup = new THREE.Group();
    globeGroup.position.x = isMobile ? 0 : 0.95;
    const initialFacingY = getFacingYRotation(78.5);
    globeGroup.rotation.y = initialFacingY;
    globeGroup.scale.set(0.86, 0.86, 0.86); // scales to 1.0 during entrance
    scene.add(globeGroup);

    // Base Sphere
    const sphereSegments = isMobile ? 32 : 64;
    const sphereGeo = new THREE.SphereGeometry(1.0, sphereSegments, sphereSegments);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x14232e,
      roughness: 0.92,
      metalness: 0.15,
      emissive: 0x0a141c,
      transparent: true,
      opacity: 0.0,
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // Dot-Grid Surface Points (every 6° lat/lng)
    const dotPositions: number[] = [];
    for (let lat = -90; lat <= 90; lat += 6) {
      for (let lng = -180; lng <= 180; lng += 6) {
        const v = latLngToVec3(lat, lng, 1.002);
        dotPositions.push(v.x, v.y, v.z);
      }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x3c566a,
      size: 0.011,
      transparent: true,
      opacity: 0.0,
    });
    const dotGrid = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(dotGrid);

    // Atmosphere Shell (1.12 radius)
    const atmosGeo = new THREE.SphereGeometry(1.12, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.0,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // --- 7. City Heat Columns (Ordered by Lng for Entrance Wave) ---
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
      lngIndex: number;
      origColor: THREE.Color;
    }[] = [];

    // Find highest risk city for expanding 4s periodic pulse ring
    let highestRiskCity = sortedCities[0];
    for (const c of sortedCities) {
      if (c.risk > highestRiskCity.risk) highestRiskCity = c;
    }

    sortedCities.forEach((city, idx) => {
      const basePos = latLngToVec3(city.lat, city.lng, 1.0);
      const normal = basePos.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, normal);

      const h = 0.10 + city.risk * 0.55;
      const colColor = new THREE.Color(heatColor(city.risk));

      const cityGroup = new THREE.Group();
      cityGroup.position.copy(basePos);
      cityGroup.quaternion.copy(quaternion);
      cityGroup.scale.set(1, 0.001, 1); // starts flat for longitudinal entrance wave

      const baseDotGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.003, 8);
      const baseDotMat = new THREE.MeshBasicMaterial({ color: colColor });
      const baseDotMesh = new THREE.Mesh(baseDotGeo, baseDotMat);
      baseDotMesh.position.y = 0.001;
      cityGroup.add(baseDotMesh);

      const cylinderGeo = new THREE.CylinderGeometry(0.012, 0.012, h, 6, 1, true);
      cylinderGeo.translate(0, h / 2, 0);
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: colColor.clone(),
        transparent: true,
        opacity: 0.92,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cityGroup.add(cylinderMesh);

      const tipGeo = new THREE.SphereGeometry(0.021, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({ color: colColor.clone() });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.y = h;
      cityGroup.add(tipMesh);

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
        lngIndex: idx,
        origColor: colColor,
      });
    });

    // --- 8. Periodic Ring Pulse Mesh for Highest-Risk City ---
    const highestRiskBasePos = latLngToVec3(highestRiskCity.lat, highestRiskCity.lng, 1.003);
    const highestRiskNormal = highestRiskBasePos.clone().normalize();
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(heatColor(highestRiskCity.risk)),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.position.copy(highestRiskBasePos);
    pulseRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), highestRiskNormal);
    globeGroup.add(pulseRing);

    // --- 9. Raycasting & Hover ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHovered: typeof columnObjects[0] | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(
        columnObjects.flatMap((c) => [c.cylinderMesh, c.tipMesh]),
        false
      );

      if (hits.length > 0) {
        const hitObj = columnObjects.find(
          (c) => c.cylinderMesh === hits[0].object || c.tipMesh === hits[0].object
        );
        if (hitObj && hitObj !== currentHovered) {
          // Revert previous hovered
          if (currentHovered) {
            (currentHovered.cylinderMesh.material as THREE.MeshBasicMaterial).color.copy(
              currentHovered.origColor
            );
            (currentHovered.tipMesh.material as THREE.MeshBasicMaterial).color.copy(
              currentHovered.origColor
            );
          }
          currentHovered = hitObj;
          renderer.domElement.style.cursor = 'pointer';

          // Brighten column to 120%
          const brightened = hitObj.origColor.clone().multiplyScalar(1.25);
          (hitObj.cylinderMesh.material as THREE.MeshBasicMaterial).color.copy(brightened);
          (hitObj.tipMesh.material as THREE.MeshBasicMaterial).color.copy(brightened);

          setHoveredCity(hitObj.city);
          setSelectedCity(hitObj.city);
          if (onCitySelect) onCitySelect(hitObj.city.name);
        }
      } else {
        if (currentHovered) {
          (currentHovered.cylinderMesh.material as THREE.MeshBasicMaterial).color.copy(
            currentHovered.origColor
          );
          (currentHovered.tipMesh.material as THREE.MeshBasicMaterial).color.copy(
            currentHovered.origColor
          );
          currentHovered = null;
          renderer.domElement.style.cursor = 'default';
          setHoveredCity(null);
        }
      }
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // --- 10. Scroll Linkage (0 -> 0.8 rad offset) ---
    let scrollOffset = 0;
    const onScroll = () => {
      const heroHeight = container.clientHeight || 600;
      const progress = Math.min(1.0, Math.max(0, window.scrollY / heroHeight));
      scrollOffset = progress * 0.8;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // --- 11. Visibility & Resize ---
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
      width = container.clientWidth || 600;
      heightPx = container.clientHeight || 560;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
      if (composer) composer.setSize(width, heightPx);
    };
    window.addEventListener('resize', onResize);

    // --- 12. Main Animation Timeline Loop ---
    let rafId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime(); // seconds
      const elapsedMs = elapsed * 1000;

      // === ENTRANCE CHOREOGRAPHY (0 -> 1800ms) ===
      if (elapsedMs < 1900) {
        // Camera dolly z: 6.5 -> 4.75 over 0-900ms (ease-out cubic)
        const camProgress = Math.min(1.0, elapsedMs / 900);
        const camEase = 1 - Math.pow(1 - camProgress, 3);
        camera.position.z = 6.5 - camEase * (6.5 - 4.75);

        // Globe scale: 0.86 -> 1.0, opacity: 0 -> 1.0
        const scaleProgress = Math.min(1.0, elapsedMs / 900);
        const scaleEase = 1 - Math.pow(1 - scaleProgress, 3);
        const currentScale = 0.86 + scaleEase * 0.14;
        globeGroup.scale.set(currentScale, currentScale, currentScale);

        sphereMat.opacity = scaleEase;
        dotMat.opacity = scaleEase * 0.9;

        // Bloom ramp: 0 -> 0.68
        if (bloomPass) {
          bloomPass.strength = scaleEase * 0.68;
        }

        // Longitudinal wave: 600-1800ms, staggered by 18ms per city
        columnObjects.forEach((col) => {
          const startTime = 600 + col.lngIndex * 18;
          if (elapsedMs > startTime) {
            const colProg = Math.min(1.0, (elapsedMs - startTime) / 450);
            const colEase = 1 - Math.pow(1 - colProg, 3);
            col.group.scale.set(1, Math.max(0.01, colEase), 1);
          }
        });

        // Atmosphere & starfield fade in: 1200-1800ms
        if (elapsedMs > 1200) {
          const fadeProg = Math.min(1.0, (elapsedMs - 1200) / 600);
          starMat.opacity = fadeProg * 0.65;
          atmosMat.opacity = fadeProg;
        }
      } else {
        // Fully settled entrance
        camera.position.z = 4.75;
        globeGroup.scale.set(1, 1, 1);
        sphereMat.opacity = 1.0;
        dotMat.opacity = 0.9;
        starMat.opacity = 0.65;
        if (bloomPass) bloomPass.strength = 0.68;
        columnObjects.forEach((col) => col.group.scale.set(1, 1, 1));
      }

      // === IDLE ANIMATION ===
      // Rotation: 0.05 rad/s + scroll linkage offset
      const baseRotation = initialFacingY + elapsed * 0.05 + scrollOffset;
      globeGroup.rotation.y = baseRotation;

      // Group vertical bob ±0.018 at 0.6 Hz
      globeGroup.position.y = Math.sin(elapsed * 0.6 * Math.PI * 2) * 0.018;

      // Atmosphere breathing ±5% at 0.25 Hz
      if (elapsedMs >= 1800) {
        const breathe = 1.0 + Math.sin(elapsed * 0.25 * Math.PI * 2) * 0.05;
        atmosMesh.scale.set(breathe, breathe, breathe);
      }

      // Periodic Expanding Ring Pulse every 4 seconds (1400ms duration)
      const ringCycle = elapsed % 4.0;
      if (ringCycle < 1.4) {
        const ringProg = ringCycle / 1.4;
        const ringScale = 1.0 + ringProg * 0.8; // 1 -> 1.8
        pulseRing.scale.set(ringScale, ringScale, ringScale);
        ringMat.opacity = Math.max(0, 0.9 * (1.0 - ringProg));
      } else {
        ringMat.opacity = 0;
      }

      if (controls) controls.update();

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // --- 13. Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);

      if (controls) controls.dispose();
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
  }, [cities, interactive, onCitySelect]);

  if (useFallback) {
    return (
      <StaticGlobe
        cities={cities}
        onCitySelect={(name) => {
          const c = cities.find((item) => item.name === name);
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
      className="relative w-full rounded-[14px] overflow-hidden border border-white/8 bg-gradient-to-b from-[#1F3445]/40 to-[#101820] flex flex-col items-center justify-between shadow-2xl"
      style={{ minHeight: height }}
      aria-hidden="true"
    >
      {/* Telemetry Header */}
      <div className="w-full flex items-center justify-between p-5 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#9B6FD8] animate-ping" />
          <span className="text-xs font-mono font-medium text-[#D7E0E7] uppercase tracking-[0.10em]">
            National Synoptic Thermal Field
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#8B9AA8] bg-[#101820]/80 px-2.5 py-1 rounded-[6px] border border-white/6">
          MoES Synoptic Telemetry
        </div>
      </div>

      {/* Left Scrim Overlay: keeps headline readable when globe is wide */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#101820]/95 via-[#101820]/50 to-transparent pointer-events-none w-1/3 z-5" />

      {/* Hover Tooltip (HTML overlay via direct positioning) */}
      {hoveredCity && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-[6px] bg-[#101820]/95 backdrop-blur-md border border-white/16 shadow-xl text-xs font-mono transition-transform duration-75"
          style={{
            left: `${Math.min(window.innerWidth - 200, tooltipPos.x + 12)}px`,
            top: `${Math.max(10, tooltipPos.y - 36)}px`,
          }}
        >
          <div className="font-bold text-white flex items-center gap-2">
            <span>{hoveredCity.name}</span>
            <span style={{ color: heatColor(hoveredCity.risk) }}>
              HTSI {(hoveredCity.risk * 100).toFixed(0)}
            </span>
          </div>
          <div className="text-[10px] text-[#8B9AA8]">
            WBGT {hoveredCity.wbgt || 34.2}°C • Temp {hoveredCity.temp || 38.5}°C
          </div>
        </div>
      )}

      {/* Selected City Telemetry Bar */}
      <div className="w-full p-4 z-10">
        <div className="bg-[#101820]/90 border border-white/8 rounded-[10px] p-3 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: heatColor(selectedCity.risk),
              }}
            />
            <div>
              <span className="font-semibold text-[#D7E0E7] tracking-wide">{selectedCity.name}</span>
              <span className="text-[10px] text-[#5F7183] font-mono ml-2">
                {selectedCity.lat.toFixed(2)}°N, {selectedCity.lng.toFixed(2)}°E
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-[#5F7183] text-[10px] uppercase block">Thermal Stress</span>
              <strong style={{ color: heatColor(selectedCity.risk) }}>
                {(selectedCity.risk * 100).toFixed(1)} / 100
              </strong>
            </div>
            {selectedCity.temp && (
              <div>
                <span className="text-[#5F7183] text-[10px] uppercase block">Dry-Bulb</span>
                <span className="text-[#D7E0E7] font-semibold">{selectedCity.temp}°C</span>
              </div>
            )}
            {selectedCity.wbgt && (
              <div>
                <span className="text-[#5F7183] text-[10px] uppercase block">ISO WBGT</span>
                <span className="text-[#FF704F] font-semibold">{selectedCity.wbgt}°C</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
