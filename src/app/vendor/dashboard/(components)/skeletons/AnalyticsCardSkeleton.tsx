"use client";

import React from "react";
import Skeleton from "@/components/ui/Skeleton"; 

const AnalyticsCardSkeleton = () => {
  return (
    <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full animate-pulse">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <Skeleton className="h-4 w-1/3 rounded" /> {/* Title placeholder */}
        <Skeleton className="h-4 w-5 rounded" />   {/* Icon placeholder */}
      </div>

      <div className="flex flex-col gap-y-2">
        <Skeleton className="h-8 w-2/3 rounded" /> {/* Amount or value */}
        <div className="flex gap-x-2 items-center">
          <Skeleton className="h-6 w-16 rounded-full" /> {/* % chip */}
          <Skeleton className="h-3 w-20 rounded" />       {/* Text: From this week */}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCardSkeleton;