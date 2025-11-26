import { useMutation, useQuery } from '@tanstack/react-query';
import { checkoutService, CheckoutData } from '@/utils/checkoutService';
import { toast } from 'react-hot-toast';

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: (data: CheckoutData) => checkoutService.createOrder(data),
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      return data
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order');
    },
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: (data: { items: any[], paymentMethod: string, tokenType?: string }) =>
      checkoutService.createPaymentIntent(data),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create payment intent');
    },
  });
};

export const useValidateCart = () => {
  return useQuery({
    queryKey: ['validate-cart'],
    queryFn: () => checkoutService.validateCart(),
    enabled: false,
  });
};