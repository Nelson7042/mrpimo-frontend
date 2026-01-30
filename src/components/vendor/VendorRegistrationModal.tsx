"use client";

import React, { useState, useEffect } from "react";
import { X, Store, Building2, User, CheckCircle } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { useVendorStore } from "@/stores/useVendorStore";
import { useRouter } from "next/navigation";
import { Country, State } from "country-state-city";
import { getIPLocation } from "@/utils/geolocation.util";
import { useSignVendor } from "@/hooks/mutations";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VendorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorRegistrationModal({
  isOpen,
  onClose,
}: VendorRegistrationModalProps) {
  const [step, setStep] = useState<"account-type" | "form">("account-type");
  const [accountType, setAccountType] = useState<"personal" | "business" | null>(null);
  const { user } = useUserStore();
  const { vendor } = useVendorStore();
  const router = useRouter();

  // If user is already a vendor and modal is opened, redirect to dashboard
  React.useEffect(() => {
    if (vendor && isOpen) {
      router.push("/vendor/dashboard");
      onClose();
    }
  }, [vendor, isOpen, router, onClose]);

  if (!isOpen) return null;

  const handleAccountTypeSelect = (type: "personal" | "business") => {
    setAccountType(type);
    setStep("form");
  };

  const handleBack = () => {
    if (step === "form") {
      setStep("account-type");
      setAccountType(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 md:p-10">
          {step === "account-type" ? (
            <AccountTypeSelection onSelect={handleAccountTypeSelect} />
          ) : (
            <VendorRegistrationForm
              accountType={accountType!}
              user={user}
              onBack={handleBack}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Account Type Selection Component
function AccountTypeSelection({
  onSelect,
}: {
  onSelect: (type: "personal" | "business") => void;
}) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Start Selling on Mprimo
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Choose the account type that best fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Personal Account */}
        <button
          onClick={() => onSelect("personal")}
          className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <User size={32} className="text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Personal Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Perfect for individuals selling their own items
            </p>

            <div className="space-y-2 text-left w-full">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Sell up to 10 products
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Quick setup with basic verification
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Ideal for side hustles and hobbies
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Lower fees and simpler tax reporting
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Business Account */}
        <button
          onClick={() => onSelect("business")}
          className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            Recommended
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <Building2 size={32} className="text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Business Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              For registered businesses and serious sellers
            </p>

            <div className="space-y-2 text-left w-full">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Unlimited product listings
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Advanced analytics and insights
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Bulk upload and inventory management
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Priority support and featured listings
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-700">
          <strong>Note:</strong> You can upgrade from Personal to Business account anytime.
          Business accounts require additional verification (business registration, tax ID).
        </p>
      </div>
    </div>
  );
}

// Vendor Registration Form Component
function VendorRegistrationForm({
  accountType,
  user,
  onBack,
  onClose,
}: {
  accountType: "personal" | "business";
  user: any;
  onBack: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setUser } = useUserStore();
  const { setVendor } = useVendorStore();
  const { mutate: signUpVendor, isPending } = useSignVendor();
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [locationData, setLocationData] = useState<{
    coordinates: [number, number];
    hasExactLocation: boolean;
  } | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.profile?.phoneNumber || "",
    password: "",
    businessName: "",
    businessRegistrationNumber: "",
    businessType: "",
    taxId: "",
    street: "",
    city: "",
    postalCode: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
  });
  
  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];

  // Auto-detect user's country and location on mount
  useEffect(() => {
    const detectLocationAndCountry = async () => {
      try {
        const ipLocation = await getIPLocation();
        
        // Set country
        const detectedCountry = countries.find(
          (c) => c.isoCode === ipLocation.country_code
        );
        if (detectedCountry) {
          setSelectedCountry(detectedCountry.isoCode);
        }
        
        // Set location coordinates from IP
        if (ipLocation.latitude && ipLocation.longitude) {
          setLocationData({
            coordinates: [ipLocation.longitude, ipLocation.latitude],
            hasExactLocation: false, // IP-based location is not exact
          });
        }
      } catch (error) {
        console.warn("Could not auto-detect country and location:", error);
      }
    };
    
    detectLocationAndCountry();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get country and state names
    const country = countries.find((c) => c.isoCode === selectedCountry);
    const state = states.find((s) => s.isoCode === selectedState);

    if (!country || !state) {
      toast.error("Please select a valid country and state");
      return;
    }

    // Build registration data based on account type
    const registrationData: any = {
      accountType,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      country: country.name,
      street: formData.street,
      city: formData.city,
      state: state.name,
      postalCode: formData.postalCode,
      role: "vendor",
    };

    // Add location data if available
    if (locationData) {
      registrationData.location = {
        type: 'Point',
        coordinates: locationData.coordinates,
        hasExactLocation: locationData.hasExactLocation,
      };
    }

    // Add personal or business specific fields
    if (accountType === "personal") {
      registrationData.firstName = formData.firstName;
      registrationData.lastName = formData.lastName;
    } else {
      registrationData.businessName = formData.businessName;
      if (formData.businessRegistrationNumber) {
        registrationData.businessRegistrationNumber = formData.businessRegistrationNumber;
      }
      if (formData.businessType) {
        registrationData.businessType = formData.businessType;
      }
      if (formData.taxId) {
        registrationData.taxId = formData.taxId;
      }
    }

    // Add bank details
    if (formData.accountHolderName && formData.bankName && formData.accountNumber) {
      registrationData.bankDetails = {
        accountHolder: formData.accountHolderName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
      };
    }

    console.log('📍 Sending vendor registration with location:', registrationData.location);

    signUpVendor(registrationData, {
      onSuccess: (data: any) => {
        console.log("✅ Vendor registration successful:", data);
        
        // Set user in store
        setUser(data.user);
        
        // Set vendor in store if returned
        if (data.vendor) {
          setVendor(data.vendor);
          console.log("✅ Vendor saved to store:", data.vendor);
        }
        
        toast.success(data.message || "Vendor registration successful! Please verify your email.");
        onClose();
        
        // Redirect to vendor dashboard
        router.push("/vendor/dashboard");
      },
      onError: (error: any) => {
        console.error("❌ Vendor registration failed:", error);
        toast.error(error.message || "Registration failed. Please try again.");
      },
    });
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState(""); // Reset state when country changes
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGetExactLocation = async () => {
    try {
      toast.loading("Getting your location...", { id: "location" });
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setLocationData({
        coordinates: [position.coords.longitude, position.coords.latitude],
        hasExactLocation: true,
      });

      toast.success("Exact location captured!", { id: "location" });
    } catch (error) {
      console.error("Failed to get exact location:", error);
      toast.error("Could not get exact location. Using approximate location.", { id: "location" });
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        ← Back to account type
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          {accountType === "personal" ? (
            <User size={32} className="text-blue-600" />
          ) : (
            <Building2 size={32} className="text-blue-600" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {accountType === "personal" ? "Personal" : "Business"} Account Registration
            </h2>
            <p className="text-sm text-gray-600">
              {user
                ? "Complete your seller profile"
                : "Create your account to start selling"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Show different fields based on whether user is logged in */}
        {!user && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </>
        )}

        {/* Business-specific fields */}
        {accountType === "business" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Registration Number *
              </label>
              <input
                type="text"
                required
                value={formData.businessRegistrationNumber}
                onChange={(e) => handleInputChange("businessRegistrationNumber", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Type *
              </label>
              <select
                required
                value={formData.businessType}
                onChange={(e) => handleInputChange("businessType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select business type</option>
                <option value="limited_liability_company">Limited Liability Company</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tax ID (Optional)
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </>
        )}

        {/* Common fields */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Store/Business Address
          </h3>
          
          {/* Location Status */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {locationData?.hasExactLocation ? (
                    <>📍 Exact location captured</>
                  ) : locationData ? (
                    <>📍 Approximate location (IP-based)</>
                  ) : (
                    <>📍 No location data</>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetExactLocation}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Get Exact Location
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Providing your exact business location ensures the system can accurately calculate shipping costs and determine order pickup options..
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="Enter street address"
                value={formData.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  State/Province *
                </label>
                <Select
                  value={selectedState}
                  onValueChange={handleStateChange}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select state or province" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter postal code"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country *
                </label>
                <Select
                  value={selectedCountry}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bank Account Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Holder Name *
              </label>
              <input
                type="text"
                required
                value={formData.accountHolderName}
                onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{10,20}"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            required
            id="terms"
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Seller Policy
            </a>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating Account..." : "Create Seller Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
