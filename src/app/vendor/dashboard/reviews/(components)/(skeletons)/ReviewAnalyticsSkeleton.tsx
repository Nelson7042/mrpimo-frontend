import Skeleton from "@/components/ui/Skeleton";

const ReviewAnalyticsSkeleton = () => {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Card 1: Review Ratings */}
      <div className="col-span-12 md:col-span-4">
        <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="flex flex-col gap-y-2">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-x-2 items-center">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: All Feedbacks */}
      <div className="col-span-12 md:col-span-4">
        <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-4 rounded-full" />
          </div>
          <div className="flex flex-col gap-y-2">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-x-2 items-center">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Average Satisfaction */}
      <div className="col-span-12 md:col-span-4">
        <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
          <div className="mb-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mb-5 h-12">
            <Skeleton className="h-4 w-full rounded-full" />
            <div className="flex justify-between mt-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <div className="flex gap-x-2 items-center">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAnalyticsSkeleton;