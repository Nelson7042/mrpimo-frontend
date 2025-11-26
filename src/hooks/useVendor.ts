import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '@/utils/vendorService';
import { toast } from 'react-hot-toast';

export const useVendorAnalytics = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendor-analytics', vendorId],
    queryFn: () => vendorService.getAnalytics(vendorId),
    enabled: !!vendorId,
  });
};

export const useVendorOrders = (vendorId: string, page = 1, limit = 10, status?: string) => {
  return useQuery({
    queryKey: ['vendor-orders', vendorId, page, limit, status],
    queryFn: () => vendorService.getOrders(vendorId, page, limit, status),
    enabled: !!vendorId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      vendorService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });
};

export const useVendorProducts = (vendorId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['vendor-products', vendorId, page, limit],
    queryFn: () => vendorService.getProducts(vendorId, page, limit),
    enabled: !!vendorId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: any) => vendorService.createProduct(productData),
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, productData }: { productId: string; productData: any }) =>
      vendorService.updateProduct(productId, productData),
    onSuccess: () => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => vendorService.deleteProduct(productId),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });
};

export const useVendorPayouts = (vendorId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['vendor-payouts', vendorId, page, limit],
    queryFn: () => vendorService.getPayouts(vendorId, page, limit),
    enabled: !!vendorId,
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ amount, method }: { amount: number; method: string }) =>
      vendorService.requestPayout(amount, method),
    onSuccess: () => {
      toast.success('Payout request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-payouts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request payout');
    },
  });
};