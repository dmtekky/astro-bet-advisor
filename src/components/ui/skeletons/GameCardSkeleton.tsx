import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const GameCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-6 w-12 ml-auto" />
          </div>
        </div>
        <Skeleton className="h-9 w-full mt-3" />
      </div>
    </div>
  );
};

export const GamesSectionSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
};
