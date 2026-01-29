"use client";

import React, { useState } from "react";
import { ArrowRight, Copy, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      router.push(`/home/track-order/${orderId}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="hover:text-blue-600 cursor-pointer">Home</span>
          <span>›</span>
          <span className="hover:text-blue-600 cursor-pointer">Pages</span>
          <span>›</span>
          <span className="text-blue-600 font-medium">Track</span>
        </nav>

        {/* Main Content */}
        <div className="max-w-2xl">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            Track Order
          </h1>
          
          <p className="text-sm text-gray-600 mb-6">
            To track your order please enter your order ID in the input field below and press the "Track Order" button.
          </p>

          <form onSubmit={handleTrackOrder} className="space-y-4">
            {/* Flex Container for Inputs */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Order ID Input */}
              <div className="flex-1">
                <label htmlFor="orderId" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Order ID
                </label>
                <input
                  type="text"
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your Order ID"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="flex-1">
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Track Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex mt-10 items-center gap-2 bg-blue-600 text-white px-6 py-2.5 text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Tracking..." : "Track Now"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
