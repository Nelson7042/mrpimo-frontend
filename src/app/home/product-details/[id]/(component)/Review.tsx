import React, { JSX, useState, useMemo } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { ProductType } from '@/types/product.type';
import { format } from 'date-fns';

type ReviewsProps = {
  product: ProductType;
};

export default function ReviewsPage({product}: ReviewsProps) {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const timeFilters = ['All time', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last year'];

  // Calculate review statistics from actual product data
  const reviewData = useMemo(() => {
    const reviews = product?.reviews || [];
    const totalReviews = reviews.length;
    const averageRating = product?.rating || 0;

    // Calculate rating breakdown
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review: any) => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating as keyof typeof ratingCounts]++;
      }
    });

    const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      percentage: totalReviews > 0 ? Math.round((ratingCounts[stars as keyof typeof ratingCounts] / totalReviews) * 100) : 0
    }));

    return {
      averageRating,
      totalReviews,
      ratingBreakdown
    };
  }, [product]);

  const reviews = useMemo(() => {
    return (product?.reviews || []).map((review: any) => ({
      id: review._id || review.id,
      rating: review.rating,
      author: review.userId?.profile?.firstName || review.userId?.email?.substring(0, 1) + '****' + review.userId?.email?.slice(-1) || 'Anonymous',
      date: review.createdAt ? format(new Date(review.createdAt), 'dd MMMM yyyy') : 'N/A',
      comment: review.comment || 'No comment provided'
    }));
  }, [product]);

interface RenderStarsProps {
    rating: number;
    size?: string;
}

const renderStars = (rating: number, size: string = 'w-4 h-4'): JSX.Element => {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star: number) => (
                <Star
                    key={star}
                    className={`${size} ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
};

interface RenderOverallStarsProps {
    rating: number;
}

const renderOverallStars = (rating: RenderOverallStarsProps['rating']): JSX.Element => {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star: number) => (
                <Star
                    key={star}
                    className={`w-5 h-5 ${
                        star <= Math.floor(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
};

  if (!product || !product.reviews || product.reviews.length === 0) {
    return (
      <div className="md:px-[42px] lg:px-[80px] px-4 mt-5 md:mt-7 lg:mt-8">
        <div className="text-center py-8">
          <h2 className="font-roboto text-sm font-bold text-gray-900 mb-2">Reviews</h2>
          <p className="font-roboto text-xs text-gray-600">No reviews yet. Be the first to review this product!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="  mt-4 md:mt-7 lg:mt-8  ">
      <div className="">
        {/* Header */}
        <div className="mb-2 md:mb-4">
          <h1 className="font-roboto text-sm font-bold text-gray-900">Reviews</h1>
        </div>

        {/* Customer Reviews Summary */}
        <div className="mb-2 md:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between md:mb-4">
            <h2 className="font-roboto text-xs font-semibold text-gray-900 mb-2 sm:mb-0">Customer reviews</h2>
            <div className="flex items-center space-x-2">
              {renderOverallStars(reviewData.averageRating)}
              <span className="font-roboto text-xs font-medium text-gray-900">
                {reviewData.averageRating} out of 5
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-roboto text-xs text-gray-600">{reviewData.totalReviews} product feedback</span>
          </div>
        </div>

        {/* Feedback History */}
        <div className="mb-2 md:mb-4">
          <div className="flex flex-row items-center justify-between mb-6">
            <h3 className="font-roboto text-xs font-semibold text-gray-900">Feedback history</h3>
            
            {/* Time Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="font-roboto flex items-center justify-between w-full sm:w-40 px-4 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
              >
                <span>{selectedTimeFilter}</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 z-10 w-full sm:w-40 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setSelectedTimeFilter(filter);
                        setIsDropdownOpen(false);
                      }}
                      className="font-roboto block w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-3">
            {reviewData.ratingBreakdown.map((item) => (
              <div key={item.stars} className="flex items-center space-x-2 md:space-x-4">
                <div className="flex items-center space-x-1 w-6 md:w-12">
                  <span className="font-roboto text-xs text-gray-700">{item.stars}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-md">
                  <div
                    className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                
                <span className="font-roboto text-xs text-gray-700 w-8 text-right">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="space-y-3 md:space-y-6">
          {reviews.map((review: any) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="mb-2 sm:mb-0">
                  {renderStars(review.rating)}
                </div>
                <div className="font-roboto flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-600">
                  <span>By {review.author}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{review.date}</span>
                </div>
              </div>
              
              <p className="font-roboto text-xs text-gray-800 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}