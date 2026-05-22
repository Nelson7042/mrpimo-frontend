"use client";

import { getCurrencySymbol } from "@/utils/currency";
import React, { useState, useEffect } from "react";
import {
  useVendorProducts,
  usePlans,
  useVendorSubscription,
  useCountrySubscriptionPrice,
} from "@/hooks/queries";
import { useCreateAdvertisement, useCreatePaymentIntent } from "@/hooks/mutations";
import { toast } from 'react-toastify';
import {
  ChevronDown,
  Plus,
  Landmark,
  CreditCard,
  Wallet,
  Bitcoin,
  Smartphone,
  Apple,
} from "lucide-react";
import PlanCard from "./(componets)/PlanCard";
import ProductSelector from "./(componets)/ProductSelector";
import PromoConfigSelector, { PromoConfig } from "./(componets)/PromoConfigSelector";
import Timer from "./(componets)/Timer";
import { ProductType } from "@/types/product.type";
import { useVendorStore } from "@/stores/useVendorStore";
import { Check } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

interface AdvertisementItem {
  _id: string;
  title: string;
  productId: { _id: string; name: string } | null;
  adType: string;
  status: "pending" | "approved" | "rejected" | "active" | "expired" | "expired_unused";
  rejectionReason?: string;
  liveAt?: string;
  endDate?: string;
  impressions?: number;
  clicks?: number;
  createdAt?: string;
  promoConfig?: {
    mode: "none" | "flat" | "percentage" | "per_variant";
    flatPrice?: number;
    percentageDiscount?: number;
    variantPrices?: Array<{ optionId: string; price: number }>;
  };
  originalPrices?: Array<{ optionId: string; originalSalePrice: number | null }>;
}



const paymentMethods = [
  {
    id: "bank",
    name: "Bank Transfer",
    icon: Landmark,
    color: "text-green-600",
  },
  {
    id: "card",
    name: "Card Payment",
    icon: CreditCard,
    color: "text-blue-600",
  },
  { id: "wallet", name: "Wallet", icon: Wallet, color: "text-purple-600" },
  { id: "crypto", name: "Crypto", icon: Bitcoin, color: "text-orange-600" },
  { id: "applepay", name: "ApplePay", icon: Apple, color: "text-blue-600" },
];

type Props = {};

const page = (props: Props) => {
  const [promoConfig, setPromoConfig] = useState<PromoConfig>({ mode: "none" });
  const [existingPromoWarning, setExistingPromoWarning] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null
  );
  const [description, setDescription] = useState("");


  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [adType, setAdType] = useState("banner");
  const createAdMutation = useCreateAdvertisement();
  const paymentIntentMutation = useCreatePaymentIntent();
  const { vendor } = useVendorStore();
  const { data: vendorProducts } = useVendorProducts(vendor?._id!);
  const { data: backendPlans } = usePlans();
  const { data: vendorSubscription } = useVendorSubscription(vendor?._id!);
  const { data: countryPricing } = useCountrySubscriptionPrice(vendor?._id!);

  const [advertisements, setAdvertisements] = useState<AdvertisementItem[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        setAdsLoading(true);
        const response = await fetchWithAuth(`${API_BASE_URL}/vendors/advertisements`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAdvertisements(result.data.advertisements);
          }
        }
      } catch (error) {
        console.error("Failed to fetch advertisements:", error);
      } finally {
        setAdsLoading(false);
      }
    };
    fetchAdvertisements();
  }, []);


  // Auto-select existing subscription plan
  useEffect(() => {
    if (vendorSubscription?.subscription?.currentPlan && backendPlans) {
      const currentPlan = backendPlans.find(
        (plan: any) =>
          plan._id === vendorSubscription.subscription.currentPlan._id
      );
      if (currentPlan) {
        setSelectedPlan(currentPlan);
      }
    }
  }, [vendorSubscription, backendPlans]);

  // Check for existing promo conflict when product changes
  useEffect(() => {
    if (!selectedProduct?._id) {
      setExistingPromoWarning(null);
      return;
    }

    const checkPromoConflict = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/vendors/advertisements`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const conflicting = result.data.advertisements.find(
              (ad: any) =>
                ad.productId?._id === selectedProduct._id &&
                ["pending", "approved", "active"].includes(ad.status) &&
                ad.promoConfig?.mode &&
                ad.promoConfig.mode !== "none"
            );
            if (conflicting) {
              setExistingPromoWarning(
                `This product already has an active promo campaign (${conflicting.promoConfig.mode} mode). Only one promo per product is allowed.`
              );
            } else {
              setExistingPromoWarning(null);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check promo conflict:", error);
        setExistingPromoWarning(null);
      }
    };

    checkPromoConflict();
  }, [selectedProduct?._id]);


  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-roboto text-xs">
      <div className="px-2 lg:px-5">
        <h1 className="text-lg font-semibold">Advertisement</h1>
        <p className="text-xs text-gray-600">
          Provide your product details to show case your product to thousands of
          buyers
        </p>

        {/* Submitted Advertisements List */}
        <div className="mt-6 mb-8">
          <h3 className="text-sm font-semibold mb-2">Your Advertisements</h3>
          <div className="border border-gray-300 rounded-md shadow-sm p-4">
            {adsLoading ? (
              <p className="text-xs text-gray-500">Loading advertisements...</p>
            ) : advertisements.length === 0 ? (
              <p className="text-xs text-gray-500">No advertisements submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {advertisements.map((ad) => {
                  const daysRemaining = ad.endDate
                    ? Math.max(0, Math.ceil((new Date(ad.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0;
                  const hasPromo = ad.promoConfig?.mode && ad.promoConfig.mode !== "none";

                  return (
                    <div
                      key={ad._id}
                      className="border border-gray-200 rounded-md p-3 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ad.title}</p>
                          <p className="text-xs text-gray-500">
                            Product: {ad.productId?.name ?? "N/A"} &middot; Type: {ad.adType}
                          </p>
                        </div>
                        <div>
                          {ad.status === "pending" && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                          {ad.status === "approved" && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Approved
                            </span>
                          )}
                          {ad.status === "active" && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Live
                            </span>
                          )}
                          {ad.status === "expired" && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Completed
                            </span>
                          )}
                          {ad.status === "expired_unused" && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              Refunded
                            </span>
                          )}
                          {ad.status === "rejected" && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status-specific details */}
                      <div className="mt-2">
                        {ad.status === "pending" && (
                          <div className="text-xs text-gray-500">
                            {ad.createdAt && (
                              <p>Submitted: {new Date(ad.createdAt).toLocaleDateString()}</p>
                            )}
                            {hasPromo && (
                              <p className="mt-1">
                                Promo:{" "}
                                {ad.promoConfig!.mode === "flat" && `Flat price ₦${ad.promoConfig!.flatPrice?.toLocaleString()}`}
                                {ad.promoConfig!.mode === "percentage" && `${ad.promoConfig!.percentageDiscount}% discount`}
                                {ad.promoConfig!.mode === "per_variant" && "Per-variant pricing"}
                              </p>
                            )}
                          </div>
                        )}

                        {ad.status === "approved" && (
                          <p className="text-xs text-blue-600">
                            Awaiting placement by our team
                          </p>
                        )}

                        {ad.status === "active" && (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {ad.liveAt && (
                                <p>Live since: {new Date(ad.liveAt).toLocaleDateString()}</p>
                              )}
                              {ad.endDate && (
                                <p>Expires: {new Date(ad.endDate).toLocaleDateString()} ({daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining)</p>
                              )}
                            </div>
                            <div className="flex gap-x-4">
                              <p>Impressions: {ad.impressions?.toLocaleString() ?? 0}</p>
                              <p>Clicks: {ad.clicks?.toLocaleString() ?? 0}</p>
                            </div>
                            {hasPromo && (
                              <div className="mt-1 p-2 bg-green-50 rounded border border-green-200">
                                <p className="font-medium text-green-700 mb-1">
                                  Promo Active:{" "}
                                  {ad.promoConfig!.mode === "flat" && `Flat ₦${ad.promoConfig!.flatPrice?.toLocaleString()}`}
                                  {ad.promoConfig!.mode === "percentage" && `${ad.promoConfig!.percentageDiscount}% off`}
                                  {ad.promoConfig!.mode === "per_variant" && "Per-variant pricing"}
                                </p>
                                {ad.originalPrices && ad.originalPrices.length > 0 && (
                                  <div className="space-y-0.5">
                                    {ad.originalPrices.map((op) => {
                                      let promoPrice: number | null = null;
                                      if (ad.promoConfig!.mode === "flat") {
                                        promoPrice = ad.promoConfig!.flatPrice ?? null;
                                      } else if (ad.promoConfig!.mode === "percentage" && op.originalSalePrice != null) {
                                        promoPrice = Math.round(op.originalSalePrice * (1 - (ad.promoConfig!.percentageDiscount ?? 0) / 100) * 100) / 100;
                                      } else if (ad.promoConfig!.mode === "per_variant") {
                                        const entry = ad.promoConfig!.variantPrices?.find((vp) => vp.optionId === op.optionId);
                                        promoPrice = entry?.price ?? null;
                                      }
                                      return (
                                        <p key={op.optionId} className="text-xs">
                                          <span className="line-through text-gray-400">
                                            ₦{op.originalSalePrice?.toLocaleString() ?? "N/A"}
                                          </span>
                                          {promoPrice != null && (
                                            <span className="ml-1 text-green-700 font-medium">
                                              → ₦{promoPrice.toLocaleString()}
                                            </span>
                                          )}
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {ad.status === "expired" && (
                          <div className="text-xs text-gray-500">
                            {ad.liveAt && ad.endDate && (
                              <p>
                                Ran: {new Date(ad.liveAt).toLocaleDateString()} – {new Date(ad.endDate).toLocaleDateString()}
                              </p>
                            )}
                            <div className="flex gap-x-4">
                              <p>Impressions: {ad.impressions?.toLocaleString() ?? 0}</p>
                              <p>Clicks: {ad.clicks?.toLocaleString() ?? 0}</p>
                            </div>
                          </div>
                        )}

                        {ad.status === "expired_unused" && (
                          <p className="text-xs text-orange-600">
                            Credits refunded — not placed within 14 days
                          </p>
                        )}

                        {ad.status === "rejected" && ad.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1">
                            Reason: {ad.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm mb-2">Product Selection</h3>

          <div className="border border-gray-300 p-4 rounded-md shadow-sm space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Product Selection */}
              <div className="col-span-6 flex flex-col gap-y-2">
                <label
                  htmlFor="product"
                  className="flex justify-between items-center"
                >
                  <span className="font-medium">Product</span>
                  <button
                    type="button"
                    className="text-[#004aad] text-xs flex gap-x-1 items-center hover:underline"
                  >
                    + Add New Product
                  </button>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 border border-gray-300 rounded-md p-2 flex justify-between items-center"
                    onClick={() => setShowSelector((prev) => !prev)}
                  >
                    <span>
                      {selectedProduct
                        ? selectedProduct.name
                        : "Choose your product"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`${showSelector ? "rotate-180" : ""} `}
                    />
                  </button>
                </div>

                {showSelector && (
                  <div className="">
                    <ProductSelector
                      products={vendorProducts}
                      onSelect={(p) => {
                        setSelectedProduct(p);
                        setShowSelector(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Promo Configuration */}
              <div className="col-span-6 flex flex-col gap-y-2">
                <label className="font-medium">Promo Pricing</label>
                <PromoConfigSelector
                  product={selectedProduct}
                  promoConfig={promoConfig}
                  onChange={setPromoConfig}
                  existingPromoWarning={existingPromoWarning}
                />
              </div>
            </div>

            {/* Ad Type */}
            <div className="flex flex-col gap-y-2">
              <label htmlFor="adType" className="font-medium">
                Advertisement Type
              </label>
              <select
                id="adType"
                value={adType}
                onChange={(e) => setAdType(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="banner">Banner</option>
                <option value="featured">Featured</option>
                <option value="sponsored">Sponsored</option>
              </select>
            </div>

            {/* Additional Info */}
            <div className="flex flex-col gap-y-2">
              <label htmlFor="description" className="font-medium">
                Additional Information
              </label>
              <textarea
                id="description"
                className="w-full border border-gray-300 rounded-md p-2 resize-none"
                placeholder="Write additional information for your Item."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-gray-600 text-end">
                {description.length}/400
              </p>
            </div>
          </div>
        </div>

        {/* Section 1 - Promotion Plans */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-6">Promotion Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 rounded-xl p-6 border border-gray-200 bg-gray-50">
            {(backendPlans || [])
              .sort((a: any, b: any) => {
                const order = { Starter: 1, Pro: 2, Elite: 3 };
                return (
                  (order[a.name as keyof typeof order] || 999) -
                  (order[b.name as keyof typeof order] || 999)
                );
              })
              .map((plan: any, index: number) => {
                // Get localized price from pricingDetails (returned by getSubscriptionPrice endpoint)
                const pricingEntry = countryPricing?.pricingDetails?.find(
                  (entry: any) => entry.plan === plan._id || entry.planName === plan.name
                );
                const planPrice = pricingEntry?.price ?? 0;
                const currencySymbol = pricingEntry?.currencySymbol ?? countryPricing?.country?.currencySymbol ?? "₦";
                const hasActivePlan = !!vendorSubscription?.subscription?.currentPlan;
                const isSelected = selectedPlan?.name === plan.name;
                const canSelect = !hasActivePlan;

                // Display plan features with 0 for missing values
                const displayFeatures = [
                  `Ad Credits: ${plan.adCreditMonthly ?? 0}/month`,
                  `Product Listings: ${
                    plan.productListingLimit === -1
                      ? "Unlimited"
                      : plan.productListingLimit ?? 0
                  }`,
                  `Collection Slots: ${plan.collectionProductSlots ?? 0}`,
                  `Analytics: ${plan.analyticsDashboard ? "Yes" : "No"}`,
                  `Bulk Upload: ${plan.bulkUpload ? "Yes" : "No"}`,
                  `Store Branding: ${plan.customStoreBranding ?? "none"}`,
                  `Messaging: ${plan.messagingTools ?? "basic"}`,
                  `Payout: ${
                    plan.payoutOptions?.length
                      ? plan.payoutOptions[plan.payoutOptions.length - 1]
                      : "weekly"
                  }`,
                ];

                return (
                  <div
                    key={plan._id || index}
                    onClick={() => canSelect && setSelectedPlan(plan)}
                    className={`bg-white rounded-xl p-3 transition-all duration-200 ${
                      !canSelect ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    } ${
                      isSelected
                        ? "border-2 border-blue-500 shadow-lg transform -translate-y-1"
                        : "border border-gray-200 shadow-md hover:shadow-lg"
                    }`}
                  >
                    <div className="bg-[#adcaf2] p-3 rounded-sm mb-10">
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white">
                          {plan.name}
                        </span>
                      </div>

                      <div className="mb-6">
                        <div className="text-3xl font-semibold text-gray-700">
                          {currencySymbol}
                          {planPrice.toLocaleString()} / Month
                        </div>
                      </div>
                    </div>

                    <button 
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors mb-6 ${
                        hasActivePlan 
                          ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                          : "bg-[#004aad] text-white hover:bg-blue-700"
                      }`}
                      disabled={hasActivePlan}
                    >
                      {hasActivePlan ? "Current Plan" : "Upgrade"}
                    </button>

                    <div className="space-y-3">
                      {displayFeatures.map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <div className="p1 bg-[#004aad] text-white mr-2 border border-[#004aad] flex items-center justify-center w-4 h-4">
                            <Check />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Section 2 - Subscription Payment */}
        {!vendorSubscription?.subscription?.currentPlan && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-6">Pay for Subscription</h3>
            <div className="bg-[#e2e8f0] rounded-md p-4">
              <p className="text-sm mb-4">Selected Plan: <span className="font-medium">{selectedPlan?.name}</span></p>
              <p className="text-lg font-semibold mb-4">Amount: {countryPricing?.country?.currencySymbol ?? '₦'}{selectedPlan ? (countryPricing?.pricingDetails?.find((p: any) => p.plan === selectedPlan._id || p.planName === selectedPlan.name)?.price ?? 0).toLocaleString() : '0'}</p>
              <div id="stripe-payment-element"></div>
            </div>
          </div>
        )}

        {/* Hidden for non-subscribers */}
        <div className="hidden">
          <div className="inline-flex gap-4 p-4">
            {paymentMethods.map((method, index) => {
                const IconComponent = method.icon;
                const isActive =
                  selectedPaymentMethod === method.id ||
                  (selectedPaymentMethod === "" && method.id === "bank");
                const isLast = index === paymentMethods.length - 1;

                return (
                  <label
                    key={method.id}
                    className={`flex flex-col items-center pr-4 cursor-pointer transition-all space-y-2 ${
                      !isLast ? "border-r border-gray-300" : ""
                    }`}
                  >
                    {/* Icon */}
                    <IconComponent size={24} className={method.color} />

                    {/* Method Name */}
                    <span className="font-medium text-sm text-center">
                      {method.name}
                    </span>

                    {/* Radio Input */}
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={isActive}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className={`${
                        isActive
                          ? method.color.replace("text-", "accent-")
                          : "accent-gray-400"
                      }`}
                    />
                  </label>
                );
              })}
            </div>

          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button 
            onClick={() => {
              if (selectedProduct && selectedPlan && (selectedPaymentMethod || selectedPaymentMethod === "")) {
                setShowModal(true);
              } else {
                alert("Please complete all required fields");
              }
            }}
            className="px-6 py-2 bg-[#004aad] text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold mb-2">Advertisement Summary</h2>
              <p className="text-xs text-gray-600 mb-4">Carefully check and confirm your ad.</p>
              
              <h3 className="text-md font-medium mb-2">Product Information</h3>
              
              <div className="bg-[#e2e8f0] rounded-md p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {selectedProduct?.images?.[0] && (
                    <img 
                      src={selectedProduct.images[0]} 
                      alt={selectedProduct.name} 
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedProduct?.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Payment Method:</span> {paymentMethods.find(m => m.id === (selectedPaymentMethod || "bank"))?.name}</p>
                  <p><span className="font-medium">Selected Plan:</span> {selectedPlan?.name}</p>
                  <p><span className="font-medium">Ad Type:</span> {adType.charAt(0).toUpperCase() + adType.slice(1)}</p>
                  {description && <p><span className="font-medium">Additional Info:</span> {description}</p>}
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => {
                    const hasActivePlan = !!vendorSubscription?.subscription?.currentPlan;
                    
                    if (hasActivePlan) {
                      // Direct ad creation for existing subscribers
                      createAdMutation.mutate({
                        vendorId: vendor?._id!,
                        productId: selectedProduct?._id!,
                        title: selectedProduct?.name!,
                        description: description || '',
                        imageUrl: selectedProduct?.images?.[0] || '',
                        adType: adType,
                        promoConfig: promoConfig,
                      }, {
                        onSuccess: () => {
                          toast.success('Advertisement created successfully! Pending review.');
                          setShowModal(false);
                          setSelectedProduct(null);
                          setDescription('');
                          setPromoConfig({ mode: "none" });
                          setAdType('banner');
                        }
                      });
                    } else {
                      // Redirect to Stripe checkout for new subscribers
                      const localizedPlan = countryPricing?.pricingDetails?.find(
                        (p: any) => p.plan === selectedPlan?._id || p.planName === selectedPlan?.name
                      );
                      
                      paymentIntentMutation.mutate({
                        vendorId: vendor?._id!,
                        priceId: localizedPlan?._id || selectedPlan?._id!,
                      });
                    }
                  }}
                  disabled={createAdMutation.isPending || paymentIntentMutation.isPending}
                  className="px-6 py-2 bg-[#004aad] text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {(createAdMutation.isPending || paymentIntentMutation.isPending) ? 'Processing...' : (vendorSubscription?.subscription?.currentPlan ? 'Submit' : 'Pay & Submit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
   
  );
};

export default page;
