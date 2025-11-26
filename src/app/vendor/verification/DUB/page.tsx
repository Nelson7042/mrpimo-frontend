"use client";

import { useState, useEffect } from "react";
import { StripeAccountData, VerificationStep } from "@/types/stripe.type";
import { useUserStore } from "@/stores/useUserStore";
import { useCountryVerification } from "@/hooks/useCountryVerification";
import { getCountryConfig } from "@/config/countryVerificationFields";
import StripeAccountCreation from "./(components)/StripeAccountCreation";
import IdentityVerification from "../[country]/(components)/IdentityVerification";
import BusinessVerification from "../[country]/(components)/BusinessVerification";

export default function NigerianVendorVerification() {
  const { user } = useUserStore();
  const { data: countryData, isLoading } = useCountryVerification();
  const [currentStep, setCurrentStep] =
    useState<VerificationStep>("account-creation");
  const [accountData, setAccountData] = useState<StripeAccountData | null>(
    null
  );
  const [vendorType, setVendorType] = useState<'individual' | 'company'>('individual');

  const countryConfig = getCountryConfig('NG');

  useEffect(() => {
    if (user?.accountType === 'business') {
      setVendorType('company');
    }
  }, [user]);

  const steps = [
    {
      id: "account-creation",
      name: "Stripe Account",
      status:
        currentStep === "account-creation"
          ? "current"
          : ["identity-verification", "business-verification"].includes(
              currentStep
            )
          ? "complete"
          : "upcoming",
    },
    {
      id: "identity-verification",
      name: vendorType === 'individual' ? "Identity Verification" : "Business Verification",
      status:
        currentStep === "identity-verification"
          ? "current"
          : currentStep === "business-verification"
          ? "complete"
          : "upcoming",
    },
    {
      id: "business-verification",
      name: "Bank Details",
      status: currentStep === "business-verification" ? "current" : "upcoming",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleAccountCreationComplete = (data: StripeAccountData) => {
    setAccountData(data);
    setCurrentStep("identity-verification");
  };

  const handleIdentityVerificationComplete = () => {
    setCurrentStep("business-verification");
  };

  const handleBusinessVerificationComplete = () => {
    // Final submission logic here
    console.log("All verification steps completed");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nigerian Vendor Verification
          </h1>
          <p className="text-lg text-gray-600">
            Complete your Stripe Connect onboarding in 3 simple steps
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  {/* Line between steps */}
                  {index > 0 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        steps[index - 1].status === "complete" ||
                        steps[index - 1].status === "current"
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    />
                  )}

                  {/* Step circle and label */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === "complete"
                          ? "bg-blue-600"
                          : step.status === "current"
                          ? "bg-blue-600 border-2 border-white"
                          : "bg-gray-300"
                      }`}
                    >
                      {step.status === "complete" ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            step.status === "current"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        step.status === "complete" || step.status === "current"
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === "account-creation" && (
            <StripeAccountCreation
              user={user}
              onComplete={handleAccountCreationComplete}
            />
          )}

          {currentStep === "identity-verification" && vendorType === 'individual' && (
            <IdentityVerification
              user={user}
              accountData={accountData}
              countryConfig={countryConfig}
              onComplete={handleIdentityVerificationComplete}
              onBack={() => setCurrentStep("account-creation")}
            />
          )}

          {currentStep === "identity-verification" && vendorType === 'company' && (
            <BusinessVerification
              user={user}
              accountData={accountData}
              countryConfig={countryConfig}
              onComplete={handleIdentityVerificationComplete}
              onBack={() => setCurrentStep("account-creation")}
            />
          )}

          {currentStep === "business-verification" && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bank Account Details</h2>
              <p className="text-gray-600 mb-6">Add your bank account for payouts</p>
              <button
                onClick={handleBusinessVerificationComplete}
                className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
              >
                Complete Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
