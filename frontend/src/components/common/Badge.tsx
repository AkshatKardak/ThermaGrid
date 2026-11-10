import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme' | 'neutral' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  // Risk-as-text rule: --risk-1 through --risk-4 are NEVER used as text color.
  // Numbers & text in --ink. Low opacity fill. 1px border in color-mix(--risk-N 55%, --ink).
  // --risk-2 gets color-mix(--risk-2 60%, --ink) outline.
  // --risk-5 is the only exception (passes 5.14:1 contrast).
  const variantStyles = {
    safe: 'bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]',
    moderate: 'bg-[color-mix(in_srgb,var(--risk-2)_20%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-2)_60%,var(--ink))]',
    high: 'bg-[color-mix(in_srgb,var(--risk-3)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-3)_55%,var(--ink))]',
    veryhigh: 'bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] text-ink border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]',
    extreme: 'bg-[color-mix(in_srgb,var(--risk-5)_15%,var(--surface))] text-risk-5 border-[color-mix(in_srgb,var(--risk-5)_55%,var(--ink))]',
    neutral: 'bg-surface text-ink border-border',
    accent: 'bg-[var(--accent-soft)] text-accent border-[color-mix(in_srgb,var(--accent)_30%,var(--border))]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium border font-mono ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
