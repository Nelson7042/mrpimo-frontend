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

      const data = await response.json();
      
      if (!response.ok) {
        // Check for requires_review status - this is not a failure, just needs admin review
        if (data.data?.vendor?.kycStatus === 'requires_review') {
          return {
            ...data,
            success: false,
            requiresReview: true,
          };
        }
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.requiresReview) {
        toast.success('Your identity verification is under review. An administrator will review your information shortly.');
      } else {
        toast.success('Step 1 completed successfully');
      }
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

