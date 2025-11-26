"use client";
import React, { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneNumberInputProps {
  error?: string;
  onChange: any;
  value: string;
}

const PhoneNumberInput = ({
  value,
  onChange,
  error,
}: PhoneNumberInputProps) => {
  const [touched, setTouched] = useState(false);

  console.log(value);

  return (
    <div className="relative w-full mb-4">
      <label
        htmlFor="phone"
        className="absolute -top-2 left-3 px-1 text-xs font-semibold bg-white z-10"
      >
        Phone number
      </label>
      <PhoneInput
        international={true}
        defaultCountry="US"
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        className={`rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 ${
          error
            ? "border-red-500 text-red-700 focus:ring-red-300"
            : "border-gray-300 text-gray-500 focus:ring-gray-400"
        }`}
      />

      {touched && value && !isValidPhoneNumber(value) && (
        <p className="text-red-500 text-xs mt-1">Invalid phone number</p>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;
