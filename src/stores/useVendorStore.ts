import { ProductType } from "@/types/product.type";
import { User } from "@/types/user.type";
import Vendor from "@/types/vendor.type";
import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";

interface VendorState {
  vendor: Vendor | null;
  setVendor: (vendor: Vendor | null) => void;
  listedProducts?: ProductType[] | [];
  setListedProducts?: (listedProducts: ProductType[] | []) => void;
  clearVendorStore: () => void;
  resetStore: () => void;
}

type PersistedState = Pick<VendorState, "vendor">;

// Define persist configuration
const persistConfig: PersistOptions<VendorState, PersistedState> = {
  name: "vendor-storage",
  storage: createJSONStorage(() => localStorage),
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
      setVendor: (vendor: Vendor | null) => set({ vendor }),
    //   listedProducts: [],
    //   setListedProducts: (listedProducts: ProductType[] | []) =>
    //     set({ listedProducts }),
      clearVendorStore: () => {
        set({ vendor: null, listedProducts: [] });
        localStorage.removeItem("vendor-storage"); 
      },
      resetStore: () => {
        useVendorStore.persist.clearStorage();
        set({ vendor: null });
      },
    }),
    persistConfig
  )
);
