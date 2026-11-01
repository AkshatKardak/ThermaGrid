import { useEffect, useState } from 'react';

/**
 * ThermaGrid Motion System
 * Instrument-grade choreography tokens, easing curves, and animation variants.
 */

export const MOTION = {
  dur: {
    fast: 0.12, // 120ms
    base: 0.20, // 200ms
    slow: 0.32, // 320ms
    scene: 0.70, // 700ms
    chart: 1.20, // 1200ms
    countUp: 0.90, // 900ms
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as const, // entrances
    inOut: [0.65, 0, 0.35, 1] as const, // layout shifts
  },
  spring: {
    stiffness: 220,
    damping: 26,
    mass: 1,
  },
  stagger: 0.07, // 70ms
} as const;

/**
 * Hook to detect user prefers-reduced-motion preference.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  return prefersReduced;
}

/**
 * Staggered container animation variant.
 */
export const containerStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION.stagger,
      delayChildren: 0.05,
    },
  },
};

/**
 * Standard child entrance variant: translateY(16px -> 0), opacity 0 -> 1.
 */
export const childFadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.dur.scene,
      ease: MOTION.ease.out,
    },
  },
};

/**
 * Word-by-word headline reveal container (stagger 40ms).
 */
export const wordContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const wordItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.dur.base,
      ease: MOTION.ease.out,
    },
  },
};

/**
 * Count-up hook from 0 to target over 900ms ease-out (first reveal only).
 */
export function useCountUp(target: number, durationMs = 900, isVisible = true): number {
  const reducedMotion = usePrefersReducedMotion();
  const [current, setCurrent] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion || !isVisible) {
      setCurrent(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // ease-out cubic: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(easeProgress * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, durationMs, isVisible, reducedMotion]);

  return current;
}
