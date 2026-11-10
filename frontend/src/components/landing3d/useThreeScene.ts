import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface UseThreeSceneOptions {
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
  clearColor?: THREE.ColorRepresentation;
  clearAlpha?: number;
  onInit?: (context: ThreeSceneContext) => void;
  onRender?: (context: ThreeSceneContext, elapsed: number, delta: number) => void;
  pauseOffscreen?: boolean;
}

export interface ThreeSceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  container: HTMLDivElement;
}

export function useThreeScene({
  cameraFov = 45,
  cameraNear = 0.1,
  cameraFar = 1000,
  cameraPosition = [0, 10, 15],
  cameraLookAt = [0, 0, 0],
  clearColor,
  clearAlpha = 0,
  onInit,
  onRender,
  pauseOffscreen = true,
}: UseThreeSceneOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<ThreeSceneContext | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const onRenderRef = useRef(onRender);
  onRenderRef.current = onRender;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const initialWidth = container.clientWidth || 300;
    const initialHeight = container.clientHeight || 300;
    const aspect = initialWidth / Math.max(initialHeight, 1);
    const camera = new THREE.PerspectiveCamera(cameraFov, aspect, cameraNear, cameraFar);
    camera.position.set(...cameraPosition);
    camera.lookAt(new THREE.Vector3(...cameraLookAt));

    // 3. Renderer setup
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.warn('WebGL initialization failed:', err);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.shadowMap.enabled = false; // Matte & flat aesthetic, no heavy shadows
    if (clearColor !== undefined) {
      renderer.setClearColor(clearColor, clearAlpha);
    } else {
      renderer.setClearColor(0x000000, 0); // Transparent canvas
    }

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const context: ThreeSceneContext = {
      scene,
      camera,
      renderer,
      container,
    };
    contextRef.current = context;

    if (onInit) {
      onInit(context);
    }

    // 4. ResizeObserver setup
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer?.setSize(width, height, false);
          }
        }
      }
    });
    resizeObserver.observe(container);

    // 5. IntersectionObserver setup (pause rendering when offscreen)
    let intersectionObserver: IntersectionObserver | null = null;
    if (pauseOffscreen && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isVisibleRef.current = entry.isIntersecting;
          }
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(container);
    }

    // 6. Animation render loop
    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);

      if (!isVisibleRef.current || !renderer) {
        lastTime = time;
        return;
      }

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (onRenderRef.current) {
        onRenderRef.current(context, time / 1000, delta);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // 7. Cleanup & dispose on unmount
    return () => {
      cancelAnimationFrame(animId);

      resizeObserver.disconnect();
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }

      // Dispose all scene objects
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      scene.clear();

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        renderer = null;
      }
      contextRef.current = null;
    };
  }, []); // Mounts and unmounts with lifecycle of component

  return { containerRef, contextRef };
}
