import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Checks whether WebGL 1/2 is supported and working on the current device.
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Deep recursive disposal helper for Three.js scenes, meshes, materials, and geometries.
 * Avoids WebGL memory leaks during React re-renders and StrictMode double-mounting.
 */
export function disposeThreeHierarchy(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.Points).isPoints) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            disposeMaterial(mat);
          });
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });
}

function disposeMaterial(mat: THREE.Material) {
  // Dispose all potential texture maps
  const record = mat as unknown as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value && typeof value === 'object' && (value as THREE.Texture).isTexture) {
      (value as THREE.Texture).dispose();
    }
  }
  mat.dispose();
}

export interface RenderLoopOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rendererRef?: React.RefObject<THREE.WebGLRenderer | null>;
  onFrame?: (dt: number, time: number) => void;
  enableAdaptiveDPR?: boolean;
}

/**
 * Custom hook that manages performance guardrails:
 * 1. Pause when off-screen (IntersectionObserver)
 * 2. Pause when tab hidden (document.visibilitychange)
 * 3. Respects prefers-reduced-motion (skips RAF loop or renders single static frame)
 * 4. Adaptive DPR: 1.5x desktop, drops to 1.0x if frame time > 20ms for 2s
 * 5. Device class detection (desktop vs mobile)
 */
export function useRenderLoop({
  containerRef,
  rendererRef,
  onFrame,
  enableAdaptiveDPR = true,
}: RenderLoopOptions) {
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentDPR, setCurrentDPR] = useState(1.5);
  const [webglSupported, setWebglSupported] = useState(true);

  // Performance monitoring refs
  const slowFrameTimeStart = useRef<number | null>(null);
  const rollingFrameTimes = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. WebGL capability check
    setWebglSupported(isWebGLAvailable());

    // 2. Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 3. prefers-reduced-motion check
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionMediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionMediaQuery.addEventListener('change', handleMotionChange);

    // 4. Tab visibility listener
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. IntersectionObserver (pause rendering when off-screen)
    let observer: IntersectionObserver | null = null;
    if (containerRef.current && window.IntersectionObserver) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setIsIntersecting(entry.isIntersecting);
        },
        { threshold: 0.05 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer) observer.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [containerRef]);

  // Main tick loop
  useEffect(() => {
    // If reduced motion is requested, do not run the continuous loop
    if (prefersReducedMotion) {
      if (onFrame) onFrame(0.016, 0);
      return;
    }

    const shouldRun = isIntersecting && isTabVisible && webglSupported;
    if (!shouldRun) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Clamp to avoid huge jumps
      const frameMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Adaptive DPR tracking
      if (enableAdaptiveDPR && rendererRef?.current) {
        const times = rollingFrameTimes.current;
        times.push(frameMs);
        if (times.length > 60) times.shift();

        const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
        if (avgMs > 20.0) {
          if (!slowFrameTimeStart.current) {
            slowFrameTimeStart.current = now;
          } else if (now - slowFrameTimeStart.current > 2000 && currentDPR > 1.0) {
            // Drop DPR to 1.0 to preserve 60fps
            setCurrentDPR(1.0);
            rendererRef.current.setPixelRatio(1.0);
          }
        } else {
          slowFrameTimeStart.current = null;
        }
      }

      if (onFrame) {
        onFrame(dt, now / 1000);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    isIntersecting,
    isTabVisible,
    prefersReducedMotion,
    webglSupported,
    onFrame,
    enableAdaptiveDPR,
    currentDPR,
    rendererRef,
  ]);

  return {
    isIntersecting,
    isTabVisible,
    prefersReducedMotion,
    isMobile,
    webglSupported,
    currentDPR,
  };
}
