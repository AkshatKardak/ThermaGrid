import React, { useRef, useState, useEffect } from 'react';
import { TYPOGRAPHY } from '../../theme/typography';
import { useCountUp } from '../../theme/motion';

interface KpiNumeralProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  size?: 'xl' | 'l' | 'm';
  label?: string;
  sublabel?: string;
  color?: string; // Optional hex or css color override
  delta?: { value: number; label?: string };
  className?: string;
}

export const KpiNumeral: React.FC<KpiNumeralProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  size = 'l',
  label,
  sublabel,
  color,
  delta,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Multiplier for decimals if needed
  const multiplier = Math.pow(10, decimals);
  const rawTarget = Math.round(value * multiplier);
  const animatedRaw = useCountUp(rawTarget, 900, hasEntered);
  const displayVal = (animatedRaw / multiplier).toFixed(decimals);

  const sizeClass =
    size === 'xl'
      ? TYPOGRAPHY.numeralXl
      : size === 'l'
      ? TYPOGRAPHY.numeralL
      : TYPOGRAPHY.numeralM;

  return (
    <div ref={containerRef} className={`space-y-1 ${className}`}>
      {label && <div className={TYPOGRAPHY.label}>{label}</div>}

      <div className="flex items-baseline gap-2">
        <span
          className={sizeClass}
          style={{ color: color || 'var(--ink)' }}
        >
          {prefix}
          {displayVal}
          {suffix && <span className="text-[0.6em] font-normal ml-1 text-muted">{suffix}</span>}
        </span>

        {delta !== undefined && (
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-[4px] text-ink ${
              delta.value > 0
                ? 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]'
                : 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] border border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]'
            }`}
          >
            {delta.value > 0 ? `+${delta.value}` : delta.value}
            {delta.label && ` ${delta.label}`}
          </span>
        )}
      </div>

      {sublabel && <div className={TYPOGRAPHY.micro}>{sublabel}</div>}
    </div>
  );
};
