"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs"
import { useRouter } from "next/navigation"
import { useUserReviews } from "@/hooks/useReviews"
import { Star } from "lucide-react"
import { ComponentLoader } from "@/components/LoadingSpinner"

export default function ReviewsPage() {
  const [page, setPage] = useState(1)
  const limit = 10
  const { reviews, pagination, isLoading, isError } = useUserReviews(page, limit)
  const router = useRouter()

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/home/user" },
    { label: "Reviews", href: null },
  ]

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault()
    if (item.href) {
      router.push(item.href)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    )
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={manualBreadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <h1 className="text-2xl font-bold">My Reviews</h1>
          {!isLoading && !isError && (
            <span className="text-gray-600">
              {pagination.total} {pagination.total === 1 ? "Review" : "Reviews"}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <ComponentLoader text="Loading your reviews..." />
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-red-600 font-medium">Failed to load reviews</p>
          <p className="text-gray-500 text-sm mt-1">
            Something went wrong while fetching your reviews. Please try again later.
          </p>
          <Button
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => setPage(1)}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && reviews.length === 0 && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-600 font-medium text-lg">No reviews yet</p>
          <p className="text-gray-500 text-sm mt-1">
            You haven&apos;t submitted any reviews yet. After purchasing and receiving products, you can leave reviews to help other buyers.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!isLoading && !isError && reviews.length > 0 && (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div className="col-span-4">PRODUCT</div>
              <div className="col-span-2">RATING</div>
              <div className="col-span-4">COMMENT</div>
              <div className="col-span-2">DATE</div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {reviews.map((review) => (
                <div key={review._id} className="p-4">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex space-x-3">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={review.productImage || "/placeholder.svg"}
                          alt={review.productName}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight truncate">
                          {review.productName}
                        </h3>
                        <div className="mt-1">{renderStars(review.rating)}</div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {review.comment}
                    </p>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={review.productImage || "/placeholder.svg"}
                          alt={review.productName}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{review.productName}</h3>
                      </div>
                    </div>
                    <div className="col-span-2">{renderStars(review.rating)}</div>
                    <div className="col-span-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {review.comment}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === page ? "default" : "ghost"}
                    className={
                      pageNum === page
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : ""
                    }
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="text-gray-500">...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
