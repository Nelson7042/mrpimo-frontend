"use client";

import { Button } from "@/components/ui/button";

export default function Cta() {
  return (
    <section className="w-full bg-gradient-to-r from-blue-600 to-blue-500 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-7 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-white py-8 md:py-14 lg:py-18">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-4 md:mb-6">
              Enjoy Maximum Shopping Experience Today
            </h1>
            <p className="text-sm md:text-base lg:text-base text-blue-100 leading-relaxed mb-4 md:mb-8">
              Search, buy and sell your product in any part of the world with us
            </p>
            <div className="md:pt-2">
              <Button
                size="lg"
                className="bg-white text-black  hover:bg-gray-50 text-lg px-8 md:px-14 py-2 md:py-3 rounded-md font-normal transition-all duration-300 hover:scale-105"
              >
                Shop Now
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
              <img
                src="/images/womanShop.png"
                alt="Happy woman shopping with phone and bags"
                className="h-28 w-full object-contain md:object-cover
                md:h-auto md:w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute hidden lg:block top-0 right-0 w-32 h-32 bg-blue-400 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
      <div className="absolute  hidden lg:block bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full opacity-20 translate-y-12 -translate-x-12"></div>
    </section>
  );
}
