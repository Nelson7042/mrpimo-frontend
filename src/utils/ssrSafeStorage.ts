import { createJSONStorage, type StateStorage } from "zustand/middleware";

/**
 * A no-op storage for server-side rendering where browser localStorage is unavailable.
 *
 * Node.js 22+ exposes a global `localStorage` object (via --localstorage-file),
 * but it is NOT the same as the browser's Web Storage API and will throw
 * "localStorage.getItem is not a function". We must explicitly check for `window`
 * to distinguish browser from server.
 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * SSR-safe storage for Zustand persist middleware.
 * Returns browser localStorage on the client, no-op storage on the server.
 */
export const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    return window.localStorage;
  }
  return noopStorage;
});
