import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchSuggestion } from "@/types/search.types";
import { Loader2 } from "lucide-react";

interface SearchDropdownProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  onClose: () => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  suggestions,
  isLoading,
  onClose,
}) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Searching...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {suggestions.map((product) => (
        <Link
          key={product._id}
          href={{
            pathname: "/home/product-details/[slug]",
            query: {
              slug: product.slug,
              productData: JSON.stringify(product),
            },
          }}
          as={`/home/product-details/${product.slug}`}
          onClick={onClose}
          className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
        >
          <div className="relative w-12 h-12 mr-3 flex-shrink-0">
            <Image
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover rounded"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 truncate">
              {product.category?.sub?.[product.category.sub.length - 1]?.name ||
                product.category?.main?.name ||
                "General"}
            </p>
            {product.variants?.[0]?.options?.[0]?.price && (
              <p className="text-sm font-semibold text-blue-600">
                ₦ {product.variants[0].options[0].price.toLocaleString()}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};