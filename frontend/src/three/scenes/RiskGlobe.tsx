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
import { StaticGlobe, DEFAULT_CITIES, type StaticCityData } from '../fallbacks/StaticGlobe';

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
  height = 520,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState<CityRisk>(cities[0] || DEFAULT_CITIES[0]);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Check WebGL availability and prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isWebGLAvailable() || reducedMotion) {
      setUseFallback(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let heightPx = container.clientHeight || 520;
    const isMobile = window.innerWidth < 768;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101820, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    // Standard camera position as per spec: (0, 0.22, 4.75)
    camera.position.set(0, 0.22, 4.75);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // --- 2. Post-Processing (Bloom on Desktop only) ---
    let composer: EffectComposer | null = null;
    if (!isMobile) {
      const renderPass = new RenderPass(scene, camera);
      // Half resolution bloom pass for 60fps performance budget
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width / 2, heightPx / 2),
        0.68, // strength
        0.5,  // radius
        0.22  // threshold
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
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.target.set(0.65, 0, 0); // focus towards offset globe
    }

    // --- 4. Lights ---
    const ambientLight = new THREE.AmbientLight(0x8899bb, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 4, 3);
    scene.add(dirLight);

    // Amethyst rim light for atmospheric palette coherence
    const rimLight = new THREE.PointLight(new THREE.Color(THREE_TOKENS.accent), 2.2, 12);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // --- 5. Starfield Shell ---
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 7.0 + Math.random() * 9.0; // 7-16 shell
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x8899bb,
      size: 0.028,
      transparent: true,
      opacity: 0.65,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- 6. Globe Group (Offset Right for Hero Copy Legibility) ---
    const globeGroup = new THREE.Group();
    // Offset right: x ≈ 0.95 to 1.05 on desktop, centered on mobile
    globeGroup.position.x = isMobile ? 0 : 0.95;
    // Set initial Y-rotation facing India (lng ~78° -> ~3.35 rad)
    globeGroup.rotation.y = getFacingYRotation(78.5);
    scene.add(globeGroup);

    // Base Sphere
    const sphereSegments = isMobile ? 32 : 64;
    const sphereGeo = new THREE.SphereGeometry(1.0, sphereSegments, sphereSegments);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x14232e,
      roughness: 0.92,
      metalness: 0.15,
      emissive: 0x0a141c,
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // Dot-Grid Surface Points (sample every 6° lat/lng)
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
      opacity: 0.9,
    });
    const dotGrid = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(dotGrid);

    // Atmosphere Halo (Fresnel back-side shader at 1.12R)
    const atmosGeo = new THREE.SphereGeometry(1.12, 48, 48);
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

    // --- 7. Heat Columns for Cities ---
    const raycastTargets: { mesh: THREE.Mesh; city: CityRisk }[] = [];
    const upVector = new THREE.Vector3(0, 1, 0);

    cities.forEach((city) => {
      const basePos = latLngToVec3(city.lat, city.lng, 1.0);
      const normal = basePos.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, normal);

      // Height h = 0.10 + risk * 0.55
      const h = 0.10 + city.risk * 0.55;
      const colColor = new THREE.Color(heatColor(city.risk));

      const cityGroup = new THREE.Group();
      cityGroup.position.copy(basePos);
      cityGroup.quaternion.copy(quaternion);

      // Base footprint ring
      const baseDotGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.003, 8);
      const baseDotMat = new THREE.MeshBasicMaterial({ color: colColor });
      const baseDotMesh = new THREE.Mesh(baseDotGeo, baseDotMat);
      baseDotMesh.position.y = 0.001;
      cityGroup.add(baseDotMesh);

      // Extruded cylinder column
      const cylinderGeo = new THREE.CylinderGeometry(0.012, 0.012, h, 6, 1, true);
      cylinderGeo.translate(0, h / 2, 0); // translate so base sits on surface
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: colColor,
        transparent: true,
        opacity: 0.92,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cityGroup.add(cylinderMesh);

      // Glowing tip sphere
      const tipGeo = new THREE.SphereGeometry(0.021, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({ color: colColor });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.y = h;
      cityGroup.add(tipMesh);

      globeGroup.add(cityGroup);
      raycastTargets.push({ mesh: cylinderMesh, city });
    });

    // --- 8. Raycasting for Pointer Hover ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        raycastTargets.map((t) => t.mesh),
        false
      );

      if (intersects.length > 0) {
        const hit = raycastTargets.find((t) => t.mesh === intersects[0].object);
        if (hit) {
          setSelectedCity(hit.city);
          if (onCitySelect) onCitySelect(hit.city.name);
        }
      }
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // --- 9. Visibility & Resize Handlers ---
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
      width = container.clientWidth || 600;
      heightPx = container.clientHeight || 520;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
      if (composer) composer.setSize(width, heightPx);
    };
    window.addEventListener('resize', onResize);

    // --- 10. Animation Loop ---
    let rafId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Slow auto-rotation + gentle vertical bob
      globeGroup.rotation.y += 0.05 * dt;
      globeGroup.position.y = Math.sin(elapsed * 0.6) * 0.018;

      if (controls) {
        controls.update();
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // --- 11. Cleanup & WebGL Disposal ---
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
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
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#1F3445]/60 to-[#101820] flex flex-col items-center justify-between shadow-2xl"
      style={{ minHeight: height }}
      aria-hidden="true"
    >
      {/* Telemetry Header */}
      <div className="w-full flex items-center justify-between p-5 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF704F] animate-ping" />
          <span className="text-xs font-mono font-semibold text-[#D7E0E7] uppercase tracking-wider">
            Synoptic 3D Thermal Surveillance
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#8B9AA8] bg-[#101820]/70 px-2 py-1 rounded border border-white/5">
          MoES Synoptic Telemetry
        </div>
      </div>

      {/* Scrim Overlay Gradient: keeps left text legible if overlaying, transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#101820]/95 via-[#101820]/40 to-transparent pointer-events-none w-1/3 z-5" />

      {/* Selected City Telemetry Pill in Bottom Bar */}
      <div className="w-full p-4 z-10">
        <div className="bg-[#101820]/90 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-md"
              style={{
                backgroundColor: heatColor(selectedCity.risk),
                boxShadow: `0 0 10px ${heatColor(selectedCity.risk)}`,
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
              <span className="text-[#8B9AA8] text-[10px] block">THERMAL RISK</span>
              <strong style={{ color: heatColor(selectedCity.risk) }}>
                {(selectedCity.risk * 100).toFixed(1)} / 100
              </strong>
            </div>
            {selectedCity.temp && (
              <div>
                <span className="text-[#8B9AA8] text-[10px] block">AIR TEMP</span>
                <span className="text-white font-semibold">{selectedCity.temp}°C</span>
              </div>
            )}
            {selectedCity.wbgt && (
              <div>
                <span className="text-[#8B9AA8] text-[10px] block">EST. WBGT</span>
                <span className="text-[#FF704F] font-semibold">{selectedCity.wbgt}°C</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessibility DOM List for Screen Readers */}
      <div className="sr-only">
        <h2>Synoptic 3D Thermal Surveillance Data</h2>
        <ul>
          {cities.map((c) => (
            <li key={c.name}>
              {c.name}: Risk score {(c.risk * 100).toFixed(0)} out of 100, Temp {c.temp || 'N/A'}°C
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
