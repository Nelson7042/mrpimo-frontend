"use client";

import { useState, useRef, useEffect } from "react";

interface TOSAcceptanceProps {
  initialData: Record<string, any>;
  onNext: (data: Record<string, any>) => void;
  onBack: () => void;
  isLast: boolean;
}

export default function TOSAcceptance({
  initialData,
  onNext,
  onBack,
  isLast,
}: TOSAcceptanceProps) {
  const [acceptTerms, setAcceptTerms] = useState(initialData.acceptTerms || false);
  const [error, setError] = useState("");
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToEnd(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }
    // Backend will capture IP and date
    onNext({ acceptTerms: true });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms of Service</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto"
        >
          <h4 className="font-semibold text-lg mb-3">Stripe Connected Account Agreement</h4>
          
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              By creating a Stripe Connected Account, you agree to comply with Stripe's 
              Terms of Service and the Stripe Connected Account Agreement. This includes:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Providing accurate and complete information about your business</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Maintaining the security of your account credentials</li>
              <li>Authorizing Stripe to verify your information through third parties</li>
              <li>Accepting Stripe's pricing and fee structure for payment processing</li>
              <li>Understanding that payouts may be delayed for verification purposes</li>
              <li>Agreeing to Stripe's data processing and privacy policies</li>
            </ul>
            
            <p className="font-semibold mt-4">
              Important Notes:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must be at least 18 years old to create an account</li>
              <li>You must have a valid bank account for payouts</li>
              <li>You are responsible for understanding and complying with local regulations</li>
              <li>Stripe may require additional verification documents</li>
            </ul>
            
            <p className="mt-4">
              By ticking the box below, you acknowledge that you have read, understood, 
              and agree to be bound by these terms and conditions.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              if (error) setError("");
            }}
            disabled={!hasScrolledToEnd}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="acceptTerms" className={`text-sm ${hasScrolledToEnd ? 'text-gray-700' : 'text-gray-400'}`}>
            I have read and agree to the Stripe Connected Account Agreement, 
            Terms of Service, and Privacy Policy. I confirm that all information 
            provided is accurate and complete.
            {!hasScrolledToEnd && <span className="block text-xs text-blue-600 mt-1">Please scroll to the end to enable</span>}
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-400"
          >
            Back
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
          >
            {isLast ? "Complete Verification" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
