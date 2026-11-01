import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  title,
  subtitle,
  action,
}) => {
  return (
    <div
      className={`rounded-xl transition-all duration-200 border ${
        elevated
          ? 'bg-[#263E50] border-white/10 shadow-xl'
          : 'bg-[#1F3445]/90 border-white/10'
      } p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#D7E0E7] font-display tracking-wide">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#8B9AA8] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
