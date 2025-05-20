import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const TeamCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 h-full">
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="pt-3 mt-3 border-t border-gray-800">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

export const TeamsSectionSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <TeamCardSkeleton key={i} />
      ))}
    </div>
  );
};
