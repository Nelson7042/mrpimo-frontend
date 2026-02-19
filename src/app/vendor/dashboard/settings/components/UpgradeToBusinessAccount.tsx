"use client";

import React, { useState, useEffect } from "react";
import { useVendorStore } from "@/stores/useVendorStore";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/constant";
import { toast } from "sonner";

export default function UpgradeToBusinessAccount() {
  const { vendor, setVendor } = useVendorStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(true);
  
  // Check if vendor has existing address
  const existingAddress = vendor?.businessInfo?.address;
  const hasExistingAddress = !!(existingAddress?.street && existingAddress?.city && existingAddress?.country);
  
  const [formData, setFormData] = useState({
    businessName: "",
    registrationNumber: "",
    taxId: "",
    businessType: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });

  // Pre-fill existing address when modal opens
  useEffect(() => {
    if (isModalOpen && existingAddress) {
      setFormData(prev => ({
        ...prev,
        address: {
          street: existingAddress.street || "",
          city: existingAddress.city || "",
          state: existingAddress.state || "",
          country: existingAddress.country || "",
          postalCode: existingAddress.postalCode || "",
        }
      }));
    }
  }, [isModalOpen, existingAddress]);

  // Only show for personal accounts
  if (vendor?.accountType !== "personal") {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }
    
    // Only validate address if not using existing or no existing address
    if (!useExistingAddress || !hasExistingAddress) {
      if (!formData.address.street || !formData.address.city || !formData.address.country) {
        toast.error("Business address is required");
        return;
      }
    }

    setIsLoading(true);
    try {
      // Only send address if user wants to update it or doesn't have one
      const payload: any = {
        businessName: formData.businessName,
        registrationNumber: formData.registrationNumber || undefined,
        taxId: formData.taxId || undefined,
        businessType: formData.businessType || undefined,
      };
      
      if (!useExistingAddress || !hasExistingAddress) {
        payload.address = formData.address;
      }

      const response = await fetchWithAuth(`${API_BASE_URL}/vendor/upgrade-to-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Account upgraded to business successfully!");
        setVendor(data.vendor);
        setIsModalOpen(false);
      } else {
        toast.error(data.message || "Failed to upgrade account");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-2">Upgrade to Business Account</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upgrade your personal account to a business account to access additional features
          like higher selling limits and business verification.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Upgrade to Business
        </button>
      </div>

      {/* Upgrade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Upgrade to Business Account</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select type</option>
                    <option value="sole_proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Business Address</h4>
                  
                  {hasExistingAddress && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useExistingAddress}
                          onChange={(e) => setUseExistingAddress(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Use existing address: {existingAddress?.street}, {existingAddress?.city}, {existingAddress?.country}
                        </span>
                      </label>
                    </div>
                  )}
                  
                  {(!useExistingAddress || !hasExistingAddress) && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="address.street"
                        placeholder="Street Address"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required={!hasExistingAddress}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="address.city"
                          placeholder="City"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required={!hasExistingAddress}
                        />
                        <input
                          type="text"
                          name="address.state"
                          placeholder="State/Province"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="address.country"
                          placeholder="Country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required={!hasExistingAddress}
                        />
                        <input
                          type="text"
                          name="address.postalCode"
                          placeholder="Postal Code"
                          value={formData.address.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                  <p className="text-yellow-800">
                    After upgrading, you'll need to complete KYB (Know Your Business) verification
                    to access all business features.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Upgrading..." : "Upgrade Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
