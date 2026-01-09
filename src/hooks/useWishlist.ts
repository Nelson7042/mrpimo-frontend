"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { WishlistResponse, Wishlist } from "@/types/wishlist.type";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { useEffect } from "react";
import { API_BASE_URL } from "@/utils/config";
import { useUserStore } from "@/stores/useUserStore";

const API_BASE = `${API_BASE_URL}`;

const wishlistApi = {
  getWishlist: async (): Promise<WishlistResponse> => {
    const response = await fetchWithAuth(`${API_BASE}/products/wishlist/user`);
    if (!response.ok) throw new Error("Failed to fetch wishlist");
    const data = await response.json();
    return data;
  },

  addToWishlist: async ({
    productId,
    price,
    productData,
  }: {
    productId: string;
    price: number;
    productData?: {
      name?: string;
      images?: string[];
    };
  }) => {
    const response = await fetchWithAuth(
      `${API_BASE}/products/wishlist/${productId}`,
      {
        method: "POST",
        body: JSON.stringify({ price }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add to wishlist");
    }
    return response.json();
  },

  removeFromWishlist: async ({ productId, variantId, optionId }: { productId: string; variantId?: string; optionId?: string }) => {
    const response = await fetchWithAuth(
      `${API_BASE}/products/wishlist/${productId}`,
      {
        method: "DELETE",
        body: JSON.stringify({ variantId, optionId }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to remove from wishlist");
    }
    return response.json();
  },

  clearWishlist: async () => {
    const response = await fetchWithAuth(
      `${API_BASE}/products/wishlist/clear`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to clear wishlist");
    return response.json();
  },
};

export const useWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const {
    setItems,
    addItem,
    removeItem,
    items,
    getWishlistLength,
    isInWishlist: storeIsInWishlist,
  } = useWishlistStore();

  const { data: wishlistData, isLoading, error } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.getWishlist,
    enabled: !!user?._id, // Only fetch when user is logged in
    refetchOnWindowFocus: false,
    retry: (failureCount, error:any) => {
      // Don't retry if it's a guest mode or session expired error
      if (error.message === "Guest mode" || error.message === "Session expired") {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (wishlistData?.success) {
      setItems(Array.isArray(wishlistData.data) ? wishlistData.data : []);
    } else if (!user) {
      // Clear wishlist when user is not logged in
      setItems([]);
    }
  }, [wishlistData, user, setItems]);

  const addToWishlistMutation = useMutation({
    mutationFn: wishlistApi.addToWishlist,
    onSuccess: (data, variables) => {
      // Optimistically update the store with the new item
      // Use response data if available, otherwise create from variables
      const wishlistItem: Wishlist = data?.data || {
        productId: variables.productId,
        name: variables.productData?.name || "",
        images: variables.productData?.images || [],
        price: variables.price,
        variantId: "",
        addedAt: new Date().toISOString(),
        priceWhenAdded: variables.price,
      };
      
      addItem(wishlistItem);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist!", toastConfigSuccess);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add to wishlist", toastConfigError);
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: ({ productId, variantId, optionId, silent }: { productId: string; variantId?: string; optionId?: string; silent?: boolean }) => 
      wishlistApi.removeFromWishlist({ productId, variantId, optionId }),
    onSuccess: async (_, { productId, variantId, optionId, silent }) => {
      const updatedItems = items.filter(item => {
        if (variantId && optionId) {
          return !(item.productId === productId && item.variantId === variantId && item.optionId === optionId);
        }
        if (variantId) {
          return !(item.productId === productId && item.variantId === variantId);
        }
        return item.productId !== productId;
      });
      setItems(updatedItems);
      await queryClient.refetchQueries({ queryKey: ["wishlist"] });
      if (!silent) {
        toast.success("Removed from wishlist", toastConfigSuccess);
      }
    },
    onError: (error: Error, { silent }) => {
      if (!silent) {
        toast.error(error.message || "Failed to remove from wishlist", toastConfigError);
      }
    },
  });

  const clearWishlistMutation = useMutation({
    mutationFn: wishlistApi.clearWishlist,
    onSuccess: () => {
      setItems([]);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Wishlist cleared", toastConfigSuccess);
    },
    onError: () => {
      toast.error("Failed to clear wishlist", toastConfigError);
    },
  });

  const isInWishlist = (productId: string) => {
    return storeIsInWishlist(productId);
  };

  return {
    wishlist: items,
    wishlistCount: getWishlistLength(),
    isLoading,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    clearWishlist: clearWishlistMutation.mutate,
    isInWishlist,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
  };
};
