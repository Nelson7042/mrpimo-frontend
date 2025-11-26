import { useProductStore } from "./useProductStore";
import { useUserStore } from "./useUserStore";
import { useVendorStore } from "./useVendorStore";


export const resetAllStores = async () => {
  // reset each store
  useUserStore.getState().resetStore();
  useProductStore.getState().resetStore();
  useVendorStore.getState().resetStore();
  // ...any other persisted stores
};