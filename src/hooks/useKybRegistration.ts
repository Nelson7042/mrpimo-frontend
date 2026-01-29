import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-hot-toast';

export const useKybRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/vendor-registration/step-1`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Step 1 completed successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit registration');
    },
  });
};

export const useKybStep2Registration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/vendor-registration/step-2-business`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Step 2 registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Business information submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit business information');
    },
  });
};

export const useKybStep3Registration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/vendor-registration/step-bank-account`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Step 3 registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Bank account information submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit bank account information');
    },
  });
};
