"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchSuggestion } from "@/types/search.types";
import Link from "next/link";
import Image from "next/image";
import { formatProductPrice } from "@/utils/formatPrice";

interface ProductSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onSearch,
  placeholder = "Search products...",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading } = useSearchSuggestions(debouncedQuery, 5);

  const suggestions = data?.suggestions || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.trim().length >= 2);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    // Navigate to product details
    window.location.href = `/home/product-details/${suggestion._id}`;
  };

  const handleSearch = () => {
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    } else if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {isLoading && (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          )}
          {!isLoading && query && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <Link
              key={suggestion._id}
              href={`/home/product-details/${suggestion._id}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? "bg-blue-50" : ""
              }`}
            >
              <div className="relative w-12 h-12 mr-3 flex-shrink-0">
                <Image
                  src={suggestion.images?.[0] || "/placeholder.svg"}
                  alt={suggestion.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.name}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.category?.sub?.[suggestion.category.sub.length - 1]?.name ||
                    suggestion.category?.main?.name ||
                    "General"}
                </p>
                {(() => {
                  const price = formatProductPrice(suggestion);
                  if (price && price !== "$0") {
                    return (
                      <p className="text-sm font-semibold text-blue-600">
                        {price}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No products found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSearchBar;

