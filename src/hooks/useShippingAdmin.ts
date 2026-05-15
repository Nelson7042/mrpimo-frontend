import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingAdminService, ShippingOrdersFilters, ShippingOrdersResponse, ConfirmHandoffParams, RejectHandoffParams, MarkDeliveredParams, OverrideStatusParams } from '@/utils/shippingAdminService';
import { toast } from 'react-hot-toast';

export const useShippingOrders = (filters: ShippingOrdersFilters = {}) => {
  return useQuery({
    queryKey: ['shipping-admin-orders', filters],
    queryFn: () => shippingAdminService.getOrders(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useConfirmHandoff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ConfirmHandoffParams) => shippingAdminService.confirmHandoff(params),
    onMutate: async (params) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shipping-admin-orders'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData<ShippingOrdersResponse>({ queryKey: ['shipping-admin-orders'] });

      // Optimistically update the cache
      queryClient.setQueriesData<ShippingOrdersResponse>(
        { queryKey: ['shipping-admin-orders'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order) => {
              if (order._id !== params.orderId) return order;
              return {
                ...order,
                shipments: order.shipments.map((shipment) => {
                  if (shipment._id !== params.shipmentId) return shipment;
                  return {
                    ...shipment,
                    items: shipment.items.map((item, idx) => {
                      if (idx !== params.itemIndex) return item;
                      return { ...item, handoffStatus: 'confirmed' as const };
                    }),
                  };
                }),
              };
            }),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Handoff confirmed successfully');
      queryClient.invalidateQueries({ queryKey: ['shipping-admin-orders'] });
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      toast.error(error.message || 'Failed to confirm handoff');
    },
  });
};

export const useRejectHandoff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RejectHandoffParams) => shippingAdminService.rejectHandoff(params),
    onMutate: async (params) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shipping-admin-orders'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData<ShippingOrdersResponse>({ queryKey: ['shipping-admin-orders'] });

      // Optimistically update the cache
      queryClient.setQueriesData<ShippingOrdersResponse>(
        { queryKey: ['shipping-admin-orders'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order) => {
              if (order._id !== params.orderId) return order;
              return {
                ...order,
                shipments: order.shipments.map((shipment) => {
                  if (shipment._id !== params.shipmentId) return shipment;
                  return {
                    ...shipment,
                    items: shipment.items.map((item, idx) => {
                      if (idx !== params.itemIndex) return item;
                      return { ...item, handoffStatus: 'rejected' as const };
                    }),
                  };
                }),
              };
            }),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Handoff rejected');
      queryClient.invalidateQueries({ queryKey: ['shipping-admin-orders'] });
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      toast.error(error.message || 'Failed to reject handoff');
    },
  });
};


export const useMarkDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MarkDeliveredParams) => shippingAdminService.markDelivered(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['shipping-admin-orders'] });

      const previousData = queryClient.getQueriesData<ShippingOrdersResponse>({ queryKey: ['shipping-admin-orders'] });

      // Optimistically update shipment status to delivered
      queryClient.setQueriesData<ShippingOrdersResponse>(
        { queryKey: ['shipping-admin-orders'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order) => {
              if (order._id !== params.orderId) return order;
              return {
                ...order,
                shipments: order.shipments.map((shipment) => {
                  if (shipment._id !== params.shipmentId) return shipment;
                  return {
                    ...shipment,
                    shipping: { ...shipment.shipping, status: 'delivered' },
                  };
                }),
              };
            }),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Shipment marked as delivered');
      queryClient.invalidateQueries({ queryKey: ['shipping-admin-orders'] });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      toast.error(error.message || 'Failed to mark as delivered');
    },
  });
};

export const useOverrideStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: OverrideStatusParams) => shippingAdminService.overrideStatus(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['shipping-admin-orders'] });

      const previousData = queryClient.getQueriesData<ShippingOrdersResponse>({ queryKey: ['shipping-admin-orders'] });

      // Optimistically update shipment status
      queryClient.setQueriesData<ShippingOrdersResponse>(
        { queryKey: ['shipping-admin-orders'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order) => {
              if (order._id !== params.orderId) return order;
              return {
                ...order,
                shipments: order.shipments.map((shipment) => {
                  if (shipment._id !== params.shipmentId) return shipment;
                  return {
                    ...shipment,
                    shipping: { ...shipment.shipping, status: params.status },
                  };
                }),
              };
            }),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Shipment status overridden successfully');
      queryClient.invalidateQueries({ queryKey: ['shipping-admin-orders'] });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      toast.error(error.message || 'Failed to override status');
    },
  });
};

export const useAuditLog = (orderId: string, shipmentId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['shipping-admin-audit-log', orderId, shipmentId],
    queryFn: () => shippingAdminService.getAuditLog(orderId, shipmentId),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};
