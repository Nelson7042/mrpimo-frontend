"use client";

import React from "react";
import Skeleton from "@/components/ui/Skeleton";


const SalesOverviewSkeleton = () => {
  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 border-b border-b-gray-100 pb-4">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="p-4 rounded-lg space-y-2 bg-gray-100">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>

      <div className="h-80 w-full flex items-center justify-center">
        <Skeleton className="h-full w-full rounded" />
      </div>
    </div>
  );
};

export default SalesOverviewSkeleton;