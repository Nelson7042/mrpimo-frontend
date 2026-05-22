"use client";

import { useState, useCallback } from "react";
import type { DocSection } from "./page";
import DocsSearch from "./DocsSearch";

interface DocsSidebarProps {
  sections: DocSection[];
  activeSection: string | null;
  generatedAt: string;
  onSectionClick: (section: DocSection) => void;
  onChildClick: (section: DocSection, child: { id: string; title: string; anchor: string }) => void;
}

export default function DocsSidebar({
  sections,
  activeSection,
  generatedAt,
  onSectionClick,
  onChildClick,
}: DocsSidebarProps) {
  const [filteredSections, setFilteredSections] = useState<DocSection[]>(sections);

  const handleFilterChange = useCallback((filtered: DocSection[]) => {
    setFilteredSections(filtered);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">API Docs</h2>
        <p className="text-xs text-gray-500 mt-1">
          Generated: {new Date(generatedAt).toLocaleDateString()}
        </p>
      </div>

      <DocsSearch sections={sections} onFilterChange={handleFilterChange} />

      <nav className="flex-1 overflow-y-auto p-4" aria-label="Documentation navigation">
        {filteredSections.length === 0 ? (
          <p className="text-sm text-gray-500 px-3 py-2">No matching endpoints found</p>
        ) : (
          <ul className="space-y-1">
            {filteredSections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => onSectionClick(section)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                    ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  {section.title}
                </button>

                {/* Nested children (endpoint sub-sections with anchors) */}
                {section.children && activeSection === section.id && (
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {section.children.map((child) => (
                      <li key={child.id}>
                        <button
                          className="w-full text-left px-3 py-1.5 rounded text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          onClick={() => onChildClick(section, child)}
                        >
                          {child.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}
