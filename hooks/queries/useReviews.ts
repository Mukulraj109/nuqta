import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import reviewApi from '@/services/reviewApi';
import type { ReviewFilters } from '@/types/review.types';

export function useStoreReviews(storeId: string, filters?: ReviewFilters) {
  return useQuery({
    queryKey: queryKeys.reviews.byStore(storeId, filters),
    queryFn: () => reviewApi.getStoreReviews(storeId, filters),
    enabled: !!storeId,
  });
}

export function useUserReviews(filters?: ReviewFilters) {
  return useQuery({
    queryKey: ['reviews', 'user', filters] as const,
    queryFn: () => reviewApi.getUserReviews(filters),
  });
}

export function useCanUserReviewStore(storeId: string) {
  return useQuery({
    queryKey: ['reviews', 'canReview', storeId] as const,
    queryFn: () => reviewApi.canUserReviewStore(storeId),
    enabled: !!storeId,
  });
}
