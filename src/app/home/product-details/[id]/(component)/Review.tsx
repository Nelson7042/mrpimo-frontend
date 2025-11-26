import React, { JSX, useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { ProductType } from '@/types/product.type';

type ReviewsProps = {
  product: ProductType;
};

export default function ReviewsPage({product}: ReviewsProps) {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const timeFilters = ['All time', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last year'];

  const reviewData = {
    averageRating: 4.2,
    totalReviews: 125,
    ratingBreakdown: [
      { stars: 5, percentage: 69 },
      { stars: 4, percentage: 16 },
      { stars: 3, percentage: 7 },
      { stars: 2, percentage: 5 },
      { stars: 1, percentage: 3 }
    ]
  };

  const reviews = [
    {
      id: 1,
      rating: 5,
      author: "u****e",
      date: "31 November 2017",
      comment: "I'm happy with my item but the item arrived too late. So I'm not sure whether to do business with this seller"
    },
    {
      id: 2,
      rating: 5,
      author: "u****e",
      date: "31 November 2017",
      comment: "I'm happy with my item but the item arrived too late. So I'm not sure whether to do business with this seller"
    }
  ];

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

  if (product?.inventory?.listing.type !== "auction") {
    return null;
  }

  return (
    <div className="md:px-[42px] lg:px-[80px] px-4  mt-5 md:mt-7 lg:mt-8  ">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
        </div>

        {/* Customer Reviews Summary */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Customer reviews</h2>
            <div className="flex items-center space-x-2">
              {renderOverallStars(reviewData.averageRating)}
              <span className="text-lg font-medium text-gray-900">
                {reviewData.averageRating} out of 5
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">{reviewData.totalReviews} product feedback</span>
          </div>
        </div>

        {/* Feedback History */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Feedback history</h3>
            
            {/* Time Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full sm:w-40 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
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
              <div key={item.stars} className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-700">{item.stars}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                
                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-md">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                
                <span className="text-sm text-gray-700 w-8 text-right">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="mb-2 sm:mb-0">
                  {renderStars(review.rating)}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600">
                  <span>By {review.author}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{review.date}</span>
                </div>
              </div>
              
              <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-8 text-center">
          <button className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            Load more reviews
          </button>
        </div>
      </div>
    </div>
  );
}