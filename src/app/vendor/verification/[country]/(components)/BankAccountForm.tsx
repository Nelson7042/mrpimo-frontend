"use client";

import { useState } from "react";
import nigerianBanksUtils from "@/utils/nigerianBanks";

interface BankAccountFormProps {
  country: string;
  vendorType: "individual" | "company";
  initialData: Record<string, any>;
  onNext: (data: Record<string, any>) => void;
  onBack: () => void;
}

export default function BankAccountForm({
  country,
  vendorType,
  initialData,
  onNext,
  onBack,
}: BankAccountFormProps) {
  const [formData, setFormData] = useState({
    object: initialData.object || "bank_account",
    country: initialData.country || country,
    currency: initialData.currency || (country === "US" ? "usd" : country === "CA" ? "cad" : country === "GB" ? "gbp" : "ngn"),
    account_holder_name: initialData.account_holder_name || "",
    account_holder_type: initialData.account_holder_type || vendorType,
    routing_number: initialData.routing_number || "",
    account_number: initialData.account_number || "",
    bankCode: initialData.bankCode || "",
    branchCode: initialData.branchCode || "001",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_number.trim()) {
      newErrors.account_number = "Account number is required";
    }
    if (!formData.account_holder_name.trim()) {
      newErrors.account_holder_name = "Account holder name is required";
    }
    if (country === "NG" && !formData.bankCode) {
      newErrors.bankCode = "Bank is required";
    }
    if (["US", "CA"].includes(country) && !formData.routing_number) {
      newErrors.routing_number = "Routing number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const submitData: Record<string, any> = {
        object: formData.object,
        country: formData.country,
        currency: formData.currency,
        account_holder_name: formData.account_holder_name,
        account_holder_type: formData.account_holder_type,
        account_number: formData.account_number,
      };
      
      // Generate routing number for Nigeria in format AAAANGBB
      if (country === "NG" && formData.bankCode) {
        submitData.routing_number = `${formData.bankCode}NG${formData.branchCode || "001"}`;
      } else if (formData.routing_number) {
        submitData.routing_number = formData.routing_number;
      }
      
      onNext(submitData);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {vendorType === 'company' ? 'Company Bank Account Details' : 'Bank Account Details'}
      </h2>
      <p className="text-gray-600 mb-6">
        Add your {vendorType === 'company' ? 'company ' : ''}bank account to receive payouts
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {country === "NG" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank *
              </label>
              <select
                name="bankCode"
                value={formData.bankCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Bank</option>
                {nigerianBanksUtils.getBanksSortedByName().map(bank => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {errors.bankCode && <p className="mt-1 text-sm text-red-600">{errors.bankCode}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="3-digit branch code (default: 001)"
                maxLength={3}
              />
              <p className="mt-1 text-xs text-gray-500">Leave as 001 if you don't know your branch code</p>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Holder Name *
          </label>
          <input
            type="text"
            name="account_holder_name"
            value={formData.account_holder_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Full name as it appears on your account"
          />
          {errors.account_holder_name && <p className="mt-1 text-sm text-red-600">{errors.account_holder_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Number *
          </label>
          <input
            type="text"
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder={country === "NG" ? "10-digit account number" : "Account number"}
          />
          {errors.account_number && <p className="mt-1 text-sm text-red-600">{errors.account_number}</p>}
        </div>

        {["US", "CA"].includes(country) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Routing Number *
            </label>
            <input
              type="text"
              name="routing_number"
              value={formData.routing_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="9-digit routing number"
            />
            {errors.routing_number && <p className="mt-1 text-sm text-red-600">{errors.routing_number}</p>}
          </div>
        )}

        <div className="flex justify-between pt-6 border-t mt-6">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-400"
          >
            Back
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
