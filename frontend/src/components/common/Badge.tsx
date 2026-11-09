import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme' | 'neutral' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    safe: 'bg-[#2FA37C]/15 text-[#2FA37C] border-[#2FA37C]/30',
    moderate: 'bg-[#E8C547]/15 text-[#E8C547] border-[#E8C547]/30',
    high: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    veryhigh: 'bg-[#FF704F]/15 text-[#FF704F] border-[#FF704F]/30',
    extreme: 'bg-[#C31D3C]/20 text-[#FF704F] border-[#C31D3C]/40',
    neutral: 'bg-white/5 text-[#D7E0E7] border-white/10',
    accent: 'bg-[#8FB3D9]/20 text-[#8FB3D9] border-[#8FB3D9]/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
