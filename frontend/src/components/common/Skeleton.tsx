
import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-xl", className)} />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm p-4 h-full flex flex-col gap-4">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const OrderItemSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-grow">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-grow">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
};
