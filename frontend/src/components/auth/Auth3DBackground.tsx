import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Auth3DBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 700;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x14181a, 0.045);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 12);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x14181a, 0);
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x8fb3d9, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 0.9);
    directionalLight.position.set(6, 12, 8);
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x8fb3d9, 2.5, 20);
    blueLight.position.set(-5, 4, 2);
    scene.add(blueLight);

    const warmLight = new THREE.PointLight(0xff704f, 1.8, 18);
    warmLight.position.set(5, 3, -2);
    scene.add(warmLight);

    // 5. 3D Synoptic Grid Terrain Geometry
    const gridCols = 32;
    const gridRows = 32;
    const terrainSize = 16;
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, gridCols - 1, gridRows - 1);
    geometry.rotateX(-Math.PI / 2);

    // Store base vertices for wave displacement
    const posAttr = geometry.attributes.position;
    const baseCoords: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < posAttr.count; i++) {
      baseCoords.push({ x: posAttr.getX(i), z: posAttr.getZ(i) });
    }

    // Solid dark terrain mesh
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x14181a,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(geometry, terrainMat);
    scene.add(terrainMesh);

    // Flowing wireframe contour overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2c4f80,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    scene.add(wireMesh);

    // 6. Floating Synoptic Sensor Node Points
    const nodeCount = 36;
    const nodeGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const nodeMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x2fa37c }), // Safe
      new THREE.MeshBasicMaterial({ color: 0xe8c547 }), // Moderate
      new THREE.MeshBasicMaterial({ color: 0xff704f }), // High
      new THREE.MeshBasicMaterial({ color: 0x8fb3d9 }), // Accent
    ];

    const nodes: THREE.Mesh[] = [];
    const nodeOffsets: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const mat = nodeMaterials[i % nodeMaterials.length];
      const node = new THREE.Mesh(nodeGeo, mat);
      const randX = (Math.random() - 0.5) * (terrainSize * 0.75);
      const randZ = (Math.random() - 0.5) * (terrainSize * 0.75);
      node.position.set(randX, 0, randZ);
      scene.add(node);
      nodes.push(node);
      nodeOffsets.push(Math.random() * Math.PI * 2);
    }

    // 7. Mouse move parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.8;
      targetY = y * 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const t = prefersReducedMotion ? 1.0 : elapsedTime;

      // Vertex undulating wave displacement
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const { x, z } = baseCoords[i];
        const distFromCenter = Math.sqrt(x * x + z * z);
        const wave1 = Math.sin(x * 0.45 + t * 0.7) * Math.cos(z * 0.45 + t * 0.6) * 0.65;
        const wave2 = Math.sin(distFromCenter * 0.6 - t * 0.9) * 0.35;
        const elev = wave1 + wave2;
        pos.setY(i, elev);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();

      // Node vertical tracking on top of terrain
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nx = node.position.x;
        const nz = node.position.z;
        const offset = nodeOffsets[i];
        const hover = Math.sin(t * 1.5 + offset) * 0.15;
        const wave = Math.sin(nx * 0.45 + t * 0.7) * Math.cos(nz * 0.45 + t * 0.6) * 0.65;
        node.position.y = wave + 0.35 + hover;
      }

      // Smooth camera drift with subtle mouse parallax
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      const orbitAngle = t * 0.08;
      const baseCamX = Math.sin(orbitAngle) * 3.5;
      const baseCamZ = 12 + Math.cos(orbitAngle) * 1.5;

      camera.position.x = baseCamX + mouseX * 2.0;
      camera.position.y = 7.5 + mouseY * 1.5;
      camera.position.z = baseCamZ;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      geometry.dispose();
      terrainMat.dispose();
      wireMat.dispose();
      nodeGeo.dispose();
      nodeMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-60"
      aria-hidden="true"
    />
  );
};
