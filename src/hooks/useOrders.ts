import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/utils/orderService';
import { toast } from 'react-hot-toast';

export const useUserOrders = (page = 1, limit = 10, status?: string) => {
  return useQuery({
    queryKey: ['user-orders', page, limit, status],
    queryFn: () => orderService.getUserOrders(page, limit, status),
  });
};

export const useOrderById = (orderId: string) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
  });
};

export const useTrackOrder = (trackingNumber: string) => {
  return useQuery({
    queryKey: ['track-order', trackingNumber],
    queryFn: () => orderService.trackOrder(trackingNumber),
    enabled: !!trackingNumber,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      orderService.cancelOrder(orderId, reason),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });
};

export const useRequestRefund = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, reason, amount }: { orderId: string; reason: string; amount?: number }) =>
      orderService.requestRefund(orderId, reason, amount),
    onSuccess: () => {
      toast.success('Refund request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request refund');
    },
  });
};