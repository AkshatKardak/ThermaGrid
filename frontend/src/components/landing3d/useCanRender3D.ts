import { useState, useEffect } from 'react';
import { env } from '../../config/env';

export function useCanRender3D(): boolean {
  const [canRender, setCanRender] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isEnabled = env.ENABLE_3D !== false;
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return isEnabled && isDesktop && !reducedMotion;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaWidth = window.matchMedia('(min-width: 768px)');
    const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      const isEnabled = env.ENABLE_3D !== false;
      const isDesktop = mediaWidth.matches;
      const reducedMotion = mediaMotion.matches;
      setCanRender(isEnabled && isDesktop && !reducedMotion);
    };

    evaluate();

    mediaWidth.addEventListener('change', evaluate);
    mediaMotion.addEventListener('change', evaluate);

    return () => {
      mediaWidth.removeEventListener('change', evaluate);
      mediaMotion.removeEventListener('change', evaluate);
    };
  }, []);

  return canRender;
}
