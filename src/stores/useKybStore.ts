import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './useUserStore';

interface KybFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  countryCode: string;
  nationalIDNumber: string;
  accountType: string;
  voterCardType: string;
  civIdType: string;
  idCardFront: File | null;
  idCardBack: File | null;
  vendorId: string | null;
  businessName: string;
  shippingZone: string;
  registrationNumber: string;
  registrationName: string;
  premium: boolean;
  businessDocument: File | null;
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  bankCode: string;
  bankStatement: File | null;
}

interface KybStore {
  formData: KybFormData;
  currentStep: number;
  setFormData: (data: Partial<KybFormData>) => void;
  setCurrentStep: (step: number) => void;
  resetForm: () => void;
  initializeFromUser: () => void;
}

const initialFormData: KybFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  countryCode: '',
  nationalIDNumber: '',
  accountType: 'business',
  voterCardType: '',
  civIdType: '',
  idCardFront: null,
  idCardBack: null,
  vendorId: null,
  businessName: '',
  shippingZone: '',
  registrationNumber: '',
  registrationName: '',
  premium: false,
  businessDocument: null,
  accountName: '',
  accountNumber: '',
  bankName: '',
  routingNumber: '',
  bankCode: '',
  bankStatement: null,
};

export const useKybStore = create<KybStore>()(
  persist(
    (set) => ({
      formData: initialFormData,
      currentStep: 1,
      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      setCurrentStep: (step) => set({ currentStep: step }),
      resetForm: () => set({ formData: initialFormData, currentStep: 1 }),
      initializeFromUser: () => {
        const user = useUserStore.getState().user;
        if (user?.profile) {
          set((state) => ({
            formData: {
              ...state.formData,
              firstName: user.profile.firstName || '',
              lastName: user.profile.lastName || '',
            },
          }));
        }
      },
    }),
    {
      name: 'kyb-registration',
    }
  )
);
