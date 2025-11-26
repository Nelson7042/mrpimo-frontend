import { useMutation } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { toast } from 'react-toastify';
import { toastConfigSuccess, toastConfigError } from '@/app/config/toast.config';

export const useProductImport = () => {
  return useMutation({
    mutationFn: async ({ type, data }: { type: 'csv' | 'json' | 'shopify' | 'woocommerce', data: any }) => {
      const formData = new FormData();
      
      if (type === 'csv') {
        formData.append('file', data.file);
      } else if (type === 'json') {
        formData.append('products', JSON.stringify(data.products));
      } else if (type === 'shopify') {
        formData.append('apiKey', data.apiKey);
        formData.append('storeUrl', data.storeUrl);
      } else if (type === 'woocommerce') {
        formData.append('apiKey', data.apiKey);
        formData.append('apiSecret', data.apiSecret);
        formData.append('storeUrl', data.storeUrl);
      }

      const response = await fetchWithAuth(
        `http://localhost:5800/api/v1/products/import/${type}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Import completed: ${data.summary.successful}/${data.summary.total} products imported`, toastConfigSuccess);
    },
    onError: (error: Error) => {
      toast.error(error.message, toastConfigError);
    }
  });
};