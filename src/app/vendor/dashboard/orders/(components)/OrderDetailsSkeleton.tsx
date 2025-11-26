import Skeleton from "@/components/ui/Skeleton";


export default function OrderDetailsSkeleton() {
  return (
    <div className="bg-white p-4 md:p-4 lg:p-10 h-full w-full">
      {/* Back Button */}
      <Skeleton className="h-4 w-24 mb-4" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-x-4 mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Order Meta Info */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>

      {/* Delivery Card */}
      <div className="bg-white border rounded-[20px] shadow-sm border-gray-300">
        <div className="bg-[#f1f4f9] px-4 py-2 border-b border-gray-300 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="px-4 py-3 space-y-3">
          {/* Status Labels */}
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Progress Bars */}
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Order Items */}
      <section className="mb-4">
        <Skeleton className="h-6 w-40 mt-6 mb-4" />
        {[...Array(2)].map((_, i) => (
          <div className="border-b border-gray-200 py-3" key={i}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <Skeleton className="w-40 h-30 rounded-md" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </section>

      {/* Payment Details */}
      <section className="space-y-4 w-full">
        <Skeleton className="h-6 w-48" />
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div className="flex justify-between items-center" key={i}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}