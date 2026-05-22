"use client";

import { useState, useCallback } from "react";
import type { DocSection } from "./page";

interface DocsSearchProps {
  sections: DocSection[];
  onFilterChange: (filtered: DocSection[]) => void;
}

export default function DocsSearch({ sections, onFilterChange }: DocsSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (!value.trim()) {
        onFilterChange(sections);
        return;
      }

      const lowerQuery = value.toLowerCase();

      const filtered = sections.filter((section) => {
        // Match section title
        if (section.title.toLowerCase().includes(lowerQuery)) {
          return true;
        }

        // Match section file path
        if (section.file.toLowerCase().includes(lowerQuery)) {
          return true;
        }

        // Match any child title
        if (
          section.children?.some((child) =>
            child.title.toLowerCase().includes(lowerQuery)
          )
        ) {
          return true;
        }

        return false;
      });

      onFilterChange(filtered);
    },
    [sections, onFilterChange]
  );

  return (
    <div className="px-5 py-3 border-b border-gray-200">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search endpoints..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search documentation"
        />
      </div>
    </div>
  );
}
