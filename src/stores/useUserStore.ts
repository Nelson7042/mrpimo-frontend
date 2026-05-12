import { User } from "@/types/user.type";
import ICryptoWallet from "@/types/wallet.type";
import { create } from "zustand";
import {
  persist,
  type PersistOptions,
} from "zustand/middleware";
import { refreshToken } from "@/utils/refreshToken";
import { ssrSafeStorage } from "@/utils/ssrSafeStorage";

interface UserState {
  user: User | null;
  _hasHydrated: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  deviceId: string | null;
  setDeviceId: (deviceId: any) => void;
  wallet: ICryptoWallet | null;
  setWallet: (wallet: ICryptoWallet | null) => void;
  resetStore: () => void;
}

type PersistedState = Pick<UserState, "user" | "deviceId" | "wallet" >;


// Define persist configuration
const persistConfig: PersistOptions<UserState, PersistedState> = {
  name: "user-storage",
  storage: ssrSafeStorage,
  partialize: (state) => ({
    user: state.user,
    deviceId: state.deviceId,
    wallet: state.wallet,
  }),
  version: 1,
  onRehydrateStorage: () => (state) => {
    if (state) {
      state._hasHydrated = true;
    }
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      _hasHydrated: false,
      deviceId: null,
      wallet: null,
      
      setUser: (user: User | null) => {
        set({ user });
      },
      
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      refreshUser: async () => {
        try {
          await refreshToken();
        } catch (error) {
          get().resetStore();
        }
      },

      logout: () => set({ user: null, wallet: null }),

      setDeviceId: (deviceId: string | null) => set({ deviceId }),
      
      setWallet: (wallet: ICryptoWallet | null) => set({ wallet }),

      resetStore: () => {
        set({ user: null, deviceId: null, wallet: null });
      },
    }),
    persistConfig
  )
);
