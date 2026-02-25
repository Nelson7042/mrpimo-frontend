"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Backward-compatible redirect from /home/feature-products to /home/collections.
 * The feature-products page has been replaced by the collections page.
 */
export default function FeaturedProductsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home/collections");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Redirecting to collections...</p>
    </div>
  );
}
