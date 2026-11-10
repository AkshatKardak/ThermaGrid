import React from 'react';
import { Skeleton } from './Skeleton';

export const FullPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 space-y-6 max-w-xl mx-auto">
      <div className="w-12 h-12 rounded-[8px] bg-surface border border-border animate-pulse flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-accent/40 animate-ping" />
      </div>
      <div className="w-full space-y-3 text-center">
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
      <div className="w-full grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="h-28 w-full rounded-[8px]" />
        <Skeleton className="h-28 w-full rounded-[8px]" />
      </div>
    </div>
  );
};
