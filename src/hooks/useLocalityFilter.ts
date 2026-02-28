import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mprimo_locality";

// Subscribe to sessionStorage changes within the same tab
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Returns the current locality filter value and a setter.
 * - `null` or absent  → default (local + international)
 * - `"local"`         → local products only
 */
export function useLocalityFilter() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocality = useCallback((v: "local" | null) => {
    if (v === null) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, v);
    }
    notify();
  }, []);

  return { locality: value as "local" | null, setLocality };
}
