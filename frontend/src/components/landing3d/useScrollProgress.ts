import { useState, useEffect, RefObject } from 'react';

export interface UseScrollProgressOptions {
  mode?: 'inView' | 'sticky';
  offset?: [number, number]; // [startOffset, endOffset] 0..1
}

export function useScrollProgress(
  targetRef: RefObject<HTMLElement | null>,
  options: UseScrollProgressOptions = {}
): number {
  const { mode = 'inView' } = options;
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let ticking = false;

    const calculateProgress = () => {
      const element = targetRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || 1;

      if (mode === 'sticky') {
        // Sticky container where element is taller than window
        const scrollDistance = element.offsetHeight - windowHeight;
        if (scrollDistance <= 0) {
          setProgress(rect.top <= 0 ? 1 : 0);
        } else {
          const scrolled = -rect.top;
          const p = Math.min(Math.max(scrolled / scrollDistance, 0), 1);
          setProgress(p);
        }
      } else {
        // inView mode: 0 when element top hits bottom of viewport, 1 when element bottom hits top of viewport
        const total = windowHeight + rect.height;
        const current = windowHeight - rect.top;
        const p = Math.min(Math.max(current / total, 0), 1);
        setProgress(p);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    calculateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [targetRef, mode]);

  return progress;
}
