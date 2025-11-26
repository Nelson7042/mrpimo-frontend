import React from "react";

interface InputProps {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
}) => {
  return (
    <div className="relative w-full mb-5">
      {/* Label positioned top-left inside border */}
      <label
        htmlFor={id}
        className="absolute -top-2 left-3 text-xs bg-white text-black z-10"
      >
        {label}
      </label>

      {/* Input box with error styling */}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-3 text-xs md:text-xs border rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-500 text-red-700 focus:ring-red-300"
            : "border-gray-300 text-gray-500 focus:ring-gray-400"
        }`}
      />

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs md:text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;
