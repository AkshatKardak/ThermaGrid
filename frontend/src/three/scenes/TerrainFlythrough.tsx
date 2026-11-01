import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Compass, MapPin } from 'lucide-react';

import { THREE_TOKENS } from '../tokens';
import { heatFieldVertexShader, heatFieldFragmentShader } from '../shaders/heatField.glsl';
import { isWebGLAvailable, disposeThreeHierarchy } from '../useRenderLoop';

export interface Hotspot {
  id: string;
  name: string;
  position: [number, number, number];
  risk: number;
  description: string;
}

const DEFAULT_HOTSPOTS: Hotspot[] = [
  {
    id: 'h1',
    name: 'Govandi / M-East (Slum Density & Tin Roofs)',
    position: [-3.2, 0.4, 2.5],
    risk: 0.88,
    description: 'Acute Urban Heat Island with severe lack of tree canopy and packed tin-sheet housing.',
  },
  {
    id: 'h2',
    name: 'Kurla West (Industrial Core & Heavy Transit)',
    position: [0.0, 0.55, -0.5],
    risk: 0.82,
    description: 'High anthropogenic heat discharge from manufacturing, rail corridors, and asphalt radiation.',
  },
  {
    id: 'h3',
    name: 'Colaba / Coastal Zone A (Maritime Regulated)',
    position: [3.4, 0.25, -2.8],
    risk: 0.42,
    description: 'Marine sea-breeze microclimate with higher humidity but continuous wind ventilation.',
  },
];

interface TerrainFlythroughProps {
  hotspots?: Hotspot[];
  height?: number | string;
}

export const TerrainFlythrough: React.FC<TerrainFlythroughProps> = ({
  hotspots = DEFAULT_HOTSPOTS,
  height = 540,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(hotspots[0]);
  const [flythroughProgress, setFlythroughProgress] = useState(0);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const cameraPathRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const lookPathRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!isWebGLAvailable()) return;

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let heightPx = container.clientHeight || 540;
    const isMobile = window.innerWidth < 768;

    // --- 1. Scene & Atmosphere ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101820);
    scene.fog = new THREE.FogExp2(0x101820, 0.05);

    // --- 2. Camera & Renderer ---
    const camera = new THREE.PerspectiveCamera(48, width / heightPx, 0.1, 100);
    camera.position.set(-5, 3.5, 5);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // --- 3. Lighting ---
    const ambientLight = new THREE.AmbientLight(0x8899bb, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
    sunLight.position.set(8, 12, 6);
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(new THREE.Color(THREE_TOKENS.accent), 2.0, 15);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // --- 4. 3D Terrain Geometry with Elevation ---
    const terrainSize = 14;
    const segments = isMobile ? 48 : 80;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    // Generate topological elevation
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Gentle urban hills & creek contours
      const elev =
        Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.5 +
        Math.sin(x * 0.9 + 1.2) * 0.25 +
        (Math.sin(x * 2.0) * Math.cos(z * 2.0)) * 0.08;
      posAttr.setY(i, elev);
    }
    terrainGeo.computeVertexNormals();

    // Dark Basemap Material for Terrain
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x172533,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // Elevation Contour Wireframe Grid
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x263e50,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireMesh = new THREE.Mesh(terrainGeo, wireMat);
    wireMesh.position.y += 0.005;
    scene.add(wireMesh);

    // --- 5. Draped Heat-Field Shader Plane ---
    const heatUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
    };
    const heatMat = new THREE.ShaderMaterial({
      vertexShader: heatFieldVertexShader,
      fragmentShader: heatFieldFragmentShader,
      uniforms: heatUniforms,
      transparent: true,
      depthWrite: false,
    });
    const heatPlaneGeo = new THREE.PlaneGeometry(terrainSize * 0.95, terrainSize * 0.95, 40, 40);
    heatPlaneGeo.rotateX(-Math.PI / 2);
    const heatPlaneMesh = new THREE.Mesh(heatPlaneGeo, heatMat);
    heatPlaneMesh.position.y = 0.08;
    scene.add(heatPlaneMesh);

    // --- 6. Hotspot Markers & Vertical Beacons ---
    hotspots.forEach((spot) => {
      const [hx, hy, hz] = spot.position;

      // Vertical beacon column
      const beaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
      beaconGeo.translate(0, 0.9, 0);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: spot.risk >= 0.7 ? 0xff704f : 0xe8c547,
        transparent: true,
        opacity: 0.8,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(hx, hy, hz);
      scene.add(beacon);

      // Glowing beacon head
      const headGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const headMat = new THREE.MeshBasicMaterial({
        color: spot.risk >= 0.7 ? 0xc31d3c : 0xf59e0b,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(hx, hy + 1.8, hz);
      scene.add(head);

      // Pulse ring at ground
      const ringGeo = new THREE.RingGeometry(0.2, 0.35, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x9b6fd8,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(hx, hy + 0.02, hz);
      scene.add(ring);
    });

    // --- 7. CatmullRomCurve3 Flythrough Splines ---
    const cameraKeypoints = [
      new THREE.Vector3(-4.8, 3.2, 4.2), // Approaching Govandi
      new THREE.Vector3(-1.8, 2.0, 1.8), // Over Govandi
      new THREE.Vector3(0.0, 2.5, 0.0),  // Kurla junction
      new THREE.Vector3(2.5, 1.8, -1.8), // Over Colaba coastal
      new THREE.Vector3(4.8, 3.5, -4.0), // High altitude synoptic
      new THREE.Vector3(-4.8, 3.2, 4.2), // Loop back
    ];
    const cameraCurve = new THREE.CatmullRomCurve3(cameraKeypoints, true, 'centripetal');
    cameraPathRef.current = cameraCurve;

    const lookKeypoints = [
      new THREE.Vector3(-3.2, 0.4, 2.5),  // Govandi
      new THREE.Vector3(-1.5, 0.5, 1.0),
      new THREE.Vector3(0.0, 0.55, -0.5), // Kurla
      new THREE.Vector3(3.4, 0.25, -2.8), // Colaba
      new THREE.Vector3(0.0, 0.0, 0.0),   // Center
      new THREE.Vector3(-3.2, 0.4, 2.5),
    ];
    const lookCurve = new THREE.CatmullRomCurve3(lookKeypoints, true, 'centripetal');
    lookPathRef.current = lookCurve;

    // Optional Orbit Controls for manual inspection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false; // Enabled when flythrough paused

    // --- 8. Visibility & Resize Handlers ---
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
    };
    window.addEventListener('resize', onResize);

    // --- 9. Animation Loop (12-Second Flight Cycle) ---
    const DURATION_SECONDS = 14.0;
    let rafId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update shader uniforms
      heatUniforms.uTime.value = elapsed;

      if (isPlayingRef.current && cameraPathRef.current && lookPathRef.current) {
        controls.enabled = false;
        progressRef.current = (progressRef.current + dt / DURATION_SECONDS) % 1.0;
        const t = progressRef.current;
        setFlythroughProgress(t);

        // Sample camera position and target from spline
        const camPos = cameraPathRef.current.getPoint(t);
        const lookPos = lookPathRef.current.getPoint(t);

        camera.position.copy(camPos);
        camera.lookAt(lookPos);

        // Update active hotspot indicator based on track progress
        if (t < 0.35) {
          setActiveHotspot(hotspots[0]);
        } else if (t < 0.70) {
          setActiveHotspot(hotspots[1]);
        } else {
          setActiveHotspot(hotspots[2]);
        }
      } else {
        controls.enabled = true;
        controls.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- 10. Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);

      controls.dispose();
      disposeThreeHierarchy(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hotspots]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const restart = () => {
    progressRef.current = 0;
    setFlythroughProgress(0);
    setIsPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#101820] shadow-2xl"
      style={{ minHeight: height }}
    >
      {/* Top Overlay Banner */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 pointer-events-none">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#9B6FD8]" />
            <h3 className="text-sm font-semibold text-white tracking-wide font-display">
              Urban Heat Island (UHI) 3D Terrain Flythrough
            </h3>
          </div>
          <p className="text-[11px] text-[#8B9AA8] font-mono mt-0.5">
            14s Catmull-Rom Spline Flight across Topological Microclimates
          </p>
        </div>

        {/* Flight Transport Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#1F3445]/90 border border-white/10 p-1 rounded-xl backdrop-blur-md">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isPlaying ? 'Pause Flythrough' : 'Play Flythrough'}
            aria-label={isPlaying ? 'Pause Flythrough' : 'Play Flythrough'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-[#FF704F]" /> : <Play className="w-4 h-4 text-[#2FA37C]" />}
          </button>
          <button
            onClick={restart}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#D7E0E7] transition-colors"
            title="Restart Flight Path"
            aria-label="Restart Flight Path"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flight Progress Bar */}
      <div className="absolute top-16 left-4 right-4 z-10 pointer-events-none">
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#FF704F] to-[#9B6FD8] h-full transition-all duration-100"
            style={{ width: `${(flythroughProgress * 100).toFixed(1)}%` }}
          />
        </div>
      </div>

      {/* Active Hotspot Readout Card */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-[#1F3445]/90 border border-white/15 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs pointer-events-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF704F]" />
              <span className="font-bold text-white text-sm">{activeHotspot.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF704F]/20 text-[#FF704F] font-semibold border border-[#FF704F]/30">
                Risk: {(activeHotspot.risk * 100).toFixed(0)}/100
              </span>
            </div>
            <p className="text-[11px] text-[#8B9AA8] leading-relaxed max-w-2xl">
              {activeHotspot.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hotspots.map((h) => (
              <button
                key={h.id}
                onClick={() => setActiveHotspot(h)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                  activeHotspot.id === h.id
                    ? 'bg-[#9B6FD8] text-white font-semibold'
                    : 'bg-white/5 text-[#8B9AA8] hover:text-white'
                }`}
              >
                {h.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
