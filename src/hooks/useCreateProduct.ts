import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-toastify';

interface CreateProductResponse {
  success: boolean;
  product: any;
  message: string;
}

interface ValidationErrorResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

const createProductAPI = async (productData: any): Promise<CreateProductResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData: ValidationErrorResponse = await response.json();
    
    // Log detailed validation errors to console
    console.error('Product creation failed:', {
      message: errorData.message,
      errors: errorData.errors,
      requestData: productData
    });
    
    // Create a detailed error message
    let errorMessage = errorData.message || 'Failed to create product';
    if (errorData.errors && errorData.errors.length > 0) {
      errorMessage = errorData.errors.join(', ');
    }
    
    throw new Error(errorMessage);
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
    onError: (error: Error) => {
      console.error('Failed to create product:', error.message);
      // Show detailed error in toast
      toast.error(error.message || 'Failed to create product');
    },
  });
};