// app/not-found.tsx
"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

export default function NotFound() {

  const router = useRouter();

  const handleGoBack = () => {
    router.back()
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4 font-[family-name:var(--font-alexandria)]">
        <div className="relative animate-fade-in">
          <div className="w-40 h-40 mx-auto rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <span className="text-white text-7xl font-bold">404</span>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold">Page Not Found</h1>
        <p className="text-xs  text-gray-600">
          This page is on vacation, but our store is open 24/7. Explore our
          latest products and grab a deal
        </p>
        <div className="flex justify-between gap-x-5">
          <Link href="/" className="w-[50%]">
            <button className="mt-2 w-full inline-flex items-center cursor-pointer justify-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg shadow hover:bg-[#3d6ee6] transition duration-300">
              <Home size={20} /> Home
            </button>
          </Link>
          <button
            onClick={handleGoBack}
            className="mt-2 w-[50%] inline-flex items-center justify-center cursor-pointer px-5 py-2.5 text-sm font-semibold text-white bg-secondary rounded-lg shadow hover:bg-[#3d6ee6] transition duration-300"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
      </div>
    </div>
  );
}
