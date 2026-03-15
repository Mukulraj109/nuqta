import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute — data considered fresh
      gcTime: 5 * 60_000, // 5 minutes — garbage collect unused cache
      retry: 2,
      refetchOnWindowFocus: false, // RN doesn't have window focus
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0, // Never auto-retry mutations (especially payments)
    },
  },
});
