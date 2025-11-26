"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCountryVerification } from "@/hooks/useCountryVerification";
import { useUserStore } from "@/stores/useUserStore";
import countryNameToISO from "@/utils/countryNameToISO";

export default function VerificationRouter() {
  const router = useRouter();
  const { user } = useUserStore();
  const { data, isLoading } = useCountryVerification();

  useEffect(() => {
    if (user) {
      console.log('User country:', user.country);
      console.log(countryNameToISO[user.country])
      router.push(`/vendor/verification/${countryNameToISO[user.country]}`);
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to verification...</p>
      </div>
    </div>
  );
}
