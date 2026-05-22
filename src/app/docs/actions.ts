"use server";

import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "..", "mprimo-backend", "docs", "api");

export async function loadSectionContent(sectionFile: string): Promise<string | null> {
  try {
    // Sanitize the file path to prevent directory traversal
    const normalized = path.normalize(sectionFile);
    if (normalized.includes("..") || path.isAbsolute(normalized)) {
      return null;
    }

    const fullPath = path.join(DOCS_DIR, normalized);
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}
