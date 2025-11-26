"use client";

import React, { useState } from "react";
import Input from "./Input";
import Select, { SingleValue } from "react-select";
import countries from "world-countries";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import Link from "next/link";
import { useRouter } from "next/router";

type Props = {};
type Option = {
  value: string;
  label: string;
};

const countryOptions: Option[] = countries.map((country) => ({
  value: country.name.common,
  label: country.name.common,
}));

const BusinessRegistration = (props: Props) => {
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [password, setPassword] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [selected, setSelected] = useState<Option | null>(null);
  const [serverError, setServerError] = useState("")
  const [errors, setErrors] = useState({
    businessName: "",
    businessEmail: "",
    password: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const router = useRouter();

  const handleChange = (value: SingleValue<Option>) => {
    setSelected(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Form submitted:", {
      businessName,
      businessEmail,
      password,
      street,
      city,
      state,
      postalCode,
      country: selected,
    });
    e.preventDefault();

    const newErrors = {
      businessName: "",
      businessEmail: "",
      password: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
    };

    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    }
    if (!businessEmail.trim()) {
      newErrors.businessEmail = "Business email is required.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }
    if (!street.trim()) {
      newErrors.street = "Street address is required.";
    }
    if (!city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!state.trim()) {
      newErrors.state = "State/Province is required.";
    }
    if (!postalCode.trim()) {
      newErrors.postalCode = "Postal code is required.";
    }
    if (businessEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(businessEmail)) {
        newErrors.businessEmail = "Please enter a valid email address.";
      }
    }
    if (password && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5800/api/v1/auth/register-vendor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessName,
            businessEmail,
            password,
            street,
            city,
            state,
            postalCode,
            country: selected?.value || "",
          }),
        }
      );

      const data = await response.json();

      console.log("Server response:", data);

      if (response.ok) {
        toast.success("Registration successful!", toastConfigSuccess);
        
        // Redirect to Stripe verification if onboarding link is provided
        if (data.accountId && data.stripeVerificationDetails) {
          localStorage.setItem("account", JSON.stringify(data.stripeVerificationDetails))
          router.push(`/vendor/verification/${data.accountId}`)
        } else {
          // Fallback to login
          window.location.href = "/login";
        }
      } else {
        console.error("Registration failed:", data);
        toast.error(data.message, toastConfigError);
        if (data.message) {
          setServerError(data.message)
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("An error occurred during registration. Please try again.");
    }
  };

  return (
    <div className="md:px-10">
      <p className="text-xs text-gray-500 mb-4 text-center">
        Please fill in the details below to register your business.
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          id="business-name"
          label="Business Name"
          placeholder="Type your Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          error={errors.businessName}
        />
        <Input
          id="business-email"
          label="Business Email"
          placeholder="Type your Business Email"
          value={businessEmail}
          onChange={(e) => setBusinessEmail(e.target.value)}
          error={errors.businessEmail}
          type="email"
        />
        <Input
          id="password"
          label="Password"
          placeholder="Type your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          type="password"
        />

        <div className="relative w-full mb-5">
          <label className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-1 text-xs bg-white text-black z-10">
            Business Address
          </label>
          <div className="border border-gray-300 rounded-md p-4 pt-6">
            <Input
              id="street"
              label="Street Address"
              placeholder="Enter street address"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              error={errors.street}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="city"
                label="City"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
              />
              <Input
                id="state"
                label="State/Province"
                placeholder="Enter state or province"
                value={state}
                onChange={(e) => setState(e.target.value)}
                error={errors.state}
              />
            </div>
            <Input
              id="postal-code"
              label="Postal Code"
              placeholder="Enter postal code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              error={errors.postalCode}
            />
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 px-1 text-xs bg-white text-black z-10">
                Select Country
              </label>
              <Select
                options={countryOptions}
                value={selected}
                onChange={(value) => handleChange(value)}
                className="text-xs rounded-md shadow-sm placeholder:text-gray-400"
                classNamePrefix="react-select"
                placeholder="Where is your business registered?"
              />
              <p className="bg-blue-100 p-2 rounded-xl text-xs text-blue-800 mt-2">
                If your business isn't registered, select your country of
                residence.
              </p>
            </div>
          </div>
          {serverError && <p className="text-red-500 text-xs mt-2">{serverError}</p>}
        </div>

        <p className="text-xs my-3 font-[family-name:var(--font-inter)]">
          By selecting Create business account, you agree to our User Agreement
          and acknowledge reading our User Privacy Notice
        </p>
        <div className="flex items-center justify-center mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#5187f6] rounded-md cursor-pointer hover:bg-[#5187f8] focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Register Business Account
          </button>
        </div>
        <p className="mt-4 text-center text-gray-600 text-xs font-[family-name:var(--font-inter)]">
              <span>Already have an account? </span>
              <Link
                href="/login"
                className="text-[#5187f6] hover:text-[#5372b0]"
              >
                <span>Sign In</span>
              </Link>
            </p>
      </form>

    </div>
  );
};

export default BusinessRegistration;
