import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-border/40 rounded-[4px] ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border rounded-[8px] p-5 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-16 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
};
