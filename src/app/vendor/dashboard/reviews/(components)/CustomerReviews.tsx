"use client";

import { useUserStore } from "@/stores/useUserStore";
import {
  Star,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
  Loader,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import ResponseModal from "./ResponseModal";
import { useToggleHelpful } from "@/hooks/mutations";
import CustomerReviewsSkeleton from "./(skeletons)/CustomerReviewsSkeleton";

interface CustomerReviewsProps {
  reviews: any;
  vendor: any;
  searchQuery?: string;
  selectedFilter?: string;
  selectedStar?: number | null;
  isSubmittingResponse: boolean;
  onResponseSubmit?: (reviewId: string, response: string) => void;
  isFetchingReviews: boolean;
}

const CustomerReviews = ({
  reviews,
  vendor,
  searchQuery = "",
  selectedFilter = "",
  selectedStar,
  isSubmittingResponse,
  onResponseSubmit,
  isFetchingReviews
}: CustomerReviewsProps) => {
  const { user } = useUserStore();
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const { mutate: toggleHelpful, isPending: isTogglingHelpful } =
    useToggleHelpful();

  // Filter and search reviews
  const filteredReviews = useMemo(() => {
    if (!reviews?.reviews) return [];

    let filtered = reviews.reviews;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (review: any) =>
          review.productName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          review.review.comment
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          review.review.reviewer.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Filter by response status
    if (selectedFilter.includes("Responded")) {
      filtered = filtered.filter(
        (review: any) => review.review.reviewerComment
      );
    } else if (selectedFilter.includes("Unresponded")) {
      filtered = filtered.filter(
        (review: any) => !review.review.reviewerComment
      );
    }

    // Filter by star rating
    if (selectedStar !== null) {
      filtered = filtered.filter(
        (review: any) => review.review.rating === selectedStar
      );
    }

    return filtered;
  }, [reviews, searchQuery, selectedFilter, selectedStar]);

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, selectedStar]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleToggleHelpful = (reviewId: string) => {
    const review = filteredReviews.find((r: any) => r._id === reviewId);
    if (!review) return;

    toggleHelpful({ productId: review.productId, reviewId });
  };

  if (isFetchingReviews) {
    return (<CustomerReviewsSkeleton />)
  }


  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-2">
        {currentReviews.map((review: any) => (
          <div
            key={review._id}
            className="border-b border-gray-100 pb-2 last:border-b-0"
          >
            {/* Product Details */}
            <div className="flex items-center gap-2 mb-4">
              <img
                src={review.productImage || "/placeholder.png"}
                alt={review.productName}
                className="w-16 h-16 object-cover rounded flex-shrink-0"
              />
              <div className="">
                <h3 className="text-base text-sm md:text-lg font-semibold line-clamp-2">
                  {review.productName}
                </h3>
                <div className="flex gap-x-2 items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`text-sm ${
                        i < review.review.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      size={14}
                      fill="currentColor"
                      stroke="none"
                      strokeWidth={0}
                      aria-label={`Star ${i + 1}`}
                      role="img"
                      data-testid={`star-${i + 1}`}
                      data-rating={i + 1}
                      data-selected={
                        i < review.review.rating ? "true" : "false"
                      }
                    />
                  ))}
                  <span className="text-xs">({review.review.rating} / 5) </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {review.review.reviewer.name.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {review.review.reviewer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.review.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {review.review.comment}
              </p>
              {review.review.reviewerComment && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>user Response:</strong>{" "}
                    {review.review.reviewerComment}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.review.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </p>
                </div>
              )}
              <hr className="my-2 border-gray-300" />
              <div className="flex mt-2 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleToggleHelpful(review._id)}
                    className={`flex items-center gap-x-1 px-3 py-1 rounded-md border transition-all duration-200 cursor-pointer bg-white text-gray-700 border-gray-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isTogglingHelpful}
                    aria-label="Mark as helpful"
                    data-testid={`helpful-button-${review._id}`}
                  >
                    <ThumbsUp
                      className="text-blue-500"
                      size={16}
                      strokeWidth={1.5}
                      fill={
                        review.review.helpful.includes(user?._id)
                          ? "currentColor"
                          : "none"
                      }
                      stroke={
                        review.review.helpful.includes(user?._id)
                          ? "none"
                          : "currentColor"
                      }
                      aria-label="Mark as helpful"
                      data-testid={`helpful-${review._id}`}
                    />
                  </button>

                  <span className="text-xs text-gray-600">
                    {review.review.helpfulCount} Helpful
                  </span>
                </div>
                {review.vendorId === vendor._id && (
                  <button
                    onClick={() => {
                      if (!review.review.reviewerComment) {
                        setSelectedReview(review);
                        setIsModalOpen(true);
                      } else {
                        // onResponseSubmit?.(review.review._id, "");
                      }
                    }}
                    className={`flex items-center px-3 py-1 rounded-md border transition-all duration-200 cursor-pointer bg-white text-gray-700 border-gray-300 hover:bg-blue-50`}
                  >
                    {isSubmittingResponse ? (
                      <span className="animate-spin">
                        <Loader size={18} />
                      </span>
                    ) : (
                      <>
                        <MessageCircleMore size={18} />
                        <span className="text-xs ml-1">
                          {review.review.reviewerComment
                            ? "Remove Response"
                            : "Respond to Review"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>
              {reviews?.reviews?.length === 0
                ? "No reviews yet"
                : "No reviews match your filters"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredReviews.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 ">
            <div className="text-sm text-gray-600">
              {totalPages <= 1
                ? `Showing ${filteredReviews.length} of ${filteredReviews.length} reviews`
                : `Showing ${startIndex + 1}-${Math.min(
                    endIndex,
                    filteredReviews.length
                  )} of ${filteredReviews.length} reviews`}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        <ResponseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReview(null);
          }}
          review={selectedReview?.review || {}}
          onSubmit={(response) => {
            onResponseSubmit?.(selectedReview._id, response);
          }}
        />
      </div>
    </div>
  );
};

export default CustomerReviews;
