import { useResponsive } from "@/hooks/useResponsive";
import { HelpCircle, TriangleAlert } from "lucide-react";
import React from "react";

type Props = {
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  label: string;
  error?: string;
  placeholder: string;
  className?: string;
  descritpionHeight?: string;
  type?: string;
  id?: string;
  required?: boolean;
  helperText?: string;
  min?: string;
};

const Input: React.FC<Props> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  className,
  error,
  descritpionHeight = "min-h-40",
  type = "text",
  required,
  helperText,
  min,
}) => {
  const { isMobileOrTablet } = useResponsive();
  return (
    <div className={`flex flex-col gap-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-1">
          {label && (
            <label htmlFor={id} className={` text-xs ${required ? "after:ml-0.5 after:text-red-500 after:content-['*'] after:text-lg after:leading-none after:align-top" : ""}`}>
              {label}
            </label>
          )}
          {helperText && !isMobileOrTablet && (
            <div className="relative group">
              <HelpCircle size={14} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-gray-800 text-white p-2 rounded text-xs w-48 z-10">
                {helperText}
              </div>
            </div>
          )}
        </div>
      </div>
      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`border border-gray-300 text-xs rounded-md px-3 py-2 focus:outline-none placeholder:text-gray-500 placeholder:italic ${descritpionHeight} focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-500" : ""
          }`}
        />
      ) : (
        <input
          type={type || "text"}
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          min={type === "datetime-local" ? min : undefined}
          className={`border border-gray-300 rounded-md text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500 placeholder:italic ${
            error ? "border-red-500" : ""
          }`}
        />
      )}
      {helperText && !error && isMobileOrTablet && (
        <div className="text-[10px] text-blue-500 italic">{helperText}</div>
      )}
      {error && <span className="text-red-500 text-[10px]">{error}</span>}
    </div>
  );
};

export default Input;
