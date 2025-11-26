import { User } from "@/types/user.type";
import ICryptoWallet from "@/types/wallet.type";
import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
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
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    user: state.user,
    deviceId: state.deviceId,
    wallet: state.wallet,
  }),
  version: 1,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user: User | null) => set({ user }),
      
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      refreshUser: async () => {
        try {
          const response = await fetch('http://localhost:5800/api/v1/users/profile', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            set({ user: data.user });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      deviceId: null,
      setDeviceId: (deviceId: string | null) => set({ deviceId }),
      wallet: null,
      setWallet: (wallet: ICryptoWallet | null) => set({wallet}),

      resetStore: () => {
        useUserStore.persist.clearStorage();
        set({ user: null, deviceId: null, wallet: null });
      },
    }),
    persistConfig
  )
);
