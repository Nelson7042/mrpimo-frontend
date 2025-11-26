import { create } from "zustand";

interface AuthModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  authType: string;
  setAuthType: (authType: string) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  authType: "",
  setAuthType: (authType: string)=> set({authType})
}));