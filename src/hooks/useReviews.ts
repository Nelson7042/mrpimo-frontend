import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchPublic } from '@/utils/fetchPublic';
import { API_BASE_URL } from '@/utils/config';

interface UserReview {
  _id: string;
  productName: string;
  productImage: string | null;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface UserReviewsResponse {
  success: boolean;
  reviews: UserReview[];
  pagination: Pagination;
}

interface FeaturedReview {
  _id: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  comment: string;
  rating: number;
}

interface FeaturedReviewsResponse {
  success: boolean;
  reviews: FeaturedReview[];
}

export const useUserReviews = (page: number = 1, limit: number = 10) => {
  const { data, isLoading, isError, error } = useQuery<UserReviewsResponse, Error>({
    queryKey: ['user-reviews', page, limit],
    queryFn: async () => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/reviews/my-reviews?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user reviews');
      }

      return response.json();
    },
  });

  return {
    reviews: data?.reviews ?? [],
    pagination: data?.pagination ?? { page, limit, total: 0, hasMore: false },
    isLoading,
    isError,
    error,
  };
};

export const useFeaturedReviews = () => {
  const { data, isLoading, isError } = useQuery<FeaturedReviewsResponse, Error>({
    queryKey: ['featured-reviews'],
    queryFn: async () => {
      const response = await fetchPublic(`${API_BASE_URL}/reviews/featured`);

      if (!response.ok) {
        throw new Error('Failed to fetch featured reviews');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    reviews: data?.reviews ?? [],
    isLoading,
    isError,
  };
};
