import { useQueryClient } from '@tanstack/react-query';

export const useRefreshProducts = () => {
  const queryClient = useQueryClient();

  const refreshProducts = () => {
    // Invalidate and refetch product list queries
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
    queryClient.invalidateQueries({ queryKey: ['allProducts'] });
    queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
    queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
    queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
    queryClient.invalidateQueries({ queryKey: ['drafts'] });
    // Invalidate vendor analytics queries
    queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
  };

  return { refreshProducts };
};