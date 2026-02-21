import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, TriangleAlert } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";

type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  helperText?: string;
};

const Select = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {isMobileOrTablet} = useResponsive()

  // Generate a unique field ID for scroll-to-error functionality
  const fieldId = props.label?.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = props.options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-y-1 ${props.className}`} data-field-id={fieldId}>
      <div className="flex justify-between items-center">
        {props.label && <label className={`text-xs ${props.required ? "after:ml-0.5 after:text-red-500 after:content-['*'] after:text-lg after:leading-none after:align-top" : ""}`}>{props.label}</label>}
      </div>
      <div className="relative w-full" ref={dropdownRef}>
        <div
          className={`border rounded-md px-3 py-2 flex justify-between items-center cursor-pointer text-xs focus:outline-none transition-colors duration-200 ${
            props.error 
              ? "border-red-500 border-2 bg-red-50/30" 
              : "border-gray-300 focus:ring-1 focus:ring-blue-500"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`${!props.value ? "text-gray-500 italic" : ""}`}>{props.value || props.placeholder || "Select an option"}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="p-2 border-b border-gray-200 flex items-center">
              <Search size={14} className="text-gray-400 mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs outline-none"
                placeholder="Search..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <li
                    key={index}
                    className={`px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer border-b last:border-0 border-gray-200 ${
                      props.value === option ? "bg-blue-50 text-blue-600" : ""
                    }`}
                    onClick={() => {
                      props.onChange(option);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {option}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-xs text-gray-500">No results found</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {props.error && (
        <div className="flex items-center gap-x-1 mt-0.5">
          <TriangleAlert size={12} className="text-red-500 flex-shrink-0" />
          <span className="text-red-500 text-[10px] font-medium">{props.error}</span>
        </div>
      )}
      {props.helperText && !props.error && isMobileOrTablet && (
        <span className="text-blue-500 text-[10px] italic">{props.helperText}</span>
      )}
    </div>
  );
};

export default Select;
