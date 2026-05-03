import { ProductType } from "@/types/product.type";
import {IVendor} from "@/types/vendor.type";

import { create } from "zustand";
import {
  persist,
  type PersistOptions,
} from "zustand/middleware";
import { ssrSafeStorage } from "@/utils/ssrSafeStorage";

interface ProductState {
  vendor: IVendor | null;
  setVendor: (vendor: IVendor | null) => void;
  listedProducts: ProductType[] | [];
  setListedProducts: (listedProducts: ProductType[] | []) => void;
  clearProductStore: () => void;
  resetStore: () => void;
}

type PersistedState = Pick<ProductState, "listedProducts" | "vendor">;

// Define persist configuration
const persistConfig: PersistOptions<ProductState, PersistedState> = {
  name: "product-storage",
  storage: ssrSafeStorage,
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
      setVendor: (vendor: IVendor | null) => set({ vendor }),
      listedProducts: [],
      setListedProducts: (listedProducts: ProductType[] | []) =>
        set({ listedProducts }),
      clearProductStore: () => {
        set({ vendor: null, listedProducts: [] });
        if (typeof window !== "undefined") localStorage.removeItem("product-storage");
      },
      resetStore: () => {
        useProductStore.persist.clearStorage();
        set({ vendor: null, listedProducts: [] });
      }
    }),
    persistConfig
  )
);



