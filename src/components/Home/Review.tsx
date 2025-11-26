"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Review {
  id: number
  name: string
  avatar: string
  content: string
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Joy Chinedu",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "I have been using Mbrimo for a year now, and it has transformed the way I manage my shopping experience, and the ability to sell my item",
  },
  {
    id: 2,
    name: "Joy Chinedu",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "You have been using Mbrimo for a year now, and it has transformed the way I manage my shopping experience, and the ability to sell my item",
  },
  {
    id: 3,
    name: "Joy Chinedu",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "I have been using Mbrimo for a year now, and it has transformed the way I manage my shopping experience, and the ability to sell my item",
  },
]

export default function CustomerReviews() {
  const [currentIndex, setCurrentIndex] = useState(1) // Start with middle review

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length)
  }

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  const goToReview = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-14 lg:py-18">
      <div className="text-center mb-12 lg:mb-16">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Customer Reviews</h2>
      </div>

        <div className="relative ">
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevReview}
              className="absolute left-0 z-10 w-12 h-12 rounded-full bg-black text-white hover:bg-gray-800 hidden lg:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex items-center justify-center w-full overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out w-full">
                {reviews.map((review, index) => {
                  const isActive = index === currentIndex
                  const isPrev = index === (currentIndex - 1 + reviews.length) % reviews.length
                  const isNext = index === (currentIndex + 1) % reviews.length

                  let cardClasses = "transition-all duration-500 flex-shrink-0 px-4"

                  if (isActive) {
                    cardClasses += " w-full lg:w-[45%] opacity-100 scale-100"
                  } else if (isPrev || isNext) {
                    cardClasses += " w-0 lg:w-[27.5%] opacity-0 lg:opacity-60 scale-90 hidden lg:block"
                  } else {
                    cardClasses += " w-0 opacity-0 scale-75 hidden"
                  }

                  return (
                    <div key={review.id} className={cardClasses}>
                      <div
                        className={`rounded-md p-4 md:p-6 lg:p-10 text-center  flex flex-col ${
                          isActive ? "bg-[#D0D7E2] shadow-lg" : "bg-gradient-to-br flex from-[#3B73ED] to-[#e5eaf0]"
                        }`}
                      >
                        <div className="mb-6">
                          <span className="text-4xl lg:text-5xl text-blue-500 font-serif">"</span>
                        </div>

                        <blockquote className="text-lg lg:text-xl text-gray-800 leading-relaxed mb-8 font-medium">
                          {review.content}
                        </blockquote>

                        <div className="flex flex-col items-center space-y-4">
                          <Avatar className="w-16 h-16 lg:w-20 lg:h-20">
                            <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.name} />
                            <AvatarFallback className="text-lg font-semibold">
                              {review.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <h4 className="text-lg lg:text-xl font-semibold text-gray-900">{review.name}</h4>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextReview}
              className="absolute right-0 z-10 w-12 h-12 rounded-full bg-black text-white hover:bg-gray-800 hidden lg:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex justify-center space-x-4 mt-8 lg:hidden">
            <Button variant="outline" size="icon" onClick={prevReview} className="w-10 h-10 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextReview} className="w-10 h-10 rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex justify-center space-x-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToReview(index)}
                className={`w-4 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-blue-500 scale-125" : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
    </section>
  )
}
