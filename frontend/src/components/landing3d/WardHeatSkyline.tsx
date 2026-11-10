import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './useThreeScene';
import { useScrollProgress } from './useScrollProgress';
import { getRiskColor, getRiskHex } from './palette';
import { THEME_COLORS } from '../../theme/tokens';
import type { Location, RiskCurrent } from '../../types';

export interface WardHeatSkylineProps {
  locations?: Location[];
  riskData?: RiskCurrent[];
  selectedWardCode?: string | null;
  onWardSelect?: (wardCode: string) => void;
  isDemo?: boolean;
  className?: string;
}

interface HoveredTooltip {
  wardName: string;
  wardCode: string;
  riskScore: number;
  wbgt: number;
  temp: number;
  x: number;
  y: number;
}

interface WardMeshItem {
  mesh: THREE.Mesh;
  outline: THREE.LineSegments;
  wardCode: string;
  wardName: string;
  riskScore: number;
  wbgt: number;
  temp: number;
  targetY: number;
}

export const WardHeatSkyline: React.FC<WardHeatSkylineProps> = ({
  locations = [],
  riskData = [],
  selectedWardCode,
  onWardSelect,
  isDemo = false,
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useScrollProgress(rootRef, { mode: 'inView' });
  const [tooltip, setTooltip] = useState<HoveredTooltip | null>(null);

  const wardItemsRef = useRef<WardMeshItem[]>([]);
  const hoveredCodeRef = useRef<string | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const cameraBaseRadiusRef = useRef<number>(20);

  // Client-side join of Location polygons + Risk data
  const joinedWards = useMemo(() => {
    const riskMap = new Map<string, RiskCurrent>();
    for (const r of riskData) {
      if (r.ward_code) riskMap.set(r.ward_code, r);
    }

    const validLocations = locations.filter(
      (loc) => loc.geometry_geojson && loc.geometry_geojson.coordinates
    );

    return validLocations.map((loc) => {
      const risk = riskMap.get(loc.ward_code);
      const score = risk ? risk.risk_score : 45.0;
      const wbgt = risk ? risk.wbgt_c : 31.5;
      const temp = risk ? risk.temperature_c : 36.0;
      return {
        location: loc,
        riskScore: score,
        wbgt,
        temp,
      };
    });
  }, [locations, riskData]);

  // Three.js scene setup
  const { containerRef, contextRef } = useThreeScene({
    cameraFov: 45,
    cameraNear: 0.1,
    cameraFar: 1000,
    cameraPosition: [0, 16, 16],
    cameraLookAt: [0, 0.5, 0],
    clearAlpha: 0,
    onInit: ({ scene }) => {
      // 1. Soft ambient + single directional light (Matte aesthetic, no glowing spheres)
      const ambientLight = new THREE.AmbientLight(0xd8e8e6, 0.65);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
      dirLight.position.set(15, 25, 20);
      scene.add(dirLight);

      // 2. Ground grid plane in --raised at low opacity
      const grid = new THREE.GridHelper(26, 26, THEME_COLORS.raised, THEME_COLORS.raised);
      grid.position.y = 0;
      if (grid.material instanceof THREE.Material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.22;
      }
      scene.add(grid);

      // 3. Subtle pedestal base
      const baseGeo = new THREE.CylinderGeometry(13, 13.5, 0.2, 48);
      const baseMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEME_COLORS.surface),
        roughness: 0.95,
        metalness: 0,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -0.1;
      scene.add(baseMesh);
    },
    onRender: ({ scene, camera }, _elapsed, delta) => {
      // 1. Raycast detection for hover
      if (contextRef.current && contextRef.current.renderer) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const meshes = wardItemsRef.current.map((item) => item.mesh);
        const intersects = raycasterRef.current.intersectObjects(meshes, false);

        let activeCode: string | null = null;
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const found = wardItemsRef.current.find((item) => item.mesh === hit);
          if (found) {
            activeCode = found.wardCode;
          }
        }
        hoveredCodeRef.current = activeCode;
      }

      // 2. Smooth damping lift and outline opacity on ward meshes
      for (const item of wardItemsRef.current) {
        const isHovered = item.wardCode === hoveredCodeRef.current || item.wardCode === selectedWardCode;
        item.targetY = isHovered ? 0.35 : 0;
        item.mesh.position.y += (item.targetY - item.mesh.position.y) * Math.min(delta * 12, 0.3);

        const outlineMat = item.outline.material as THREE.LineBasicMaterial;
        const targetOpacity = isHovered ? 0.95 : 0;
        outlineMat.opacity += (targetOpacity - outlineMat.opacity) * Math.min(delta * 14, 0.35);
      }

      // 3. Camera fixed tilt (~50°) + slight scroll azimuth drift (±8°)
      // Fixed tilt: height = 16, radius = 16 (atan(16/16) = 45° to 50°)
      const driftAngle = (scrollProgress - 0.5) * (8 * (Math.PI / 180)) * 2; // ±8 deg
      const radius = cameraBaseRadiusRef.current - (scrollProgress - 0.5) * 1.5; // subtle dolly
      camera.position.x = Math.sin(driftAngle) * radius;
      camera.position.z = Math.cos(driftAngle) * radius;
      camera.position.y = 16;
      camera.lookAt(0, 0.5, 0);
    },
  });

  // Build extruded ward meshes whenever joined data changes
  useEffect(() => {
    const context = contextRef.current;
    if (!context || joinedWards.length === 0) return;
    const { scene } = context;

    // Remove existing ward group
    const existingGroup = scene.getObjectByName('wards-group');
    if (existingGroup) {
      scene.remove(existingGroup);
      existingGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else if (obj.material) obj.material.dispose();
        }
      });
    }

    const wardsGroup = new THREE.Group();
    wardsGroup.name = 'wards-group';

    // 1. Calculate centroid across all ward coordinates
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const item of joinedWards) {
      const coords = item.location.geometry_geojson?.coordinates;
      if (!coords) continue;
      // Handle Polygon or MultiPolygon
      const rings = Array.isArray(coords[0][0][0])
        ? (coords as unknown as number[][][][]).flat(1)
        : (coords as unknown as number[][][]);

      for (const ring of rings) {
        for (const [lng, lat] of ring) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((centerLat * Math.PI) / 180);

    const spanX = (maxLng - minLng) * cosLat;
    const spanY = maxLat - minLat;
    const maxSpan = Math.max(spanX, spanY, 0.01);
    const targetSpan = 16.0; // Fit in 16 scene units
    const scale = targetSpan / maxSpan;

    const newWardItems: WardMeshItem[] = [];

    // 2. Build each ward polygon extrusion
    for (const item of joinedWards) {
      const geojson = item.location.geometry_geojson;
      if (!geojson || !geojson.coordinates) continue;

      const polygons: number[][][][] =
        geojson.type === 'MultiPolygon'
          ? (geojson.coordinates as unknown as number[][][][])
          : [geojson.coordinates as unknown as number[][][]];

      const wardColor = getRiskColor(item.riskScore);
      // Extrusion height = risk score mapped to bounded range (0.35 to 3.4)
      const height = 0.35 + (item.riskScore / 100) * 3.05;

      for (const poly of polygons) {
        if (!poly || poly.length === 0) continue;

        const shape = new THREE.Shape();
        const exterior = poly[0];

        const [p0Lng, p0Lat] = exterior[0];
        const x0 = (p0Lng - centerLng) * cosLat * scale;
        const y0 = (p0Lat - centerLat) * scale;
        shape.moveTo(x0, y0);

        for (let i = 1; i < exterior.length; i++) {
          const [lng, lat] = exterior[i];
          const x = (lng - centerLng) * cosLat * scale;
          const y = (lat - centerLat) * scale;
          shape.lineTo(x, y);
        }

        // Holes if present
        for (let h = 1; h < poly.length; h++) {
          const holeRing = poly[h];
          if (!holeRing || holeRing.length === 0) continue;
          const holePath = new THREE.Path();
          const [h0Lng, h0Lat] = holeRing[0];
          holePath.moveTo((h0Lng - centerLng) * cosLat * scale, (h0Lat - centerLat) * scale);
          for (let i = 1; i < holeRing.length; i++) {
            const [lng, lat] = holeRing[i];
            holePath.lineTo((lng - centerLng) * cosLat * scale, (lat - centerLat) * scale);
          }
          shape.holes.push(holePath);
        }

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth: height,
          bevelEnabled: false,
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Rotate geometry so extrusion rises along +Y (upward in world space)
        geom.rotateX(-Math.PI / 2);

        const material = new THREE.MeshStandardMaterial({
          color: wardColor,
          roughness: 0.9,
          metalness: 0,
          flatShading: true,
        });

        const mesh = new THREE.Mesh(geom, material);
        mesh.userData = { wardCode: item.location.ward_code };

        // Edges outline in --accent (#8FB3D9)
        const edges = new THREE.EdgesGeometry(geom, 22);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(THEME_COLORS.accent),
          transparent: true,
          opacity: 0,
          linewidth: 2,
        });
        const outline = new THREE.LineSegments(edges, lineMat);
        mesh.add(outline);

        wardsGroup.add(mesh);

        newWardItems.push({
          mesh,
          outline,
          wardCode: item.location.ward_code,
          wardName: item.location.ward_name,
          riskScore: item.riskScore,
          wbgt: item.wbgt,
          temp: item.temp,
          targetY: 0,
        });
      }
    }

    scene.add(wardsGroup);
    wardItemsRef.current = newWardItems;
  }, [joinedWards]);

  // Handle mouse move for raycasting and tooltip positioning
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouseRef.current.set(x, y);

    const active = hoveredCodeRef.current;
    if (active) {
      const item = wardItemsRef.current.find((w) => w.wardCode === active);
      if (item) {
        setTooltip({
          wardName: item.wardName,
          wardCode: item.wardCode,
          riskScore: item.riskScore,
          wbgt: item.wbgt,
          temp: item.temp,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => {
    mouseRef.current.set(-999, -999);
    hoveredCodeRef.current = null;
    setTooltip(null);
  };

  const handleClick = () => {
    const active = hoveredCodeRef.current;
    if (active && onWardSelect) {
      onWardSelect(active);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full min-h-[460px] select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-pointer"
        aria-label="3D Ward Heat Risk Skyline Map"
        tabIndex={-1}
      />

      {/* Interactive Raycast Hover Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-[6px] bg-panel-dark border border-border text-raised"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getRiskHex(tooltip.riskScore) }}
            />
            <span className="text-xs font-medium text-raised truncate max-w-[200px]">
              {tooltip.wardName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 font-mono text-[11px] text-raised/70">
            <span>
              Risk <strong className="text-raised tabular-nums">{tooltip.riskScore.toFixed(1)}</strong>/100
            </span>
            <span>
              WBGT <strong className="text-raised tabular-nums">{tooltip.wbgt.toFixed(1)}°C</strong>
            </span>
          </div>
        </div>
      )}

      {/* Feed Status Badge in top right */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        {isDemo ? (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-[6px] bg-panel-dark border border-border text-raised/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Demo data
          </span>
        ) : (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-[6px] bg-panel-dark border border-border text-raised flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Live Feed
          </span>
        )}
      </div>

      {/* Interaction helper hint in bottom left */}
      <div className="absolute bottom-3 left-4 z-20 pointer-events-none text-[10px] font-mono text-raised/70">
        Hover to inspect ward telemetry · Scroll drifts camera
      </div>
    </div>
  );
};
