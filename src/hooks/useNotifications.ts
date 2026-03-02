import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';
import { API_BASE_URL } from '@/utils/config';

const BASE_URL = `${API_BASE_URL}/notifications`;
interface NotificationPreferences {
  stockAlert?: boolean;
  orderStatus?: boolean;
  pendingReviews?: boolean;
  paymentUpdates?: boolean;
  newsletter?: boolean;
  push?: boolean;
  sms?: boolean;
  marketing?: boolean;
}

// Queries
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetchWithAuth(BASE_URL);
      return response.json();
    },
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export const useNotificationById = (id: string) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      const response = await fetchWithAuth(`${BASE_URL}/${id}`);
      return response.json();
    },
    enabled: !!id
  });
};

// Mutations
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
        method: 'PATCH'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(BASE_URL, {
        method: 'PATCH'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
    }
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
    }
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(BASE_URL, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
    }
  });
};

export const useBulkMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetchWithAuth(`${BASE_URL}/bulk`, {
        method: 'PATCH',
        body: JSON.stringify({ ids })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
    }
  });
};

export const useBulkDeleteNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetchWithAuth(`${BASE_URL}/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
    }
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
       const response = await fetchWithAuth(`${API_BASE_URL}/users/notifications/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Notification preferences updated', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to update preferences', toastConfigError);
    },
  });
};