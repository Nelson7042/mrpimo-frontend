import React from 'react';

const VerificationSkeleton = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 mb-30">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md animate-pulse">
        
        {/* Title Skeleton */}
        <div className="skeleton h-6 w-1/3 bg-gray-300 rounded-full mx-auto"></div>
        
        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="skeleton h-4 w-3/4 bg-gray-300 rounded-full mx-auto"></div>
          <div className="skeleton h-4 w-1/2 bg-gray-300 rounded-full mx-auto"></div>
        </div>

        {/* Code Input Skeleton */}
        <div className="space-y-2">
          <div className="skeleton h-4 w-1/4 bg-gray-300 rounded-full"></div>
          <div className="skeleton h-10 w-full bg-gray-300 rounded-lg"></div>
        </div>

        {/* Verify Button Skeleton */}
        <div className="skeleton h-10 w-full bg-gray-300 rounded-lg"></div>

        {/* Expiration Notice Skeleton */}
        <div className="skeleton h-4 w-1/2 bg-gray-300 rounded-full mx-auto"></div>

        {/* Resend Link Skeleton */}
        <div className="skeleton h-4 w-1/3 bg-gray-300 rounded-full mx-auto"></div>

      </div>
    </div>
  );
};

export default VerificationSkeleton;
