/**
 * Payment Store Search Hook
 *
 * Custom hook for managing store search in the Pay-In-Store flow.
 * Handles search, nearby stores, recent payments, and popular stores.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PaymentStoreInfo,
  PaymentSearchCategory,
  PaymentSearchError,
  UsePaymentStoreSearchReturn,
  UserLocation,
  PAYMENT_CATEGORIES,
  PAYMENT_SEARCH_CONSTANTS,
} from '@/types/paymentStoreSearch.types';
import { useCurrentLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import { storeSearchService } from '@/services/storeSearchService';
import storePaymentApi from '@/services/storePaymentApi';
import apiClient from '@/services/apiClient';

/**
 * Check if store is currently open based on hours
 */
const isStoreOpenNow = (hours: any): { isOpen: boolean; openTime?: string; closeTime?: string } => {
  if (!hours) return { isOpen: true }; // Assume open if no hours data

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const currentDay = days[now.getDay()];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const todayHours = hours[currentDay];
  if (!todayHours || todayHours.closed) return { isOpen: false };

  const [openHour, openMin] = (todayHours.open || '09:00').split(':').map(Number);
  const [closeHour, closeMin] = (todayHours.close || '21:00').split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return {
    isOpen: currentTime >= openTime && currentTime <= closeTime,
    openTime: todayHours.open,
    closeTime: todayHours.close,
  };
};

/**
 * Known brand names for brand detection
 */
const KNOWN_BRANDS = [
  'baskin', 'robbins', 'mcdonald', 'kfc', 'burger king', 'starbucks', 'subway',
  'dominos', 'pizza hut', 'central', 'lifestyle', 'westside', 'pantaloons',
  'reliance', 'shoppers stop', 'max', 'bata', 'puma', 'nike', 'adidas',
  'decathlon', 'croma', 'vijay sales', 'big bazaar', 'dmart', 'more',
  'spencer', 'nature basket', 'foodhall', 'zara', 'h&m', 'uniqlo'
];

/**
 * Service category slugs/names for service detection
 */
const SERVICE_CATEGORIES = [
  'service', 'salon', 'spa', 'beauty', 'repair', 'maintenance',
  'healthcare', 'medical', 'dental', 'fitness', 'gym', 'yoga',
  'cleaning', 'laundry', 'car wash', 'automotive'
];

/**
 * Check if store is a brand based on name and other indicators
 */
const detectIsBrand = (store: any): boolean => {
  // Explicit flag from backend
  if (store.isBrand === true) return true;

  // Featured stores are often brands
  if (store.isFeatured === true) return true;

  // Check store name against known brands
  const nameLower = (store.name || '').toLowerCase();
  if (KNOWN_BRANDS.some(brand => nameLower.includes(brand))) return true;

  // Check tags for brand indicator
  const tags = store.tags || [];
  if (tags.some((tag: string) => tag.toLowerCase().includes('brand'))) return true;

  // Check if verified (verified stores are often brands)
  if (store.isVerified === true) return true;

  return false;
};

/**
 * Check if store is a service provider
 */
const detectIsService = (store: any): boolean => {
  // Explicit flag from backend
  if (store.isService === true) return true;

  // Check category
  const categoryName = (store.category?.name || '').toLowerCase();
  const categorySlug = (store.category?.slug || '').toLowerCase();
  if (SERVICE_CATEGORIES.some(svc => categoryName.includes(svc) || categorySlug.includes(svc))) return true;

  // Check tags
  const tags = store.tags || [];
  if (tags.some((tag: string) => SERVICE_CATEGORIES.some(svc => tag.toLowerCase().includes(svc)))) return true;

  return false;
};

/**
 * Check if store is a local store
 */
const detectIsLocal = (store: any, isBrand: boolean, isService: boolean): boolean => {
  // Explicit flag from backend
  if (store.isLocal === true) return true;

  // If not a brand and not a service, likely local
  if (!isBrand && !isService) return true;

  // Check tags for local indicator
  const tags = store.tags || [];
  if (tags.some((tag: string) => tag.toLowerCase().includes('local'))) return true;

  return false;
};

/**
 * Transform backend store data to PaymentStoreInfo format
 */
const transformToPaymentStore = (store: any, distance?: number): PaymentStoreInfo => {
  // Calculate if store is open
  const openStatus = isStoreOpenNow(store.operationalInfo?.hours);

  // Detect store type flags
  const isBrand = detectIsBrand(store);
  const isService = detectIsService(store);
  const isLocal = detectIsLocal(store, isBrand, isService);

  return {
    _id: store._id,
    name: store.name,
    slug: store.slug,
    logo: store.logo,
    description: store.description,
    category: {
      _id: store.category?._id || '',
      name: store.category?.name || 'General',
      slug: store.category?.slug || 'general',
      icon: store.category?.icon,
    },
    location: {
      address: store.location?.address || '',
      city: store.location?.city || '',
      state: store.location?.state,
      pincode: store.location?.pincode,
      coordinates: store.location?.coordinates,
    },
    distance: distance || store.distance,
    paymentSettings: {
      acceptUPI: store.paymentSettings?.acceptUPI ?? true,
      acceptCards: store.paymentSettings?.acceptCards ?? true,
      acceptPayLater: store.paymentSettings?.acceptPayLater ?? false,
      acceptRezCoins: store.paymentSettings?.acceptRezCoins ?? true,
      acceptPromoCoins: store.paymentSettings?.acceptPromoCoins ?? true,
      acceptPayBill: store.paymentSettings?.acceptPayBill ?? false,
      maxCoinRedemptionPercent: store.paymentSettings?.maxCoinRedemptionPercent ?? 50,
      allowHybridPayment: store.paymentSettings?.allowHybridPayment ?? true,
      allowOffers: store.paymentSettings?.allowOffers ?? true,
      allowCashback: store.paymentSettings?.allowCashback ?? true,
      upiId: store.paymentSettings?.upiId,
      upiName: store.paymentSettings?.upiName,
    },
    rewardRules: {
      baseCashbackPercent: store.rewardRules?.baseCashbackPercent ?? 2,
      reviewBonusCoins: store.rewardRules?.reviewBonusCoins ?? 10,
      socialShareBonusCoins: store.rewardRules?.socialShareBonusCoins ?? 5,
      minimumAmountForReward: store.rewardRules?.minimumAmountForReward ?? 25,
      extraRewardThreshold: store.rewardRules?.extraRewardThreshold,
      extraRewardCoins: store.rewardRules?.extraRewardCoins,
      visitMilestoneRewards: store.rewardRules?.visitMilestoneRewards,
    },
    ratings: {
      average: store.ratings?.average || 0,
      count: store.ratings?.count || 0,
    },
    isActive: store.isActive ?? true,
    hasRezPay: store.operationalInfo?.acceptsWalletPayment ?? store.hasRezPay ?? true,
    maxCashback: store.rewardRules?.baseCashbackPercent ?? store.offers?.cashback ?? store.maxCashback ?? 0,
    lastPaidAt: store.lastPaidAt,
    totalPayments: store.totalPayments,
    popularityScore: store.popularityScore,

    // Store flags - using detected values
    isFeatured: store.isFeatured ?? false,
    isBrand,
    isHot: store.isHot ?? false,
    isLocal,
    isOnline: store.isOnline ?? false,
    isVerified: store.isVerified ?? false,
    isOpen: openStatus.isOpen,
    isService,

    // Offers & Partner Info
    offers: {
      discount: store.offers?.cashback || store.rewardRules?.baseCashbackPercent || 0,
      cashback: store.offers?.cashback || store.rewardRules?.baseCashbackPercent || 0,
      maxCashback: store.offers?.maxCashback,
      minOrderAmount: store.offers?.minOrderAmount,
      isPartner: store.offers?.isPartner ?? false,
      partnerLevel: store.offers?.partnerLevel,
    },

    // Operational Info
    operationalInfo: {
      deliveryTime: store.operationalInfo?.deliveryTime,
      minimumOrder: store.operationalInfo?.minimumOrder,
      deliveryFee: store.operationalInfo?.deliveryFee,
      freeDeliveryAbove: store.operationalInfo?.freeDeliveryAbove,
      paymentMethods: store.operationalInfo?.paymentMethods,
      isOpenNow: openStatus.isOpen,
      openingTime: openStatus.openTime,
      closingTime: openStatus.closeTime,
    },

    // Delivery Categories (Store Features)
    deliveryCategories: {
      fastDelivery: store.deliveryCategories?.fastDelivery ?? false,
      budgetFriendly: store.deliveryCategories?.budgetFriendly ?? false,
      premium: store.deliveryCategories?.premium ?? false,
      organic: store.deliveryCategories?.organic ?? false,
      lowestPrice: store.deliveryCategories?.lowestPrice ?? false,
    },

    // Analytics
    analytics: {
      totalOrders: store.analytics?.totalOrders,
      followersCount: store.analytics?.followersCount,
    },

    // Contact
    contact: {
      phone: store.contact?.phone,
      whatsapp: store.contact?.whatsapp,
    },

    // Tags
    tags: store.tags || [],
  };
};

/**
 * Debounce helper
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Store tab types
export type StoreTab = 'all' | 'brands' | 'local' | 'services';

// Filter types
export interface StoreFilters {
  nearMe: boolean;
  offersAvailable: boolean;
  cashback: boolean;
}

/**
 * Main hook for payment store search
 */
export const usePaymentStoreSearch = (): UsePaymentStoreSearchReturn => {
  const { state: authState } = useAuth();
  const { currentLocation, refreshLocation, isLoading: isLoadingLocationContext } = useCurrentLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PaymentStoreInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<PaymentSearchError | null>(null);

  // Section data
  const [nearbyStores, setNearbyStores] = useState<PaymentStoreInfo[]>([]);
  const [recentStores, setRecentStores] = useState<PaymentStoreInfo[]>([]);
  const [popularStores, setPopularStores] = useState<PaymentStoreInfo[]>([]);

  // Loading states
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Category filter - default to 'all' to show all stores initially
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');

  // NEW: Filter chips state
  const [filters, setFilters] = useState<StoreFilters>({
    nearMe: true, // Default active
    offersAvailable: false,
    cashback: false,
  });

  // NEW: Tab state
  const [activeTab, setActiveTab] = useState<StoreTab>('all');

  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Refs
  const searchAbortController = useRef<AbortController | null>(null);
  const isInitialFetchDone = useRef(false);
  const isNearbyFetchDone = useRef(false);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, PAYMENT_SEARCH_CONSTANTS.DEBOUNCE_DELAY);

  /**
   * Format location for API
   */
  const formatLocationForAPI = useCallback((location: UserLocation): string => {
    return `${location.longitude},${location.latitude}`;
  }, []);

  /**
   * Request location permission and get current location
   */
  const requestLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const location = await refreshLocation();
      if (location) {
        // location.coordinates is an object { latitude, longitude }, not an array
        const lat = location.coordinates?.latitude;
        const lng = location.coordinates?.longitude;

        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          setUserLocation({
            latitude: lat,
            longitude: lng,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      setLocationError('Unable to get your location. Please enable location services.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [refreshLocation]);

  /**
   * Fetch nearby stores
   */
  const fetchNearbyStores = useCallback(async () => {
    // Validate that userLocation exists AND has valid coordinates
    if (!userLocation ||
        typeof userLocation.latitude !== 'number' ||
        typeof userLocation.longitude !== 'number' ||
        isNaN(userLocation.latitude) ||
        isNaN(userLocation.longitude)) {
      return;
    }

    setIsLoadingNearby(true);

    try {
      const locationString = formatLocationForAPI(userLocation);
      const response = await storeSearchService.getNearbyStores({
        location: locationString,
        radius: PAYMENT_SEARCH_CONSTANTS.DEFAULT_RADIUS,
        limit: PAYMENT_SEARCH_CONSTANTS.NEARBY_LIMIT,
      });

      if (response.success && response.data.stores) {
        const transformedStores = response.data.stores.map((store: any) =>
          transformToPaymentStore(store, store.distance)
        );
        setNearbyStores(transformedStores);
      }
    } catch (error) {
    } finally {
      setIsLoadingNearby(false);
    }
  }, [userLocation, formatLocationForAPI]);

  /**
   * Fetch recent payment stores (from payment history)
   */
  const fetchRecentStores = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    setIsLoadingRecent(true);

    try {
      const response = await storePaymentApi.getHistory({
        limit: PAYMENT_SEARCH_CONSTANTS.RECENT_LIMIT,
      });

      if (response.transactions && response.transactions.length > 0) {
        // Transform transaction history to PaymentStoreInfo
        // We need to fetch full store data for each unique store
        const uniqueStoreIds = [...new Set(response.transactions.map(t => t.storeId))];
        const storePromises = uniqueStoreIds.slice(0, 5).map(async (storeId) => {
          try {
            const storeInfo = await storePaymentApi.getStorePaymentInfo(storeId);
            const transaction = response.transactions.find(t => t.storeId === storeId);
            return {
              ...transformToPaymentStore(storeInfo),
              lastPaidAt: transaction?.completedAt || transaction?.createdAt,
            };
          } catch (err) {
            return null;
          }
        });

        const stores = (await Promise.all(storePromises)).filter(Boolean) as PaymentStoreInfo[];
        setRecentStores(stores);
      }
    } catch (error: any) {
      // Silently handle - no payment history is normal for new users
      // Only log in development for debugging
      if (__DEV__) {
        console.log('[PaymentStoreSearch] No payment history available:', error.message);
      }
      setRecentStores([]);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [authState.isAuthenticated]);

  /**
   * Fetch popular stores
   */
  const fetchPopularStores = useCallback(async () => {
    setIsLoadingPopular(true);
    setIsInitialLoading(true);

    try {
      // Use featured stores as popular stores
      const response = await storeSearchService.getFeaturedStores({
        limit: PAYMENT_SEARCH_CONSTANTS.POPULAR_LIMIT,
      });

      if (response.success && response.data?.stores) {
        const transformedStores = response.data.stores.map((store: any) =>
          transformToPaymentStore(store)
        );
        setPopularStores(transformedStores);
      } else {
        // Fallback: try to get all stores sorted by rating
        const fallbackResponse = await storeSearchService.searchStoresByCategory({
          category: 'all',
          sortBy: 'rating',
          limit: PAYMENT_SEARCH_CONSTANTS.POPULAR_LIMIT,
        });

        if (fallbackResponse.success && fallbackResponse.data?.stores) {
          const transformedStores = fallbackResponse.data.stores.map((store: any) =>
            transformToPaymentStore(store)
          );
          setPopularStores(transformedStores);
        }
      }
    } catch (error: any) {
      // Fallback: try to get all stores sorted by rating
      try {
        const fallbackResponse = await storeSearchService.searchStoresByCategory({
          category: 'all',
          sortBy: 'rating',
          limit: PAYMENT_SEARCH_CONSTANTS.POPULAR_LIMIT,
        });

        if (fallbackResponse.success && fallbackResponse.data?.stores) {
          const transformedStores = fallbackResponse.data.stores.map((store: any) =>
            transformToPaymentStore(store)
          );
          setPopularStores(transformedStores);
        }
      } catch (fallbackError: any) {
        // silently handle
      }
    } finally {
      setIsLoadingPopular(false);
      setIsInitialLoading(false);
    }
  }, []);

  /**
   * Execute search query
   */
  const executeSearch = useCallback(async (query: string, category: string | null, page: number = 1) => {
    // Cancel previous search
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    searchAbortController.current = new AbortController();

    // Only return early if no query and no category (null, not 'all')
    if (!query.trim() && category === null) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    if (page === 1) {
      setIsSearching(true);
    } else {
      setIsLoadingMore(true);
    }
    setSearchError(null);

    try {
      const locationParam = userLocation ? formatLocationForAPI(userLocation) : undefined;
      let response;

      // Handle 'all' category or no category - fetch all stores
      if (!query.trim() && (!category || category === 'all')) {
        response = await storeSearchService.searchStoresByCategory({
          category: 'all',
          page,
          limit: PAYMENT_SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE,
          sortBy: userLocation ? 'distance' : 'rating',
          ...(locationParam && {
            location: locationParam,
            radius: PAYMENT_SEARCH_CONSTANTS.DEFAULT_RADIUS,
          }),
        });
      } else {
        // Build search term - use query or category name
        const searchTerm = query.trim() || category || '';

        // Use advanced search for text/category search
        response = await storeSearchService.advancedStoreSearch({
          search: searchTerm,
          page,
          limit: PAYMENT_SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE,
          sortBy: userLocation ? 'distance' : 'rating',
          ...(locationParam && {
            location: locationParam,
            radius: PAYMENT_SEARCH_CONSTANTS.DEFAULT_RADIUS,
          }),
        });
      }

      if (response.success && response.data.stores) {
        const transformedStores = response.data.stores.map((store: any) =>
          transformToPaymentStore(store, store.distance)
        );

        if (page === 1) {
          setSearchResults(transformedStores);
        } else {
          setSearchResults(prev => [...prev, ...transformedStores]);
        }

        setHasMore(response.data.pagination.hasNext);
        setCurrentPage(page);
      } else {
        if (page === 1) {
          setSearchResults([]);
        }
        setHasMore(false);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      setSearchError({
        code: 'SERVER_ERROR',
        message: error.message || 'Failed to search stores',
        recoverable: true,
      });
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, [userLocation, formatLocationForAPI]);

  /**
   * Load more search results
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await executeSearch(debouncedSearchQuery, selectedCategory || 'all', currentPage + 1);
  }, [isLoadingMore, hasMore, debouncedSearchQuery, selectedCategory, currentPage, executeSearch]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    setIsInitialLoading(true);

    const promises: Promise<void>[] = [
      fetchPopularStores(),
    ];

    if (authState.isAuthenticated) {
      promises.push(fetchRecentStores());
    }

    if (userLocation) {
      promises.push(fetchNearbyStores());
    }

    await Promise.all(promises);
    setIsInitialLoading(false);
  }, [authState.isAuthenticated, userLocation, fetchNearbyStores, fetchRecentStores, fetchPopularStores]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all'); // Reset to 'all' to show all stores
    setSearchError(null);
    setCurrentPage(1);
    setHasMore(false);
  }, []);

  /**
   * NEW: Handle filter change
   */
  const handleFilterChange = useCallback((
    filter: 'nearMe' | 'offersAvailable' | 'cashback',
    value: boolean
  ) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
  }, []);

  /**
   * NEW: Handle tab change
   */
  const handleTabChange = useCallback((tab: StoreTab) => {
    setActiveTab(tab);
    // When switching to "all" tab with no search query, trigger a paginated search
    // so that searchResults are populated and loadMore works
    if (tab === 'all' && !debouncedSearchQuery) {
      setCurrentPage(1);
      setHasMore(false);
      executeSearch('', 'all', 1);
    }
  }, [debouncedSearchQuery, executeSearch]);

  /**
   * NEW: Filter stores based on filters and active tab
   */
  const getFilteredStores = useCallback((stores: PaymentStoreInfo[]): PaymentStoreInfo[] => {
    let filtered = [...stores];

    // Apply filter chips
    // "Near Me" filter - show stores with distance (sorted by closest)
    if (filters.nearMe && userLocation) {
      // Filter to stores that have distance data or coordinates
      filtered = filtered.filter(store =>
        store.distance !== undefined || store.location?.coordinates
      );
      // Sort by distance (closest first)
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    // "Offers Available" filter - stores with any offers/discounts
    if (filters.offersAvailable) {
      filtered = filtered.filter(store =>
        (store.offers?.discount && store.offers.discount > 0) ||
        (store.offers?.cashback && store.offers.cashback > 0) ||
        (store.maxCashback && store.maxCashback > 0)
      );
    }

    // "Cashback" filter - stores with cashback specifically
    if (filters.cashback) {
      filtered = filtered.filter(store =>
        (store.offers?.cashback && store.offers.cashback > 0) ||
        (store.maxCashback && store.maxCashback > 0)
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 'brands':
        filtered = filtered.filter(store => store.isBrand === true);
        break;
      case 'local':
        filtered = filtered.filter(store => store.isLocal === true);
        break;
      case 'services':
        filtered = filtered.filter(store => store.isService === true);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    return filtered;
  }, [filters, activeTab, userLocation]);

  /**
   * Retry after error
   */
  const retry = useCallback(() => {
    setSearchError(null);
    if (debouncedSearchQuery || selectedCategory) {
      executeSearch(debouncedSearchQuery, selectedCategory, 1);
    } else {
      refresh();
    }
  }, [debouncedSearchQuery, selectedCategory, executeSearch, refresh]);

  // Initialize location from context
  useEffect(() => {
    if (currentLocation && !userLocation) {
      // currentLocation.coordinates is an object { latitude, longitude }, not an array
      const lat = currentLocation.coordinates?.latitude;
      const lng = currentLocation.coordinates?.longitude;

      // Only set userLocation if we have valid coordinates
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        setUserLocation({
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
        });
      }
    }
  }, [currentLocation, userLocation]);

  // Initial data fetch - fetch popular stores immediately (no auth required)
  useEffect(() => {
    if (!isInitialFetchDone.current) {
      isInitialFetchDone.current = true;
      // Always fetch popular stores (public endpoint)
      fetchPopularStores();
      // Fetch recent stores only if authenticated
      if (authState.isAuthenticated) {
        fetchRecentStores();
      }
    }
  }, [authState.isAuthenticated, fetchPopularStores, fetchRecentStores]);

  // Fetch nearby stores when location becomes available (only once)
  useEffect(() => {
    if (userLocation && !isNearbyFetchDone.current && !isLoadingNearby) {
      isNearbyFetchDone.current = true;
      fetchNearbyStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Execute search when debounced query or category changes
  useEffect(() => {
    if (debouncedSearchQuery || selectedCategory) {
      executeSearch(debouncedSearchQuery, selectedCategory, 1);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, selectedCategory, executeSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, []);

  return {
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,

    // Data sections
    nearbyStores,
    recentStores,
    popularStores,

    // Loading states
    isLoadingNearby,
    isLoadingRecent,
    isLoadingPopular,
    isInitialLoading,

    // Category filter
    selectedCategory,
    setSelectedCategory,
    categories: PAYMENT_CATEGORIES,

    // NEW: Filter chips
    filters,
    setFilters,
    handleFilterChange,

    // NEW: Tabs
    activeTab,
    setActiveTab,
    handleTabChange,

    // NEW: Filtered results helper
    getFilteredStores,

    // Pagination
    hasMore,
    loadMore,
    isLoadingMore,

    // Actions
    refresh,
    clearSearch,
    retry,

    // Location
    userLocation,
    isLoadingLocation: isLoadingLocation || isLoadingLocationContext,
    locationError,
    requestLocation,
  };
};

export default usePaymentStoreSearch;
