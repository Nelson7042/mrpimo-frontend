import { useQueryClient } from '@tanstack/react-query';

export const useRefreshProducts = () => {
  const queryClient = useQueryClient();

  const refreshProducts = () => {
    // Invalidate and refetch products queries
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    queryClient.invalidateQueries({ queryKey: ['drafts'] });
  };

  return { refreshProducts };
};