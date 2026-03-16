/**
 * React-Query hooks for Cash Store data.
 *
 * Each hook wraps a single API call with caching, dedup, and retry.
 * The main useCashStoreSection hook composes these for the page.
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function useCashStoreHomepageQuery() {
  return useQuery({
    queryKey: queryKeys.cashStore.homepage(),
    queryFn: async () => {
      const cashStoreApi = (await import('@/services/cashStoreApi')).default;
      return cashStoreApi.getHomepageData();
    },
    staleTime: 5 * 60_000, // 5 min (matches old cache TTL)
  });
}

export function useCashbackSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.cashStore.summary(),
    queryFn: async () => {
      const cashbackService = (await import('@/services/cashbackApi')).default;
      return cashbackService.getCashbackSummary();
    },
  });
}

export function useFeaturedCouponsQuery() {
  return useQuery({
    queryKey: queryKeys.cashStore.coupons(),
    queryFn: async () => {
      const couponService = (await import('@/services/couponApi')).default;
      return couponService.getFeaturedCoupons();
    },
  });
}

export function useGiftCardBrandsQuery() {
  return useQuery({
    queryKey: queryKeys.cashStore.giftCards(),
    queryFn: async () => {
      const realVouchersApi = (await import('@/services/realVouchersApi')).default;
      return realVouchersApi.getVoucherBrands({ featured: true, limit: 10 });
    },
  });
}

export function useCashbackActivityQuery() {
  return useQuery({
    queryKey: queryKeys.cashStore.activity(),
    queryFn: async () => {
      const cashbackService = (await import('@/services/cashbackApi')).default;
      return cashbackService.getCashbackHistory({ limit: 5 });
    },
  });
}
