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
      tierStyles = 'bg-[#203A45] border border-white/16 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.90)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]';
      break;
    case 'l3':
      tierStyles = 'bg-[#142630]/85 backdrop-blur-[16px] border border-white/16 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]';
      break;
    case 'recessed':
      tierStyles = 'bg-[#203A45]/40 border border-white/8';
      break;
    case 'l1':
    default:
      tierStyles = 'bg-[#142630] border border-white/8';
      break;
  }

  const hoverStyles = hoverable
    ? 'hover:-translate-y-[3px] hover:border-white/20 transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-[14px] p-6 ${tierStyles} ${hoverStyles} ${
        cornerTicks ? 'corner-ticks' : ''
      } ${className}`}
      {...rest}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-white/6">
          <div className="space-y-0.5">
            {typeof title === 'string' ? (
              <h3 className={`${TYPOGRAPHY.h3} text-[#D7E0E7]`}>{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className={TYPOGRAPHY.micro}>{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
