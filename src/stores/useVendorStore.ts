import { ProductType } from "@/types/product.type.ts_";
import { User } from "@/types/user.type";
import {IVendor} from "@/types/vendor.type";
import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";

interface VendorState {
  vendor: IVendor | null;
  setVendor: (vendor: IVendor | null) => void;
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
      setVendor: (vendor: IVendor | null) => set({ vendor }),
    
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
