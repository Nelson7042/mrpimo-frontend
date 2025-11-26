"use client";

import Skeleton from "@/components/ui/Skeleton";


const OrderTableSkeleton = () => {
  return (
    <div className="mt-8 rounded-lg shadow-sm">
      {/* Filters */}
      <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-4 p-5 border-b border-gray-200 bg-white text-xs">
        <Skeleton className="col-span-6 h-10 w-full rounded-md" />
        <Skeleton className="col-span-3 h-10 w-full rounded-md" />
        <Skeleton className="col-span-3 h-10 w-full rounded-md" />
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto mt-5 shadow-md">
        <table className="min-w-full bg-white text-xs">
          <thead>
            <tr className="bg-[#f2f7ff] text-black">
              {[
                "Order ID",
                "Customer",
                "Amount",
                "Date",
                "Address",
                "Status",
                "Items",
                "Action",
              ].map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {[...Array(8)].map((_, j) => (
                  <td key={j} className="px-4 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border rounded-lg p-4 shadow-sm space-y-2"
          >
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-28" />
            <div className="mt-3 flex justify-end">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTableSkeleton;