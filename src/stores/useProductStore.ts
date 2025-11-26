import { ProductType } from "@/types/product.type";
import Vendor from "@/types/vendor.type";

import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";

interface ProductState {
  vendor: Vendor | null;
  setVendor: (vendor: Vendor | null) => void;
  listedProducts: ProductType[] | [];
  setListedProducts: (listedProducts: ProductType[] | []) => void;
  clearProductStore: () => void;
  resetStore: () => void;
}

type PersistedState = Pick<ProductState, "listedProducts" | "vendor">;

// Define persist configuration
const persistConfig: PersistOptions<ProductState, PersistedState> = {
  name: "product-storage",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    listedProducts: state.listedProducts,
    vendor: state.vendor,
  }),
  version: 1,
};

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      vendor: null,
      setVendor: (vendor: Vendor | null) => set({ vendor }),
      listedProducts: [],
      setListedProducts: (listedProducts: ProductType[] | []) =>
        set({ listedProducts }),
      clearProductStore: () => {
        set({ vendor: null, listedProducts: [] });
        localStorage.removeItem("product-storage"); // explicitly clear it
      },
      resetStore: () => {
        useProductStore.persist.clearStorage();
        set({ vendor: null, listedProducts: [] });
      }
    }),
    persistConfig
  )
);



