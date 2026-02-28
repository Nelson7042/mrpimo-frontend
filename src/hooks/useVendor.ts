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
    onSuccess: (_, variables) => {
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
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
      // Invalidate product list queries
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
      queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
      // Invalidate vendor analytics queries
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
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
    onSuccess: (_, variables) => {
      toast.success('Product updated successfully');
      // Invalidate product list queries
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
      queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
      // Invalidate specific product queries
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      // Invalidate vendor analytics queries
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
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
      // Invalidate product list queries
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
      queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
      // Invalidate vendor analytics queries
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
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
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request payout');
    },
  });
};


export const useFulfillmentOptions = (orderId: string, shipmentId: string) => {
  return useQuery({
    queryKey: ['fulfillment-options', orderId, shipmentId],
    queryFn: () => vendorService.getFulfillmentOptions(orderId, shipmentId),
    enabled: !!orderId && !!shipmentId,
  });
};

export const useFulfillShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      shipmentId,
      body,
    }: {
      orderId: string;
      shipmentId: string;
      body: { fulfillmentMethod: "pickup" | "dropoff"; serviceCentreId?: number };
    }) => vendorService.fulfillShipment(orderId, shipmentId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['fulfillment-options', variables.orderId, variables.shipmentId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to fulfill shipment');
    },
  });
};

export const useExperienceCentres = (stationId: number) => {
  return useQuery({
    queryKey: ['experience-centres', stationId],
    queryFn: () => vendorService.getExperienceCentres(stationId),
    enabled: !!stationId,
  });
};

