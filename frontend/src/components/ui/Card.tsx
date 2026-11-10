import React from 'react';
import { TYPOGRAPHY } from '../../theme/typography';

export type CardTier = 'l1' | 'l2' | 'l3' | 'recessed';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tier?: CardTier;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  cornerTicks?: boolean;
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  tier = 'l1',
  title,
  subtitle,
  action,
  cornerTicks = false,
  hoverable = false,
  className = '',
  children,
  ...rest
}) => {
  let tierStyles = '';
  switch (tier) {
    case 'l2':
      tierStyles = 'bg-raised border border-border';
      break;
    case 'l3':
      tierStyles = 'bg-raised border border-border';
      break;
    case 'recessed':
      tierStyles = 'bg-bg border border-border';
      break;
    case 'l1':
    default:
      tierStyles = 'bg-surface border border-border';
      break;
  }

  const hoverStyles = hoverable
    ? 'hover:-translate-y-[1px] hover:border-accent transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-[8px] p-6 ${tierStyles} ${hoverStyles} ${
        cornerTicks ? 'corner-ticks' : ''
      } ${className}`}
      {...rest}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-border">
          <div className="space-y-0.5">
            {typeof title === 'string' ? (
              <h3 className={`${TYPOGRAPHY.h3} text-ink`}>{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className={`${TYPOGRAPHY.micro} text-muted`}>{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
