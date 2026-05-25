"use client";

import { useState, useCallback } from "react";
import type { DocsManifest, DocSection } from "./page";
import DocsSidebar from "./DocsSidebar";
import DocsContent from "./DocsContent";
import ApiSandbox from "./ApiSandbox";
import { loadSectionContent } from "./actions";

interface DocsLayoutProps {
  manifest: DocsManifest;
  initialContent: string;
}

export default function DocsLayout({ manifest, initialContent }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  const currentSectionId = activeSection ?? "index";

  const loadFileContent = useCallback(async (filePath: string) => {
    setLoading(true);
    try {
      const markdown = await loadSectionContent(filePath);
      setContent(
        markdown ??
          "# Content Not Available\n\nThe documentation content for this section could not be loaded."
      );
    } catch {
      setContent("# Error\n\nFailed to load documentation content.");
    } finally {
      setLoading(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSectionClick = useCallback(async (section: DocSection) => {
    setActiveSection(section.id);
    setSidebarOpen(false);
    await loadFileContent(section.file);
  }, [loadFileContent]);

  const handleChildClick = useCallback(
    async (
      section: DocSection,
      child: { id: string; title: string; anchor: string }
    ) => {
      // If we're already on this section, just scroll to anchor
      if (activeSection === section.id) {
        const anchorElement = document.querySelector(child.anchor);
        if (anchorElement) {
          anchorElement.scrollIntoView({ behavior: "smooth" });
        }
        setSidebarOpen(false);
        return;
      }

      // Otherwise load the section first, then scroll
      setActiveSection(section.id);
      setSidebarOpen(false);
      await loadFileContent(section.file);

      // Allow content to render before scrolling to anchor
      setTimeout(() => {
        const anchorElement = document.querySelector(child.anchor);
        if (anchorElement) {
          anchorElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    },
    [activeSection, loadFileContent]
  );

  const handleInternalLinkClick = useCallback(
    async (filePath: string) => {
      // Find the matching section in the manifest to update sidebar highlight
      const matchingSection = manifest.sections.find(
        (s) => s.file === filePath
      );
      if (matchingSection) {
        setActiveSection(matchingSection.id);
      }
      await loadFileContent(filePath);
    },
    [manifest.sections, loadFileContent]
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-sm lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[280px] bg-gray-50 border-r border-gray-200
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <DocsSidebar
          sections={manifest.sections}
          activeSection={activeSection}
          generatedAt={manifest.generatedAt}
          onSectionClick={handleSectionClick}
          onChildClick={handleChildClick}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:px-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500 text-sm">Loading...</div>
            </div>
          ) : (
            <>
              <DocsContent
                markdown={content}
                sectionId={currentSectionId}
                onInternalLinkClick={handleInternalLinkClick}
              />
              {/* API Sandbox — always visible at the bottom */}
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">API Sandbox</h2>
                <p className="text-sm text-gray-600 mb-4">Test API endpoints directly. Enter your auth token, set parameters, and send requests.</p>
                <ApiSandbox baseUrl={process.env.NEXT_PUBLIC_API_BASE_URL || ""} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
