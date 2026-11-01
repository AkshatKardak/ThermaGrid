import React from 'react';
import { TYPOGRAPHY } from '../../theme/typography';

interface SectionHeaderProps {
  label: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  title,
  lead,
  action,
  className = '',
  sticky = false,
}) => {
  return (
    <div className={`space-y-4 mb-8 ${sticky ? 'sticky top-20 z-20 py-2 backdrop-blur-md bg-[#101820]/90' : ''} ${className}`}>
      {/* Scaffold: mono uppercase label + hairline with 24px amethyst tick */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={TYPOGRAPHY.label}>{label}</span>
          {action && <div>{action}</div>}
        </div>
        <div className="section-hairline" />
      </div>

      {/* Title & Lead paragraph */}
      <div className="space-y-2">
        <h2 className={`${TYPOGRAPHY.h2} text-[#D7E0E7]`}>{title}</h2>
        {lead && <p className={TYPOGRAPHY.bodyL}>{lead}</p>}
      </div>
    </div>
  );
};
