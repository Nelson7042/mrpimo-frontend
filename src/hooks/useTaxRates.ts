import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

export interface TaxRate {
  _id: string;
  country: string;
  state: string | null;
  rate: number;
  name: string;
  isInclusive: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaxRatesResponse {
  success: boolean;
  data: TaxRate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TaxLookupResponse {
  success: boolean;
  data: {
    rate: number;
    name: string;
    isInclusive: boolean;
  };
}

// Fetch all tax rates (admin)
const fetchTaxRates = async (page = 1, limit = 50, country?: string): Promise<TaxRatesResponse> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (country) params.append("country", country);
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/tax-rates?${params}`);
  if (!response.ok) throw new Error("Failed to fetch tax rates");
  return response.json();
};

// Lookup tax rate for a location (public)
const lookupTaxRate = async (country: string, state?: string): Promise<TaxLookupResponse> => {
  const params = new URLSearchParams({ country });
  if (state) params.append("state", state);
  const response = await fetch(`${API_BASE_URL}/tax-rates/lookup?${params}`);
  if (!response.ok) throw new Error("Failed to lookup tax rate");
  return response.json();
};

export const useTaxRates = (page = 1, limit = 50, country?: string) => {
  return useQuery({
    queryKey: ["taxRates", page, limit, country],
    queryFn: () => fetchTaxRates(page, limit, country),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTaxLookup = (country: string, state?: string) => {
  return useQuery({
    queryKey: ["taxLookup", country, state],
    queryFn: () => lookupTaxRate(country, state),
    enabled: !!country,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateTaxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      country: string;
      state?: string;
      rate: number;
      name: string;
      isInclusive?: boolean;
      isActive?: boolean;
    }) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/tax-rates`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create tax rate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxRates"] });
    },
  });
};

export const useUpdateTaxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; rate?: number; name?: string; isInclusive?: boolean; isActive?: boolean }) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/tax-rates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to update tax rate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxRates"] });
    },
  });
};

export const useDeleteTaxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/tax-rates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete tax rate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxRates"] });
    },
  });
};
