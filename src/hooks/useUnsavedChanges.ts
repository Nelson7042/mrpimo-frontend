'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Determines if the form is dirty by comparing current values against saved values.
 * Returns true if at least one field value differs from its corresponding saved value.
 */
export function isDirty<T extends Record<string, unknown>>(
  currentValues: T,
  savedValues: T
): boolean {
  const keys = Object.keys(currentValues);
  for (const key of keys) {
    const current = currentValues[key];
    const saved = savedValues[key];

    // Handle arrays
    if (Array.isArray(current) && Array.isArray(saved)) {
      if (current.length !== saved.length) return true;
      for (let i = 0; i < current.length; i++) {
        if (current[i] !== saved[i]) return true;
      }
      continue;
    }

    // Handle objects (shallow comparison)
    if (
      current !== null &&
      saved !== null &&
      typeof current === 'object' &&
      typeof saved === 'object' &&
      !Array.isArray(current) &&
      !Array.isArray(saved)
    ) {
      const currentObj = current as Record<string, unknown>;
      const savedObj = saved as Record<string, unknown>;
      const objKeys = new Set([
        ...Object.keys(currentObj),
        ...Object.keys(savedObj),
      ]);
      for (const k of objKeys) {
        if (currentObj[k] !== savedObj[k]) return true;
      }
      continue;
    }

    // Primitive comparison
    if (current !== saved) return true;
  }
  return false;
}

interface UseUnsavedChangesOptions<T extends Record<string, unknown>> {
  /** Current form values */
  currentValues: T;
  /** Last saved form values */
  savedValues: T;
  /** Optional custom message for the confirmation dialog */
  message?: string;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

interface UseUnsavedChangesReturn {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Whether the confirmation dialog is currently showing */
  isDialogOpen: boolean;
  /** Confirm leaving (discard changes and proceed with navigation) */
  confirmLeave: () => void;
  /** Cancel leaving (stay on page with unsaved changes) */
  cancelLeave: () => void;
}

/**
 * Hook that tracks form dirty state and intercepts navigation when there are unsaved changes.
 * Shows a confirmation dialog asking the user to confirm leaving or stay.
 *
 * Intercepts:
 * - Next.js router navigation (pushState/replaceState)
 * - Browser beforeunload (tab close, refresh)
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export function useUnsavedChanges<T extends Record<string, unknown>>(
  options: UseUnsavedChangesOptions<T>
): UseUnsavedChangesReturn {
  const {
    currentValues,
    savedValues,
    message = 'You have unsaved changes. Leave anyway?',
    enabled = true,
  } = options;

  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);

  const dirty = enabled ? isDirty(currentValues, savedValues) : false;

  // Handle browser beforeunload event
  useEffect(() => {
    if (!dirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own message, but we set returnValue for compatibility
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dirty, message]);

  // Intercept Next.js client-side navigation via pushState/replaceState
  useEffect(() => {
    if (!dirty) return;

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    const interceptNavigation = (
      originalFn: typeof window.history.pushState,
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) => {
      if (isNavigatingRef.current) {
        // Allow navigation if user confirmed
        originalFn(data, unused, url);
        return;
      }

      // Store the pending URL and show dialog
      pendingNavigationRef.current = url?.toString() || null;
      setIsDialogOpen(true);
    };

    window.history.pushState = function (data: unknown, unused: string, url?: string | URL | null) {
      interceptNavigation(originalPushState, data, unused, url);
    };

    window.history.replaceState = function (data: unknown, unused: string, url?: string | URL | null) {
      interceptNavigation(originalReplaceState, data, unused, url);
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [dirty]);

  // Handle popstate (browser back/forward)
  useEffect(() => {
    if (!dirty) return;

    const handlePopState = (e: PopStateEvent) => {
      if (isNavigatingRef.current) return;

      // Push the current state back to prevent navigation
      window.history.pushState(null, '', window.location.href);
      pendingNavigationRef.current = null; // Will use history.back() on confirm
      setIsDialogOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dirty]);

  const confirmLeave = useCallback(() => {
    isNavigatingRef.current = true;
    setIsDialogOpen(false);

    if (pendingNavigationRef.current) {
      router.push(pendingNavigationRef.current);
    } else {
      // For popstate (back button), go back
      window.history.back();
    }

    // Reset after navigation
    setTimeout(() => {
      isNavigatingRef.current = false;
      pendingNavigationRef.current = null;
    }, 100);
  }, [router]);

  const cancelLeave = useCallback(() => {
    setIsDialogOpen(false);
    pendingNavigationRef.current = null;
  }, []);

  return {
    isDirty: dirty,
    isDialogOpen,
    confirmLeave,
    cancelLeave,
  };
}
