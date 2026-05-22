import fs from "fs";
import path from "path";
import DocsLayout from "./DocsLayout";

export interface DocSection {
  id: string;
  title: string;
  file: string;
  children?: { id: string; title: string; anchor: string }[];
}

export interface DocsManifest {
  sections: DocSection[];
  generatedAt: string;
}

function loadManifest(): DocsManifest | null {
  try {
    const manifestPath = path.join(
      process.cwd(),
      "..",
      "mprimo-backend",
      "docs",
      "api",
      "manifest.json"
    );
    const raw = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(raw) as DocsManifest;
  } catch {
    return null;
  }
}

function loadMarkdownFile(filePath: string): string | null {
  try {
    const fullPath = path.join(
      process.cwd(),
      "..",
      "mprimo-backend",
      "docs",
      "api",
      filePath
    );
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}

export default function DocsPage() {
  const manifest = loadManifest();

  if (!manifest) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Documentation Unavailable
          </h1>
          <p className="text-gray-600">
            The API documentation manifest could not be loaded. Please ensure the
            documentation has been generated.
          </p>
        </div>
      </div>
    );
  }

  const initialContent =
    loadMarkdownFile("README.md") ?? "# API Documentation\n\nSelect a section from the sidebar.";

  return (
    <DocsLayout
      manifest={manifest}
      initialContent={initialContent}
    />
  );
}
