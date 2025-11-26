import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const AnalyticsCardSkeleton = () => {
  return (
    <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-6" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-y-2">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-x-2 items-center">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCardSkeleton;