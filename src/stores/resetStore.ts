import { useProductStore } from "./useProductStore";
import { useUserStore } from "./useUserStore";
import { useVendorStore } from "./useVendorStore";


export const resetAllStores = () => {
  // Reset each store's in-memory state first
  useUserStore.getState().resetStore();
  useProductStore.getState().resetStore();
  useVendorStore.getState().resetStore();

  // Then clear all localStorage to remove persisted data
  // This must come AFTER store resets to prevent persist middleware
  // from re-writing stale state
  localStorage.clear();
};

export const softResetAllStores = () => {
  // reset each store
  useUserStore.getState().resetStore();
  useVendorStore.getState().resetStore();
  // ...any other persisted stores
};