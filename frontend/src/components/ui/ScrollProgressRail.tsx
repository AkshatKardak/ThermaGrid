import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../theme/motion';

export const ScrollProgressRail: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      className="fixed right-0 top-0 bottom-0 w-[2px] bg-white/5 z-50 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="w-full bg-[#8FB3D9] transition-all duration-75"
        style={{ height: `${progress}%` }}
      />
    </div>
  );
};
