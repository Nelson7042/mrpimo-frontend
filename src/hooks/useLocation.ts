import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

interface UpdateLocationParams {
  addressId: string;
  latitude: number;
  longitude: number;
}

interface UpdateVendorLocationParams {
  latitude: number;
  longitude: number;
}

const API_BASE = `${API_BASE_URL}`;

const locationApi = {
  updateUserLocation: async ({ addressId, latitude, longitude }: UpdateLocationParams) => {
    const response = await fetchWithAuth(
      `${API_BASE}/location/users/addresses/${addressId}/location`,
      {
        method: "POST",
        body: JSON.stringify({ latitude, longitude }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update location");
    }
    return response.json();
  },

  updateVendorLocation: async ({ latitude, longitude }: UpdateVendorLocationParams) => {
    const response = await fetchWithAuth(
      `${API_BASE}/location/vendors/pickup-location`,
      {
        method: "POST",
        body: JSON.stringify({ latitude, longitude }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update pickup location");
    }
    return response.json();
  },

  findNearestStation: async (latitude: number, longitude: number) => {
    const response = await fetchWithAuth(
      `${API_BASE}/location/nearest-station`,
      {
        method: "POST",
        body: JSON.stringify({ latitude, longitude }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to find nearest station");
    }
    return response.json();
  },

  validateDelivery: async (addressId: string) => {
    const response = await fetchWithAuth(
      `${API_BASE}/location/validate-delivery`,
      {
        method: "POST",
        body: JSON.stringify({ addressId }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to validate delivery");
    }
    return response.json();
  },
};

export const useUpdateUserLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationApi.updateUserLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Location updated successfully", toastConfigSuccess);
    },
    onError: (error: Error) => {
      toast.error(error.message, toastConfigError);
    },
  });
};

export const useUpdateVendorLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationApi.updateVendorLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor"] });
      toast.success("Pickup location set successfully", toastConfigSuccess);
    },
    onError: (error: Error) => {
      toast.error(error.message, toastConfigError);
    },
  });
};

export const useFindNearestStation = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      locationApi.findNearestStation(latitude, longitude),
    onError: (error: Error) => {
      toast.error(error.message, toastConfigError);
    },
  });
};

export const useValidateDelivery = () => {
  return useMutation({
    mutationFn: locationApi.validateDelivery,
    onError: (error: Error) => {
      toast.error(error.message, toastConfigError);
    },
  });
};
