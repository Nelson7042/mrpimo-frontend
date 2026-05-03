import { ProductType } from "@/types/product.type";
import { User } from "@/types/user.type";
import {IVendor} from "@/types/vendor.type";
import { create } from "zustand";
import {
  persist,
  type PersistOptions,
} from "zustand/middleware";
import { ssrSafeStorage } from "@/utils/ssrSafeStorage";

interface VendorState {
  vendor: IVendor | null;
  setVendor: (vendor: IVendor | null) => void;
  listedProducts?: ProductType[] | [];
  setListedProducts?: (listedProducts: ProductType[] | []) => void;
  clearVendorStore: () => void;
  resetStore: () => void;
}

type PersistedState = Pick<VendorState, "vendor" | "listedProducts">;

// Define persist configuration
const persistConfig: PersistOptions<VendorState, PersistedState> = {
  name: "vendor-storage",
  storage: ssrSafeStorage,
  partialize: (state) => ({
    vendor: state.vendor,
    listedProducts: state.listedProducts,
  }),
  version: 1,
};

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendor: null,
      setVendor: (vendor: IVendor | null) => {
        set({ vendor });
      },
    
      clearVendorStore: () => {
        set({ vendor: null, listedProducts: [] });
        if (typeof window !== "undefined") localStorage.removeItem("vendor-storage"); 
      },
      resetStore: () => {
        useVendorStore.persist.clearStorage();
        set({ vendor: null });
      },
    }),
    persistConfig
  )
);
