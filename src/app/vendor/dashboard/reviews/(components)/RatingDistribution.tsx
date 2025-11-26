import React from 'react';
import RatingDistributionSkeleton from './(skeletons)/RatingDistributionSkeleton';
import { Star } from 'lucide-react';

interface RatingDistributionProps {
  reviews: any;
  isFetchingReviews?: boolean;
}

const RatingDistribution = ({ reviews, isFetchingReviews }: RatingDistributionProps) => {

  if (isFetchingReviews) {
    return (
      <RatingDistributionSkeleton />
    );
  }
  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews?.ratingDistribution?.[star] || 0;
          const total = reviews?.pagination?.total || 1;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-6">
                <span className="text-sm font-medium">{star}</span>
                <Star size={18} className='text-yellow-500 fill-yellow-500'/>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingDistribution;