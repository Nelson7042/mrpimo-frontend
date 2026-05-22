"use client"

import { useRef } from "react"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Skeleton from "@/components/ui/Skeleton"
import { useFeaturedReviews } from "@/hooks/useReviews"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"

function ReviewsLoadingSkeleton() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
      <div className="text-center mb-8">
        <Skeleton className="h-7 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  )
}

function ReviewStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={12}
          className={`${
            index < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : index < rating
              ? "fill-yellow-200 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
]

export default function CustomerReviews() {
  const { reviews, isLoading, isError } = useFeaturedReviews()
  const swiperRef = useRef<any>(null)

  if (isLoading) {
    return <ReviewsLoadingSkeleton />
  }

  if (isError || reviews.length === 0) {
    return null
  }

  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
      <div className="text-center mb-8">
        <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-gray-900">Customer Reviews</h2>
      </div>

      {/* Mobile: Swiper */}
      <div className="lg:hidden">
        <Swiper
          ref={swiperRef}
          spaceBetween={16}
          slidesPerView={1.2}
          breakpoints={{
            480: { slidesPerView: 1.5 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 2.5 },
          }}
        >
          {reviews.map((review, index) => {
            const initials = review.reviewerName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)

            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

            return (
              <SwiperSlide key={review._id}>
                <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm min-w-[280px]">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewerAvatar || ""} alt={review.reviewerName} />
                      <AvatarFallback className={`${avatarColor} text-white text-sm font-semibold`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{review.reviewerName}</h4>
                      <ReviewStarRating rating={review.rating} />
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3">{review.comment}</p>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>

      {/* Desktop: Grid showing 3 cards */}
      <div className="hidden lg:grid grid-cols-3 gap-4 sm:gap-6">
        {reviews.slice(0, 3).map((review, index) => {
          const initials = review.reviewerName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)

          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

          return (
            <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm min-w-[280px]">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.reviewerAvatar || ""} alt={review.reviewerName} />
                  <AvatarFallback className={`${avatarColor} text-white text-sm font-semibold`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{review.reviewerName}</h4>
                  <ReviewStarRating rating={review.rating} />
                </div>
              </div>
              <p className="text-gray-600 text-sm line-clamp-3">{review.comment}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
