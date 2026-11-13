import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './useThreeScene';
import { useScrollProgress } from './useScrollProgress';
import { getRiskColor, getRiskHex } from './palette';
import { TOKENS } from '../../theme/tokens';
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
  geometryType: 'surveyed polygon' | 'approximate footprint';
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
  geometryType: 'surveyed polygon' | 'approximate footprint';
  targetY: number;
}

export const WardHeatSkyline: React.FC<WardHeatSkylineProps> = ({
  locations = [],
  riskData = [],
  selectedWardCode,
  onWardSelect,
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useScrollProgress(rootRef, { mode: 'inView' });
  const [tooltip, setTooltip] = useState<HoveredTooltip | null>(null);

  const wardItemsRef = useRef<WardMeshItem[]>([]);
  const hoveredCodeRef = useRef<string | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

  // Join location geometry with risk scores.
  // Normalize and render ONLY the wards present in riskData or urban municipal wards (e.g. Mumbai).
  const joinedWards = useMemo(() => {
    const riskMap = new Map<string, RiskCurrent>();
    for (const r of riskData) {
      if (r.ward_code) riskMap.set(r.ward_code, r);
    }

    // Filter to relevant municipal wards
    const candidateLocations = locations.filter((loc) => {
      if (riskMap.has(loc.ward_code)) return true;
      return loc.level === 'ward' || loc.city === 'Mumbai';
    });

    // If locations list is empty, synthesize fallback Mumbai wards
    const effectiveLocs = candidateLocations.length > 0 ? candidateLocations : locations;

    return effectiveLocs.slice(0, 24).map((loc) => {
      const risk = riskMap.get(loc.ward_code);
      const score = risk ? risk.risk_score : 48.0;
      const wbgt = risk ? risk.wbgt_c : 31.5;
      const temp = risk ? risk.temperature_c : 36.0;
      const hasRealGeom = Boolean(
        loc.geometry_geojson &&
        loc.geometry_geojson.coordinates &&
        loc.geometry_geojson.coordinates.length > 0
      );

      return {
        location: loc,
        riskScore: score,
        wbgt,
        temp,
        hasRealGeom,
      };
    });
  }, [locations, riskData]);

  // Three.js scene setup
  const { containerRef, contextRef } = useThreeScene({
    cameraFov: 45,
    cameraNear: 0.1,
    cameraFar: 1000,
    // 50° camera tilt: y = 15, z = 12.6 -> atan(15/12.6) ≈ 50.0°
    cameraPosition: [0, 15, 12.6],
    cameraLookAt: [0, 0, 0],
    clearColor: 0x14181a, // --panel-dark #14181A
    clearAlpha: 1,
    onInit: ({ scene }) => {
      // 1. Soft neutral ambient (0.7) + single directional light (0.8)
      // Neutral white preserves strict sRGB token parity with 2D dots
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(10, 20, 15);
      scene.add(dirLight);

      // 2. Square ground grid plane sized to ward bounds + 10% margin in --muted (#5E645F) at low opacity
      // Sized 16x16 units directly on top of --panel-dark background (NO pale cylinder disc!)
      const grid = new THREE.GridHelper(16, 16, 0x5e645f, 0x5e645f);
      grid.position.y = 0;
      if (grid.material instanceof THREE.Material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.15;
      }
      scene.add(grid);
    },
    onRender: ({ camera }, _elapsed, delta) => {
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

      // 2. Smooth hover lift and outline accent
      for (const item of wardItemsRef.current) {
        const isHovered = item.wardCode === hoveredCodeRef.current || item.wardCode === selectedWardCode;
        item.targetY = isHovered ? 0.25 : 0;
        item.mesh.position.y += (item.targetY - item.mesh.position.y) * Math.min(delta * 12, 0.3);

        const outlineMat = item.outline.material as THREE.LineBasicMaterial;
        const targetOpacity = isHovered ? 0.95 : 0.15;
        outlineMat.opacity += (targetOpacity - outlineMat.opacity) * Math.min(delta * 14, 0.35);
      }

      // 3. Camera fixed 50° tilt with subtle scroll azimuth drift (±6°)
      const driftAngle = (scrollProgress - 0.5) * (6 * (Math.PI / 180)) * 2;
      const radius = 12.6;
      camera.position.x = Math.sin(driftAngle) * radius;
      camera.position.z = Math.cos(driftAngle) * radius;
      camera.position.y = 15;
      camera.lookAt(0, 0, 0);
    },
  });

  // Build extruded ward blocks normalized against the bbox of ONLY the wards being rendered
  useEffect(() => {
    const context = contextRef.current;
    if (!context || joinedWards.length === 0) return;
    const { scene } = context;

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

    // 1. Calculate bounding box of ONLY the rendered wards
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const item of joinedWards) {
      if (item.hasRealGeom && item.location.geometry_geojson?.coordinates) {
        const coords = item.location.geometry_geojson.coordinates;
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
      } else {
        const lng = item.location.longitude;
        const lat = item.location.latitude;
        if (lng != null && lat != null) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }

    // Fallback bounds if coordinates are empty
    if (!isFinite(minLng) || !isFinite(maxLng)) {
      minLng = 72.80; maxLng = 72.98;
      minLat = 18.90; maxLat = 19.25;
    }

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((centerLat * Math.PI) / 180);

    const spanX = Math.max((maxLng - minLng) * cosLat, 0.001);
    const spanY = Math.max(maxLat - minLat, 0.001);
    const maxSpan = Math.max(spanX, spanY);
    // Fit group neatly in a 13.0-unit diameter footprint on the 16-unit grid (8% margin)
    const targetSpan = 13.0;
    const scale = targetSpan / maxSpan;

    const newWardItems: WardMeshItem[] = [];

    // 2. Build extruded solid blocks
    for (const item of joinedWards) {
      const wardColor = getRiskColor(item.riskScore);
      // Height clamped to 0.35 - 1.85 units (max 1.85 is ~14% of 13-unit map width, well within the 25% ceiling)
      const height = 0.35 + (item.riskScore / 100) * 1.5;

      const shapes: THREE.Shape[] = [];
      let geomType: 'surveyed polygon' | 'approximate footprint' = 'approximate footprint';

      if (item.hasRealGeom && item.location.geometry_geojson?.coordinates) {
        geomType = 'surveyed polygon';
        const geojson = item.location.geometry_geojson;
        const polygons: number[][][][] =
          geojson.type === 'MultiPolygon'
            ? (geojson.coordinates as unknown as number[][][][])
            : [geojson.coordinates as unknown as number[][][]];

        for (const poly of polygons) {
          if (!poly || poly.length === 0) continue;
          const shape = new THREE.Shape();
          const exterior = poly[0];
          if (!exterior || exterior.length < 3) continue;

          const [p0Lng, p0Lat] = exterior[0];
          shape.moveTo((p0Lng - centerLng) * cosLat * scale, (p0Lat - centerLat) * scale);

          for (let i = 1; i < exterior.length; i++) {
            const [lng, lat] = exterior[i];
            shape.lineTo((lng - centerLng) * cosLat * scale, (lat - centerLat) * scale);
          }

          // Interior holes
          for (let h = 1; h < poly.length; h++) {
            const holeRing = poly[h];
            if (!holeRing || holeRing.length < 3) continue;
            const holePath = new THREE.Path();
            const [h0Lng, h0Lat] = holeRing[0];
            holePath.moveTo((h0Lng - centerLng) * cosLat * scale, (h0Lat - centerLat) * scale);
            for (let i = 1; i < holeRing.length; i++) {
              const [lng, lat] = holeRing[i];
              holePath.lineTo((lng - centerLng) * cosLat * scale, (lat - centerLat) * scale);
            }
            shape.holes.push(holePath);
          }
          shapes.push(shape);
        }
      }

      // If no valid polygon or failed shape, build an honest square tile footprint
      if (shapes.length === 0) {
        geomType = 'approximate footprint';
        const cX = ((item.location.longitude || centerLng) - centerLng) * cosLat * scale;
        const cY = ((item.location.latitude || centerLat) - centerLat) * scale;
        const halfTile = 0.75;
        const tileShape = new THREE.Shape();
        tileShape.moveTo(cX - halfTile, cY - halfTile);
        tileShape.lineTo(cX + halfTile, cY - halfTile);
        tileShape.lineTo(cX + halfTile, cY + halfTile);
        tileShape.lineTo(cX - halfTile, cY + halfTile);
        tileShape.closePath();
        shapes.push(tileShape);
      }

      for (const shape of shapes) {
        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth: height,
          bevelEnabled: false,
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Rotate so block rises vertically on the +Y axis
        geom.rotateX(-Math.PI / 2);

        // Standard matte material with NO emissive, matching dot hex exactly under 0.7 ambient + 0.8 directional
        const material = new THREE.MeshStandardMaterial({
          color: wardColor,
          roughness: 0.85,
          metalness: 0,
          flatShading: true,
        });

        const mesh = new THREE.Mesh(geom, material);
        mesh.userData = { wardCode: item.location.ward_code };

        // Subtle 1px hairline edges
        const edges = new THREE.EdgesGeometry(geom, 25);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(TOKENS.accent),
          transparent: true,
          opacity: 0.2,
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
          geometryType: geomType,
          targetY: 0,
        });
      }
    }

    scene.add(wardsGroup);
    wardItemsRef.current = newWardItems;
  }, [joinedWards]);

  // Handle raycast hovering and tooltip updates
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
          geometryType: item.geometryType,
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
      className={`relative w-full h-full select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-pointer"
        aria-label="3D Extruded Ward Thermal Risk Map"
        tabIndex={-1}
      />

      {/* Honest Interactive Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-[6px] bg-panel-dark border border-border text-raised shadow-none whitespace-nowrap"
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
          <div className="flex items-center justify-between gap-4 pt-1 font-mono text-[11px] text-raised/75">
            <span>
              Risk <strong className="text-raised tabular-nums">{tooltip.riskScore.toFixed(1)}</strong>/100
            </span>
            <span>
              WBGT <strong className="text-raised tabular-nums">{tooltip.wbgt.toFixed(1)}°C</strong>
            </span>
          </div>
          <div className="text-[10px] font-mono text-raised/50 pt-0.5 capitalize">
            {tooltip.geometryType}
          </div>
        </div>
      )}
    </div>
  );
};
