import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SignInterpretationSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-100 pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6 mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
};

export default SignInterpretationSkeleton;
