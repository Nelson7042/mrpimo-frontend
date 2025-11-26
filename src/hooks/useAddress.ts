import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface Address {
  _id?: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5800/api/v1';

const addressApi = {
  getAddresses: async (): Promise<{ addresses: Address[] }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/address`);
    if (!response.ok) throw new Error('Failed to fetch addresses');
    return response.json();
  },

  addAddress: async (data: { address: Omit<Address, '_id'>, duplicateForShipping?: boolean }) => {
    const response = await fetchWithAuth(`${API_BASE}/users/address`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Add address failed:', response.status, text);
      throw new Error(`Failed to add address: ${response.status}`);
    }
    return response.json();
  },

  updateAddress: async (address: Address) => {
    const response = await fetchWithAuth(`${API_BASE}/users/address`, {
      method: 'PATCH',
      body: JSON.stringify({ address }),
    });
    if (!response.ok) throw new Error('Failed to update address');
    return response.json();
  },

  deleteAddress: async (addressId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/address/${addressId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete address');
    return response.json();
  },
};

export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: addressApi.getAddresses,
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addressApi.addAddress,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      // Refresh user data to update addresses
      const { useUserStore } = await import('@/stores/useUserStore');
      await useUserStore.getState().refreshUser();
      toast.success('Address added successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to add address', toastConfigError);
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addressApi.updateAddress,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      // Refresh user data to update addresses
      const { useUserStore } = await import('@/stores/useUserStore');
      await useUserStore.getState().refreshUser();
      toast.success('Address updated successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to update address', toastConfigError);
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addressApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to delete address', toastConfigError);
    },
  });
};