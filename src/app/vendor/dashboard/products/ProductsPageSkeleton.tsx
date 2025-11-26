import React from 'react';

const ProductsPageSkeleton = () => {
  return (
    <div className="bg-[#f6f6f6] font-[family-name:var(--font-alexandria)]" style={{ height: "calc(100vh - 100px)" }}>
      <div className="p-4 md:p-4 lg:p-10 h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-4 md:gap-0">
          <div className="w-full md:w-auto">
            {/* Tabs Skeleton */}
            <div className="flex gap-x-2 lg:gap-x-4 items-center mb-1">
              <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-3 bg-gray-300 rounded w-64 animate-pulse"></div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-300 rounded w-28 animate-pulse"></div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="h-10 bg-gray-300 rounded w-full md:w-64 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Table Rows */}
          {[...Array(8)].map((_, index) => (
            <div key={index} className="border-b border-gray-100 p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Product Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                
                {/* Price */}
                <div className="col-span-2">
                  <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                </div>
                
                {/* Stock */}
                <div className="col-span-2">
                  <div className="h-4 bg-gray-300 rounded w-12 animate-pulse"></div>
                </div>
                
                {/* Status */}
                <div className="col-span-2">
                  <div className="h-6 bg-gray-300 rounded-full w-20 animate-pulse"></div>
                </div>
                
                {/* Actions */}
                <div className="col-span-2">
                  <div className="h-8 bg-gray-300 rounded w-8 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPageSkeleton;