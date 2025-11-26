import Skeleton from "@/components/ui/Skeleton";

const RatingDistributionSkeleton = () => {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <Skeleton className="h-5 w-40 mb-4" /> {/* Title */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-4">
            <Skeleton className="h-4 w-6" /> {/* Star label */}
            <Skeleton className="h-3 flex-1 rounded-full" /> {/* Bar */}
            <Skeleton className="h-4 w-8" /> {/* Count */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingDistributionSkeleton;