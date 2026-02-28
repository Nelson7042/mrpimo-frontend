"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, User, CheckCircle } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { useVendorStore } from "@/stores/useVendorStore";
import { useRouter } from "next/navigation";
import { Country, State } from "country-state-city";
import { getIPLocation } from "@/utils/geolocation.util";
import { useSignVendor, useUpgradeToVendor } from "@/hooks/mutations";
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
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Start Selling on Mprimo
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm">
          Choose the account type that best fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Personal Account */}
        <button
          onClick={() => onSelect("personal")}
          className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <User size={32} className="text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Personal Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Perfect for individuals selling their own items
            </p>

            <div className="space-y-2 text-left w-full">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">
                  Sell up to 100 products
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">
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
  const { mutate: signUpVendor, isPending: isSignUpPending } = useSignVendor();
  const { mutate: upgradeToVendor, isPending: isUpgradePending } = useUpgradeToVendor();
  const isPending = isSignUpPending || isUpgradePending;
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [requiredBankFields, setRequiredBankFields] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [locationData, setLocationData] = useState<{
    coordinates: [number, number];
    hasExactLocation: boolean;
  } | null>(null);
  const [banksList, setBanksList] = useState<{ code: string; name: string }[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [debouncedBankSearch, setDebouncedBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  
  // Debounce bank search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBankSearch(bankSearchQuery);
    }, 150); // 150ms debounce
    
    return () => clearTimeout(timer);
  }, [bankSearchQuery]);
  
  // Filter banks based on debounced search query
  const filteredBanks = React.useMemo(() => {
    if (!debouncedBankSearch.trim()) {
      return banksList;
    }
    const searchLower = debouncedBankSearch.toLowerCase();
    return banksList.filter((bank) =>
      bank.name.toLowerCase().includes(searchLower)
    );
  }, [banksList, debouncedBankSearch]);
  
  // Form fields
  const [formData, setFormData] = useState<Record<string, string>>({
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
    bankCode: "",
    accountNumber: "",
  });
  
  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];

  // Auto-detect user's country and location on mount
  useEffect(() => {
    const detectLocationAndCountry = async () => {
      try {
        // Try to get country from localStorage first
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry) {
          const detectedCountry = countries.find(
            (c) => c.name === storedCountry || c.isoCode === storedCountry
          );
          if (detectedCountry) {
            setSelectedCountry(detectedCountry.isoCode);
            // Fetch bank requirements and banks list for detected country
            await Promise.all([
              fetchBankRequirements(detectedCountry.isoCode),
              fetchBanksList(detectedCountry.isoCode),
            ]);
          }
        }

        const ipLocation = await getIPLocation();
        
        // Only set country from IP if not already set from localStorage
        if (!storedCountry) {
          const detectedCountry = countries.find(
            (c) => c.isoCode === ipLocation.country_code
          );
          if (detectedCountry) {
            setSelectedCountry(detectedCountry.isoCode);
            // Fetch bank requirements and banks list for detected country
            await Promise.all([
              fetchBankRequirements(detectedCountry.isoCode),
              fetchBanksList(detectedCountry.isoCode),
            ]);
          }
        }
        
        if (ipLocation.latitude && ipLocation.longitude) {
          setLocationData({
            coordinates: [ipLocation.longitude, ipLocation.latitude],
            hasExactLocation: false,
          });
        }
      } catch (error) {
        console.warn("Could not auto-detect location:", error);
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
      country: country.name,
      street: formData.street,
      city: formData.city,
      state: state.name,
      postalCode: formData.postalCode,
      agreedToTerms,
    };

    // Add location data as top-level fields (backend expects longitude/latitude at root)
    if (locationData) {
      registrationData.longitude = locationData.coordinates[0];
      registrationData.latitude = locationData.coordinates[1];
      registrationData.hasExactLocation = locationData.hasExactLocation;
    }

    // For new user registration (not upgrade), include auth fields
    if (!user) {
      registrationData.email = formData.email;
      registrationData.password = formData.password;
      registrationData.phoneNumber = formData.phoneNumber;
      registrationData.role = "vendor";
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

    // Build bank details from all dynamic fields
    const bankDetails: Record<string, string> = {};
    if (formData.accountHolderName) bankDetails.accountHolder = formData.accountHolderName;
    if (formData.bankName) bankDetails.bankName = formData.bankName;
    if (formData.accountNumber) bankDetails.accountNumber = formData.accountNumber;
    if (formData.routingNumber) bankDetails.routingNumber = formData.routingNumber;
    if (formData.sortCode) bankDetails.sortCode = formData.sortCode;
    if (formData.bsb) bankDetails.bsb = formData.bsb;
    if (formData.institutionNumber) bankDetails.institutionNumber = formData.institutionNumber;
    if (formData.transitNumber) bankDetails.transitNumber = formData.transitNumber;
    if (formData.iban) bankDetails.iban = formData.iban;
    if (formData.swiftBic) bankDetails.swiftBic = formData.swiftBic;
    if (formData.bankCode) bankDetails.bankCode = formData.bankCode;

    if (Object.keys(bankDetails).length > 0) {
      registrationData.bankDetails = bankDetails;
    }

    const onSuccess = (data: any) => {
      if (data.user) {
        setUser(data.user);
      }
      if (data.vendor) {
        setVendor(data.vendor);
      }
      toast.success(data.message || "Vendor registration successful!");
      onClose();
      router.push("/vendor/dashboard");
    };

    const onError = (error: any) => {
      console.error("❌ Vendor registration failed:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    };

    if (user) {
      // Logged-in user: use the upgrade endpoint (authenticated)
      upgradeToVendor(registrationData, { onSuccess, onError });
    } else {
      // New user: use the register endpoint
      signUpVendor(registrationData, { onSuccess, onError });
    }
  };

  const fetchBankRequirements = async (countryCode: string) => {
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/location/countries/${countryCode}/account-details`;
    
    try {
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setRequiredBankFields(data.data?.requiredAccountDetails || data.requiredAccountDetails);
      } else {
        console.error('❌ Failed to fetch bank requirements:', response.statusText);
      }
    } catch (error) {
      console.error("❌ Error fetching bank requirements:", error);
    }
  };

  const fetchBanksList = async (countryCode: string) => {
    // Only fetch banks for countries that use Paystack (Nigeria, Ghana, South Africa, Kenya)
    const paystackCountryMap: Record<string, string> = {
      'NG': 'nigeria',
      'GH': 'ghana',
      'ZA': 'south-africa',
      'KE': 'kenya',
    };
    
    const paystackCountry = paystackCountryMap[countryCode];
    if (!paystackCountry) {
      setBanksList([]);
      return;
    }

    setIsLoadingBanks(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/paystack/banks?country=${paystackCountry}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.banks) {
          const banks = data.banks.map((bank: any) => ({
            code: bank.code,
            name: bank.name,
          }));
          setBanksList(banks);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch banks:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching banks list:', error);
      setBanksList([]);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleCountryChange = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState("");
    // Reset bank selection when country changes
    setFormData((prev) => ({ ...prev, bankName: "", bankCode: "" }));
    setBankSearchQuery("");
    setShowBankDropdown(false);
    await Promise.all([
      fetchBankRequirements(countryCode),
      fetchBanksList(countryCode),
    ]);
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankSelect = (bankCode: string) => {
    const selectedBank = banksList.find((bank) => bank.code === bankCode);
    if (selectedBank) {
      setFormData((prev) => ({
        ...prev,
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
      }));
    }
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </>
        )}

        {/* Business-specific fields */}
        {accountType === "business" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Business Registration Number *
              </label>
              <input
                type="text"
                required
                value={formData.businessRegistrationNumber}
                onChange={(e) => handleInputChange("businessRegistrationNumber", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Business Type *
              </label>
              <select
                required
                value={formData.businessType}
                onChange={(e) => handleInputChange("businessType", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select business type</option>
                <option value="limited_liability_company">Limited Liability Company</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Tax ID (Optional)
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="Enter street address"
                value={formData.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter postal code"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
          {!selectedCountry ? (
            <p className="text-xs text-gray-600">Please select a country first to see required bank details.</p>
          ) : !requiredBankFields ? (
            <p className="text-xs text-gray-600">Loading bank requirements...</p>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Count total visible fields (including accountHolder)
                const totalFieldsCount = Object.entries(requiredBankFields)
                  .filter(([, value]) => value === true)
                  .length;
                const isOddTotal = totalFieldsCount % 2 !== 0;

                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    {requiredBankFields.accountHolder && (
                      <div className={isOddTotal ? "md:col-span-2" : ""}>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.accountHolderName}
                          onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    )}
                    
                {requiredBankFields.bankName && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Bank Name *
                    </label>
                    {banksList.length > 0 ? (
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={isLoadingBanks ? "Loading banks..." : "Search and select your bank"}
                            value={bankSearchQuery}
                            onChange={(e) => {
                              setBankSearchQuery(e.target.value);
                              setShowBankDropdown(true);
                            }}
                            onFocus={() => setShowBankDropdown(true)}
                            disabled={isLoadingBanks}
                            className="w-full px-3 py-2.5 text-xs font-poppins bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                          />
                          {/* Dropdown arrow indicator */}
                          <svg
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${showBankDropdown ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {showBankDropdown && (
                          <>
                            {/* Backdrop to close dropdown when clicking outside */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowBankDropdown(false)}
                            />
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredBanks.length > 0 ? (
                                filteredBanks.map((bank) => (
                                  <button
                                    key={bank.code}
                                    type="button"
                                    onClick={() => {
                                      handleBankSelect(bank.code);
                                      setBankSearchQuery(bank.name);
                                      setShowBankDropdown(false);
                                    }}
                                    className={`w-full px-3 py-2.5 text-left text-xs font-poppins hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                      formData.bankCode === bank.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                    }`}
                                  >
                                    {bank.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-3 text-xs font-poppins text-gray-500 text-center">
                                  No banks found matching "{bankSearchQuery}"
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                        className="w-full px-3 py-2.5 text-xs font-poppins bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                )}
                
                {requiredBankFields.accountNumber && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.routingNumber && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Routing Number *
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.sortCode && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Sort Code *
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) => handleInputChange("sortCode", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.bsb && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      BSB Code *
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) => handleInputChange("bsb", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.institutionNumber && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Institution Number *
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) => handleInputChange("institutionNumber", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.transitNumber && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Transit Number *
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) => handleInputChange("transitNumber", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.iban && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      IBAN *
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) => handleInputChange("iban", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.swiftBic && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      SWIFT/BIC {requiredBankFields.swiftBic === false ? '(Optional)' : '*'}
                    </label>
                    <input
                      type="text"
                      required={requiredBankFields.swiftBic === true}
                      onChange={(e) => handleInputChange("swiftBic", e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
                
                {requiredBankFields.bankCode && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Bank Code {banksList.length === 0 && '*'}
                    </label>
                    <input
                      type="text"
                      required={banksList.length === 0}
                      value={formData.bankCode}
                      onChange={(e) => {
                        // Only allow manual input if no banks list (fallback)
                        if (banksList.length === 0) {
                          handleInputChange("bankCode", e.target.value);
                        }
                      }}
                      readOnly={banksList.length > 0}
                      placeholder={banksList.length > 0 ? "Auto-filled from bank selection" : "Enter bank code"}
                      className={`w-full px-3 py-2 text-xs bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        banksList.length > 0 ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                    />
                    {banksList.length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Automatically set when you select a bank
                      </p>
                    )}
                  </div>
                )}
              </div>
          );
        })()}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            required
            id="terms"
            className="mt-1"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
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
            className="flex-1 px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating Account..." : "Create Seller Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
