import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../theme/motion';

interface SpotlightCursorProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export const SpotlightCursor: React.FC<SpotlightCursorProps> = ({ containerRef }) => {
  const glowRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;

    let rafId: number | null = null;
    let targetX = -500;
    let targetY = -500;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          glow.style.transform = `translate3d(${targetX - 200}px, ${targetY - 200}px, 0)`;
          glow.style.opacity = '1';
          rafId = null;
        });
      }
    };

    const onPointerLeave = () => {
      glow.style.opacity = '0';
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseleave', onPointerLeave);

    return () => {
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mouseleave', onPointerLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      ref={glowRef}
      className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 transition-opacity duration-300 z-10"
      style={{
        background: 'radial-gradient(circle, rgba(127, 166, 201, 0.08) 0%, transparent 70%)',
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  );
};
