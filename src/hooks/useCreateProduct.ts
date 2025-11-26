import { useMutation } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface CreateProductResponse {
  success: boolean;
  product: any;
  message: string;
}

const createProductAPI = async (productData: any): Promise<CreateProductResponse> => {
  const response = await fetchWithAuth('http://localhost:5800/api/v1/products', {
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
  return useMutation({
    mutationFn: createProductAPI,
    onSuccess: (data) => {
      console.log('Product created successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
    },
  });
};