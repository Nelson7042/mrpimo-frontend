"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import map component to avoid SSR issues
const GoogleTrackingMap = dynamic(() => import("@/components/tracking/GoogleTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

interface TrackingStep {
  title: string;
  description: string;
  date: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export default function TrackOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [copied, setCopied] = useState(false);
  
  // Get Google Maps API key from environment variable
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  // Mock data - replace with actual API call
  const orderData = {
    orderId: `#${orderId}`,
    address: "12 New York Street, Abuja",
    status: "In Progress",
    statusColor: "text-yellow-600",
    product: "Samsung 98 Inches Smart Tv",
    date: "12th-18th August",
    trackingSteps: [
      {
        title: "Package Sorting",
        description: "Package is currently been sorted",
        date: "07-08-2024",
        time: "12:34pm",
        completed: true,
        active: false,
      },
      {
        title: "Package on the way",
        description: "Package left the store",
        date: "08-09-2024",
        time: "11:34am",
        completed: true,
        active: true,
      },
      {
        title: "Package arrived",
        description: "Package arrived at the local logistics",
        date: "10-09-2024",
        time: "05:34pm",
        completed: false,
        active: false,
      },
      {
        title: "Package out for delivery",
        description: "Package on the way to address",
        date: "11-09-2024",
        time: "10:34am",
        completed: false,
        active: false,
      },
      {
        title: "Package Delivered",
        description: "Package on the way to address",
        date: "13-07-2024",
        time: "12:34 pm",
        completed: false,
        active: false,
      },
    ],
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate current step based on completed steps
  const currentStep = orderData.trackingSteps.filter(step => step.completed).length;
  const totalSteps = orderData.trackingSteps.length;

  return (
    <div className="min-h-screen bg-gray-50 relative z-0">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 relative z-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/home")}>
            Home
          </span>
          <span>›</span>
          <span className="hover:text-blue-600 cursor-pointer">Pages</span>
          <span>›</span>
          <span className="text-blue-600 font-medium">Track</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-12">
          {/* Left Panel - Order Details & Timeline (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-4 pb-3">
              Track Order
            </h1>

            {/* Order Info */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs text-gray-600 whitespace-nowrap">Order ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-gray-900">{orderData.orderId}</span>
                  <button
                    onClick={copyOrderId}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    {copied ? (
                      <Check size={12} className="text-green-600" />
                    ) : (
                      <Copy size={12} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-start gap-3">
                <span className="text-xs text-gray-600 whitespace-nowrap">Address:</span>
                <span className="font-medium text-xs text-gray-900 text-right">{orderData.address}</span>
              </div>

              <div className="flex justify-between items-start gap-3">
                <span className="text-xs text-gray-600 whitespace-nowrap">Status:</span>
                <span className={`font-semibold text-xs ${orderData.statusColor}`}>{orderData.status}</span>
              </div>

              <div className="flex justify-between items-start gap-3">
                <span className="text-xs text-gray-600 whitespace-nowrap">Product:</span>
                <span className="font-medium text-xs text-gray-900 text-right">{orderData.product}</span>
              </div>

              <div className="flex justify-between items-start gap-3">
                <span className="text-xs text-gray-600 whitespace-nowrap">Date:</span>
                <span className="font-medium text-xs text-gray-900">{orderData.date}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative bg-[#E2E8F0] w-full px-4 py-3 rounded-md">
              {orderData.trackingSteps.map((step, index) => (
                <div key={index} className="relative pb-5 last:pb-0">
                  {/* Vertical Line */}
                  {index !== orderData.trackingSteps.length - 1 && (
                    <div
                      className={`absolute left-[11px] top-6 w-0.5 h-full border-l-2 border-dashed ${
                        step.completed ? "border-blue-600" : "border-gray-300"
                      }`}
                    />
                  )}

                  {/* Step Content */}
                  <div className="flex gap-2.5">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        step.active
                          ? "bg-blue-600 ring-4 ring-blue-100"
                          : step.completed
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    >
                      {step.completed || step.active ? (
                        <Check size={12} className="text-white" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>

                    {/* Details */}
                    <div
                      className={`flex-1 ${
                        !step.completed && !step.active ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-xs text-gray-900 mb-1">{step.title}</h3>
                          <p className="text-[11px] text-gray-600">{step.description}</p>
                        </div>
                        <div className="ml-2">
                          <p className="text-[10px] text-gray-500 mb-1 whitespace-nowrap ">{step.date}</p>
                          <p className="text-[10px] text-gray-500">{step.time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Map & Buttons (2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Map Container */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-3 h-full relative z-0 overflow-hidden">
              {GOOGLE_MAPS_API_KEY ? (
                <GoogleTrackingMap
                  origin={{ 
                    lat: 9.0765, 
                    lng: 7.3986,
                    address: "11 New York Street",
                    city: "Abuja",
                    state: "FCT",
                    country: "NG"
                  }}
                  destination={{ 
                    lat: 9.0820, 
                    lng: 7.4200,
                    address: "232 Abuja Street",
                    city: "Abuja",
                    state: "FCT",
                    country: "NG"
                  }}
                  currentLocation={{ lat: 9.0790, lng: 7.4100 }}
                  apiKey={GOOGLE_MAPS_API_KEY}
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-center p-6">
                    <div className="text-4xl mb-3">🗺️</div>
                    <p className="text-gray-700 font-medium mb-2">Google Maps API Key Required</p>
                    <p className="text-xs text-gray-600 max-w-sm">
                      Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Below Map */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/home")}
                className="flex-1 bg-blue-600 text-white px-6 py-2.5 text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 bg-white text-orange-500 border border-orange-200 px-6 py-2.5 text-sm rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
