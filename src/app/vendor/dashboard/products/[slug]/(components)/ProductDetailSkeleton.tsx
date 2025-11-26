import { ArrowLeftIcon, Trash } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton"; // Adjust path as needed

const ProductDetailSkeleton = () => {
  return (
    <div className="bg-white rounded-lg p-4 text-primary">
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-7 flex flex-col gap-y-5">
          {/* Product Details */}
          <div className="rounded-lg border border-gray-200 p-4 text-sm">
            <div className="flex gap-x-2 items-center mb-2">
              <ArrowLeftIcon className="text-gray-400" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            <div className="mt-2 bg-gray-200 h-[280px] rounded-md flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-md" />
            </div>

            <div className="flex mt-4 items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>

            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>

          {/* Analytics Section */}
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5">
          <div className="flex justify-end mb-4">
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>

          {/* Product Information */}
          <div className="border border-gray-200 rounded-lg mb-12">
            <Skeleton className="py-4 px-8 w-40" />
            <div className="px-2 py-4 flex flex-col gap-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>

          {/* Sales Summary */}
          <div className="border border-gray-200 rounded-lg">
            <Skeleton className="py-4 px-8 w-40" />
            <div className="px-2 py-8 pb-12 flex flex-col gap-y-3">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;