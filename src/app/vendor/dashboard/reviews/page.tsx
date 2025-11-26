"use client";

import { ArrowDown, ArrowUp, Search, ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import ReviewsTable from "./(components)/ReviewsTable";
import RatingDistribution from "./(components)/RatingDistribution";
import CustomerReviews from "./(components)/CustomerReviews";
import { useVendorReviewAnalytics, useVendorReviews } from "@/hooks/queries";
import FilterByStar from "./(components)/FilterByStar";
import { useAddVendorResponse } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { toastConfigSuccess } from "@/app/config/toast.config";
import ReviewAnalyticsSkeleton from "./(components)/(skeletons)/ReviewAnalyticsSkeleton";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {};

const page = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { vendor } = useVendorStore();
  const { data: reviewAnalytics, isFetching: isFetchingReviewAnalytics } =
    useVendorReviewAnalytics(vendor?._id!);
  const { data: reviews, isFetching } = useVendorReviews(vendor?._id!);
  const { mutate: submitResponse, isPending: isSubmittingResponse } =
    useAddVendorResponse();

  // 🧠 Compute dropdown options only when reviews change
  const options = useMemo(() => {
    if (!reviews) return [];

    const total = reviews.reviews.length;
    let responded = 0;
    let unresponded = 0;

    reviews.reviews.forEach((review: any) => {
      if (review.vendorResponse) responded++;
      else unresponded++;
    });

    return [
      `All reviews (${total})`,
      `Responded (${responded})`,
      `Unresponded (${unresponded})`,
    ];
  }, [reviews]);

  // ✅ Set default selected option once reviews are loaded
  useEffect(() => {
    if (options.length > 0) {
      setSelectedOption(options[0]);
    }
  }, [options]);

  const handleResponseSubmit = (reviewId: string, response: string) => {
    const review = reviews?.reviews?.find((r: any) => r._id === reviewId);
    if (!review) return;

    submitResponse(
      {
        productId: review.productId,
        reviewId,
        vendorId: review.vendorId,
        response,
      },
      {
        onSuccess: () => {
          toast.success("Response submitted successfully!", toastConfigSuccess);
        },
        onError: (error) => {
          toast.error("Failed to submit response");
        },
      }
    );
  };

  const change = reviewAnalytics?.analytics?.totalReview?.change || 0;

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 lg:px-5">
        <div className="flex flex-col-reverse md:flex-row gap-y-4 justify-between items-center mb-5">
          <div className="self-start">
            <h1 className="text-lg font-semibold">Review Overview</h1>
            <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
              Everything in here
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-sm lg:w-md pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search reviews..."
            />
          </div>
        </div>
        {/* Analytics Cards */}
        {isFetchingReviewAnalytics ? (
          <ReviewAnalyticsSkeleton />
        ) : (
          <div className="grid md:grid-cols-8 lg:grid-cols-12 gap-5 mt-5">
            <div className="col-span-4">
              <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
                <div className="flex justify-between mb-4">
                  <p className="font-[family-name:var(--font-poppins)] text-gray-500">
                    Review Ratings
                  </p>
                  <div className="rounded-full size-12.5 bg-gray-200 flex items-center justify-center relative">
                    <div
                      className="rounded-full size-12.5 bg-green-500 flex items-center justify-center absolute"
                      style={{
                        background: `conic-gradient(#22c55e 0deg ${
                          ((reviewAnalytics?.analytics?.averageRating
                            ?.current || 0) /
                            5) *
                          360
                        }deg, #e5e7eb ${
                          ((reviewAnalytics?.analytics?.averageRating
                            ?.current || 0) /
                            5) *
                          360
                        }deg 360deg)`,
                      }}
                    >
                      <div className="rounded-full size-10 bg-white" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-y-2">
                  <p className="font-[family-name:var(--font-alexandria)] text-[#211f1f] font-bold text-xl md:text-2xl lg:text-3xl truncate">
                    {reviewAnalytics?.analytics?.averageRating?.current || 0}
                  </p>
                  <div className="flex gap-x-2 items-center">
                    <div
                      className={`font-[family-name:var(--font-poppins)] text-[#211f1f] px-2 py-1 rounded-full flex items-center ${
                        (reviewAnalytics?.analytics?.averageRating?.change ||
                          0) > 0
                          ? "bg-[#a8ffdc]"
                          : (reviewAnalytics?.analytics?.averageRating
                              ?.change || 0) === 0
                          ? "bg-gray-200"
                          : "bg-red-200"
                      }`}
                    >
                      <ArrowUp size={12} />
                      <div className="text-xs ml-1">
                        {reviewAnalytics?.analytics?.averageRating?.change || 0}
                        %
                      </div>
                    </div>
                    <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
                      Vs last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-4">
              <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
                <div className="flex justify-between mb-4">
                  <p className="font-[family-name:var(--font-poppins)] text-gray-500">
                    All feedbacks
                  </p>
                  <div>
                    <div className="relative h-12">
                      {/* Background track */}
                      <div className="absolute top-2 left-0 h-10 w-2.5 rounded-full bg-gray-300"></div>

                      {/* Animated change bar */}
                      {change !== 0 && (
                        <div
                          className={`absolute left-0 w-2.5 rounded-full transition-all duration-500 ease-in-out ${
                            change > 0 ? "bg-green-700" : "bg-red-500"
                          }`}
                          style={{
                            height: `${Math.min(Math.abs(change) + 20, 100)}%`,
                            top: change > 0 ? "0px" : "auto",
                            bottom: change < 0 ? "0px" : "auto",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-y-2">
                  <p className="font-[family-name:var(--font-alexandria)] text-[#211f1f] font-bold text-xl md:text-2xl lg:text-3xl truncate">
                    {reviewAnalytics?.analytics?.totalReviews?.current || 0}
                  </p>
                  <div className="flex gap-x-2 items-center">
                    <div
                      className={`font-[family-name:var(--font-poppins)] text-[#211f1f] px-2 py-1 rounded-full flex items-center ${
                        (reviewAnalytics?.analytics?.totalReviews?.change ||
                          0) > 0
                          ? "bg-[#a8ffdc]"
                          : (reviewAnalytics?.analytics?.totalReviews?.change ||
                              0) === 0
                          ? "bg-gray-200"
                          : "bg-red-200"
                      }`}
                    >
                      <ArrowUp size={12} />
                      <div className="text-xs ml-1">
                        {reviewAnalytics?.analytics?.totalReviews?.change || 0}%
                      </div>
                    </div>
                    <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
                      {reviewAnalytics?.analytics?.period}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Satisfaction Distribution */}
            <div className="col-span-4">
              <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
                <div className="flex justify-between mb-4">
                  <p className="font-[family-name:var(--font-poppins)] text-gray-500">
                    Average Satisfaction
                  </p>
                </div>
                <div className="mb-3">
                  <div className="relative w-full h-4 rounded-full bg-gray-200 mb-6 overflow-hidden">
                    {(reviewAnalytics?.analytics?.satisfactionDistribution
                      ?.percentages?.["0-33%"] || 0) > 0 && (
                      <div
                        className="absolute h-4 bg-red-500 left-0 top-0"
                        style={{
                          width: `${reviewAnalytics?.analytics?.satisfactionDistribution?.percentages?.["0-33%"]}%`,
                        }}
                      />
                    )}
                    {(reviewAnalytics?.analytics?.satisfactionDistribution
                      ?.percentages?.["34-66%"] || 0) > 0 && (
                      <div
                        className="absolute h-4 bg-yellow-500 top-0"
                        style={{
                          left: `${
                            reviewAnalytics?.analytics?.satisfactionDistribution
                              ?.percentages?.["0-33%"] || 0
                          }%`,
                          width: `${reviewAnalytics?.analytics?.satisfactionDistribution?.percentages?.["34-66%"]}%`,
                        }}
                      />
                    )}
                    {(reviewAnalytics?.analytics?.satisfactionDistribution
                      ?.percentages?.["67-100%"] || 0) > 0 && (
                      <div
                        className="absolute h-4 bg-green-500 top-0"
                        style={{
                          left: `${
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "0-33%"
                            ] || 0) +
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "34-66%"
                            ] || 0)
                          }%`,
                          width: `${reviewAnalytics?.analytics?.satisfactionDistribution?.percentages?.["67-100%"]}%`,
                        }}
                      />
                    )}
                    {(reviewAnalytics?.analytics?.satisfactionDistribution
                      ?.percentages?.["0-33%"] || 0) > 0 && (
                      <p
                        className="absolute text-gray-400 text-xs top-6"
                        style={{
                          left: `${
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "0-33%"
                            ] || 0) / 2
                          }%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {
                          reviewAnalytics?.analytics?.satisfactionDistribution
                            ?.percentages?.["0-33%"]
                        }
                        %
                      </p>
                    )}
                    {(reviewAnalytics?.analytics?.satisfactionDistribution
                      ?.percentages?.["34-66%"] || 0) > 0 && (
                      <p
                        className="absolute text-gray-400 text-xs top-6"
                        style={{
                          left: `${
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "0-33%"
                            ] || 0) +
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "34-66%"
                            ] || 0) /
                              2
                          }%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {
                          reviewAnalytics?.analytics?.satisfactionDistribution
                            ?.percentages?.["34-66%"]
                        }
                        %
                      </p>
                    )}
                    {(reviewAnalytics?.analytics?.satisfactionDistribution
                      ?.percentages?.["67-100%"] || 0) > 0 && (
                      <p
                        className="absolute text-gray-400 text-xs top-6"
                        style={{
                          left: `${
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "0-33%"
                            ] || 0) +
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "34-66%"
                            ] || 0) +
                            (reviewAnalytics?.analytics
                              ?.satisfactionDistribution?.percentages?.[
                              "67-100%"
                            ] || 0) /
                              2
                          }%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {
                          reviewAnalytics?.analytics?.satisfactionDistribution
                            ?.percentages?.["67-100%"]
                        }
                        %
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>High</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-x-2 items-center">
                  <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
                    {reviewAnalytics?.analytics?.period}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <RatingDistribution reviews={reviews} isFetchingReviews={isFetching} />
        {reviews && (
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-lg shadow-sm p-4 mt-5 gap-y-2 lg:items-center">
            <div className="relative lg:col-span-4 xl:col-span-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search reviews"
              />
            </div>
            <div className="lg:col-span-8 xl:col-span-7 lg:ml-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="relative inline-block focus:outline-none focus:ring-1 focus:ring-blue-500">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-between w-48 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                >
                  {selectedOption}
                  <ChevronDown
                    className={`w-4 h-4 ml-2 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && options && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-500 ring-opacity-5">
                    <div className="py-1">
                      {options.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedOption(option);
                            setIsOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                            selectedOption === option
                              ? "text-[#2563EB] font-semibold"
                              : ""
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <FilterByStar
                selectedStar={selectedStar}
                onFilterChange={(star) => {
                  setSelectedStar(star);
                  console.log("Selected Star Rating:", star);
                }}
              />
            </div>
          </div>
        )}
        <CustomerReviews
          reviews={reviews}
          vendor={vendor}
          searchQuery={searchQuery}
          selectedFilter={selectedOption}
          selectedStar={selectedStar}
          isSubmittingResponse={isSubmittingResponse}
          onResponseSubmit={handleResponseSubmit}
          isFetchingReviews={isFetching}
        />
      </div>
    </div>
  );
};

export default page;
