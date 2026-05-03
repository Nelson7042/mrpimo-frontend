/**
 * Next.js Instrumentation Hook
 *
 * Node.js v22+ ships an experimental global `localStorage` object
 * (via the --localstorage-file flag). This object does NOT implement
 * the Web Storage API — calling `.getItem()` on it throws:
 *   TypeError: localStorage.getItem is not a function
 *
 * Many libraries (Zustand persist, etc.) check for `localStorage`
 * existence and assume it's the browser Web Storage API. On Node 22+
 * that assumption breaks.
 *
 * This instrumentation hook runs before any application code and
 * removes the broken Node.js localStorage global on the server side,
 * so that all `typeof localStorage` checks correctly return "undefined".
 */
export async function register() {
  if (typeof window === "undefined" && typeof globalThis.localStorage !== "undefined") {
    // Delete the Node.js built-in localStorage that doesn't implement Web Storage API
    delete (globalThis as any).localStorage;
  }
}
