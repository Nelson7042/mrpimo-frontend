import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkoutService, CheckoutData } from '@/utils/checkoutService';
import { toast } from 'react-hot-toast';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckoutData) => checkoutService.createOrder(data),
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      return data
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order');
    },
  });
};

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { items: any[], paymentMethod: string, tokenType?: string }) =>
      checkoutService.createPaymentIntent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
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

export const useCalculateShipping = () => {
  return useMutation({
    mutationFn: (deliveryMethod: string) => checkoutService.calculateShipping(deliveryMethod),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to calculate shipping');
    },
  });
};