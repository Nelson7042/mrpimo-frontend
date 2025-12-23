import { User } from "@/types/user.type";
import ICryptoWallet from "@/types/wallet.type";
import { API_BASE_URL } from "@/utils/config";
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

// Only persist essential user data
type PersistedState = {
  user: {
    _id: string;
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    isEmailVerified: boolean;
  } | null;
  deviceId: string | null;
  wallet: ICryptoWallet | null;
};


// Define persist configuration with better mobile support
const persistConfig: PersistOptions<UserState, PersistedState> = {
  name: "user-storage",
  storage: createJSONStorage(() => {
    // Ensure localStorage is available (important for mobile)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage;
    }
    // Fallback to in-memory storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }),
  partialize: (state) => {
    // Only store essential user data, not addresses or full preferences
    if (!state.user) {
      return {
        user: null,
        deviceId: state.deviceId,
        wallet: state.wallet,
      };
    }
    
    return {
      user: {
        _id: state.user._id,
        email: state.user.email,
        role: state.user.role,
        profile: {
          firstName: state.user.profile.firstName,
          lastName: state.user.profile.lastName,
          avatar: state.user.profile.avatar,
        },
        isEmailVerified: state.user.isEmailVerified,
      },
      deviceId: state.deviceId,
      wallet: state.wallet,
    };
  },
  version: 1,
  skipHydration: false,
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
          const response = await fetch(`${API_BASE_URL}/users/profile`, {
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
