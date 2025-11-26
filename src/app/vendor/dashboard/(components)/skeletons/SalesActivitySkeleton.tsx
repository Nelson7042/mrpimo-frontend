"use client";

import React from "react";
import Skeleton  from "@/components/ui/Skeleton"

const SalesActivitySkeleton = () => {
  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-1/3 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>

      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-full bg-gray-200 w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5 rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesActivitySkeleton;