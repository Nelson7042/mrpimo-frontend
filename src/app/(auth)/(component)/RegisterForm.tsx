"use client";

import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import FullButton from "@/components/FullButton";
import { useLoginUser, useSignUp } from "@/hooks/mutations";
import { useUserStore } from "@/stores/useUserStore";
import { Eye, ChevronDown, Search } from "lucide-react";
import { Country } from "country-state-city";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

interface LoginProps {
  setAuthState?: (authState: "login" | "recover" | "otp") => void;
  close?: () => void;
}

const RegisterForm = ({ setAuthState, close }: LoginProps) => {
  const [open, setOpen] = React.useState(false);

  const toggle = () => {
    setOpen(!open);
  };

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    Country.getAllCountries().find((c) => c.isoCode === "US") ||
      Country.getAllCountries()[0]
  );
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: signUpUser, isPending } = useSignUp();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
        setCountrySearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter countries based on search query
  const filteredCountries = Country.getAllCountries().filter((country) =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      confirmPassword: "",
    };

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required.";
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid.";
    }

    if (password && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Perform validation and submit the form if valid
    if (validateForm()) {
      // Submit the form
      signUpUser(
        {
          firstName,
          lastName,
          email,
          phoneNumber: `+${selectedCountry.phonecode}${phoneNumber}`,
          password,
          role: "customer",
        },
        {
          onSuccess: (data) => {
            // if (onLoginSuccess) {
            //   if (data.has2faEnabled) {
            //     onLoginSuccess(data)
            //   }
            // }

            // setUser(data.user);
            toast.success(
              data.message || "Login successful",
              toastConfigSuccess
            );
            setIsLoading(false);
            if (setAuthState) setAuthState("otp");
          },
          onError: (error) => {
            // console.error("Login failed:", error);
            toast.error(error.message, toastConfigError);
            setIsLoading(false);
          },
        }
      );
    } else {
      console.log("Form submission failed.");
      toast.error(
        "Form submission failed. Please ensure you provided the necessary fields",
        toastConfigError
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          First Name
        </label>
        <input
          type="text"
          placeholder="Enter your first name"
          className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary"
          required
          name="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        {errors.firstName && (
          <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
        )}
      </div>

      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          Middle Name <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          placeholder="Enter your middle name"
          className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary"
          name="middleName"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
        />
      </div>

      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          Last Name
        </label>
        <input
          type="text"
          placeholder="Enter your last name"
          className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary"
          required
          name="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        {errors.lastName && (
          <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
        )}
      </div>

      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          Email
        </label>
        <input
          type="email"
          placeholder="Enter your email address"
          className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary"
          required
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          Phone Number
        </label>
        <div className="flex">
          <div className="relative" ref={countryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="h-[48px] w-[100px] md:w-[120px] px-[8px] py-[12px] text-[12px] md:text-[14px] text-[#344054] bg-[#F7F9FC] border-[#D0D5DD] border-[0.2px] rounded-l-[8px] focus:outline-none flex items-center justify-between pr-2 md:pr-4"
            >
              <span className="flex items-center gap-1 truncate">
                <span>{selectedCountry.flag}</span>
                <span className="truncate">+{selectedCountry.phonecode}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                  isCountryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCountryDropdownOpen && (
              <div className="absolute z-50 mt-1 w-[280px] md:w-[320px] bg-white border border-[#D0D5DD] rounded-[8px] shadow-lg max-h-[300px] flex flex-col">
                {/* Search Input */}
                <div className="p-2 border-b border-[#D0D5DD] sticky top-0 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="w-full h-[36px] pl-9 pr-3 text-[14px] text-[#344054] bg-[#F7F9FC] border border-[#D0D5DD] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Country List */}
                <div className="overflow-y-auto max-h-[240px]">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.isoCode}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsCountryDropdownOpen(false);
                          setCountrySearchQuery("");
                        }}
                        className={`w-full px-3 py-2 text-left text-[14px] hover:bg-[#F7F9FC] flex items-center gap-2 ${
                          selectedCountry.isoCode === country.isoCode
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="flex-1 text-[#344054]">{country.name}</span>
                        <span className="text-[#98A2B3]">+{country.phonecode}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-[14px] text-gray-500">
                      No countries found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <input
            type="tel"
            placeholder="Enter phone number"
            className="flex-1 h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] border-l-0 rounded-r-[8px] focus:outline-none "
            required
            name="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          New Password
        </label>
        <div className="relative flex items-center">
          <input
            type={open === false ? "password" : "text"}
            placeholder="Input your new password"
            className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary"
            required
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="absolute right-[16px]">
            {open === false ? (
              <Eye size="16" color="#98A2B3" onClick={toggle} />
            ) : (
              <FaEyeSlash size="16" color="#98A2B3" onClick={toggle} />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Password must be 8 characters, a special character and Numeric figure
        </p>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      <div className="mb-[10px]">
        <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
          Confirm Password
        </label>
        <div className="relative flex items-center">
          <input
            type={open === false ? "password" : "text"}
            placeholder="Input your password"
            className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px] border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary"
            required
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="absolute right-[16px]">
            {open === false ? (
              <Eye size="16" color="#98A2B3" onClick={toggle} />
            ) : (
              <FaEyeSlash size="16" color="#98A2B3" onClick={toggle} />
            )}
          </div>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <div className="mb-4 md:mb-6 mt-4 md:mt-6">
        <FullButton
          action={() => {}}
          isLoading={isLoading}
          color="blue"
          name="Sign Up"
        />
      </div>
    </form>
  );
};

export default RegisterForm;
