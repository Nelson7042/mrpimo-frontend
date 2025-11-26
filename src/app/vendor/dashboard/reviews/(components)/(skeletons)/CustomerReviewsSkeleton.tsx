import Skeleton from "@/components/ui/Skeleton";

const CustomerReviewsSkeleton = () => {
  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
            {/* Product Details */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-16 h-16 rounded object-cover" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>

            {/* Review Card */}
            <div className="flex flex-col bg-gray-50 p-4 rounded-lg space-y-4">
              {/* Reviewer Info */}
              <div className="flex items-center gap-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>

              {/* Review Text */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />

              {/* Optional Response */}
              <div className="mt-2 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerReviewsSkeleton;