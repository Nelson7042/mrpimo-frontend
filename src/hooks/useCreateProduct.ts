import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

interface CreateProductResponse {
  success: boolean;
  product: any;
  message: string;
}

const createProductAPI = async (productData: any): Promise<CreateProductResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create product');
  }

  return response.json();
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductAPI,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
      queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
    },
  });
};