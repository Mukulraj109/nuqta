import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { platformAlertSimple } from '@/utils/platformAlert';
import {
  HomepageState,
  UseHomepageDataResult,
  HomepageSection
} from '@/types/homepage.types';
import {
  initialHomepageState,
} from '@/data/homepageData';
import { HomepageUserContext } from '@/services/homepageDataService';
import { useCartActions } from '@/stores/selectors';
import { showToast } from '@/components/common/ToastManager';
import { useHomepageBatch, HomepageBatchResult } from '@/hooks/queries/useHomepageData';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';

// ── Helpers ──

/** Convert batch result object → sections array (matches old reducer shape) */
function batchToSections(batch: HomepageBatchResult | undefined): HomepageSection[] {
  if (!batch) return initialHomepageState.sections;

  const sectionsArray = [
    batch.events,
    batch.justForYou,
    batch.trendingStores,
    batch.offers,
    batch.flashSales,
    batch.newArrivals,
  ].filter((section): section is HomepageSection => {
    if (!section) return false;
    // Always show these sections (even if empty) for skeleton
    const alwaysShow = ['new_arrivals', 'just_for_you', 'trending_stores'];
    if (alwaysShow.includes(section.id)) {
      return !(section.error && section.error.includes('fallback'));
    }
    // Other sections: only if they have data
    if (!section.items || section.items.length === 0) return false;
    if (section.error && section.error.includes('fallback')) return false;
    return true;
  });

  return sectionsArray.length > 0 ? sectionsArray : initialHomepageState.sections;
}

// ── Main Homepage Hook ──

export function useHomepage(): UseHomepageDataResult {
  const { data, isLoading, error, refetch } = useHomepageBatch();

  // Map react-query result → old state shape (identical to what reducer produced)
  const state: HomepageState = useMemo(() => ({
    loading: isLoading && !data, // Only show loading on first load (not background refetch)
    error: error ? (error instanceof Error ? error.message : 'Failed to load homepage data') : null,
    sections: batchToSections(data),
    user: { preferences: [] },
    lastRefresh: data ? new Date().toISOString() : initialHomepageState.lastRefresh,
  }), [data, isLoading, error]);

  const actions = useMemo(() => ({
    refreshAllSections: async (force: boolean = false) => {
      if (force) {
        // Invalidate cache so next fetch hits the server
        queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
      }
      await refetch();
    },
    refreshSection: async (_sectionId: string) => {
      // Individual section refresh just refetches the batch (still 1 API call)
      await refetch();
    },
    updateUserPreferences: (_preferences: string[]) => {
      // Preferences are stored locally — no API call needed
    },
    trackSectionView: (_sectionId: string) => {
      // TODO: Send analytics event to backend
    },
    trackItemClick: (_sectionId: string, _itemId: string) => {
      // TODO: Send analytics event to backend
    },
  }), [refetch]);

  const getUserContext = useCallback((): HomepageUserContext | null => {
    // Lazy import to avoid circular deps — service is already loaded by query
    try {
      const homepageDataService = require('@/services/homepageDataService').default;
      return homepageDataService.getLastUserContext();
    } catch {
      return null;
    }
  }, []);

  return { state, actions, getUserContext };
}

// ── Individual Section Hook ──

export function useHomepageSection(sectionId: string) {
  const { data, isLoading, error, refetch } = useHomepageBatch();
  const sections = batchToSections(data);
  const section = sections.find(s => s.id === sectionId);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    section: section || null,
    loading: isLoading && !data,
    error: error ? (error instanceof Error ? error.message : null) : null,
    refresh,
  };
}

// ── Convenience Section Hooks ──

export function useEvents() {
  return useHomepageSection('events');
}

export function useRecommendations() {
  return useHomepageSection('just_for_you');
}

export function useTrendingStores() {
  return useHomepageSection('trending_stores');
}

export function useNewStores() {
  return useHomepageSection('new_stores');
}

export function useTopStores() {
  return useHomepageSection('top_stores');
}

export function useNewArrivals() {
  return useHomepageSection('new_arrivals');
}

export function useBrandPartnerships() {
  return useHomepageSection('brand_partnerships');
}

// ── Navigation Hook (unchanged — navigation logic, not data) ──

export function useHomepageNavigation() {
  const router = useRouter();
  const cartActions = useCartActions();

  const handleItemPress = useCallback((sectionId: string, item: any) => {
    try {
      // For "Just for you" and "New Arrivals" sections, navigate to dynamic StorePage
      if (sectionId === 'just_for_you' || sectionId === 'new_arrivals') {
        try {
          router.push({
            pathname: '/product-page',
            params: {
              cardId: item.id,
              cardType: 'product'
            }
          });
        } catch {
          router.push('/product-page');
        }
        return;
      }

      // Store sections navigation to dynamic MainStorePage
      if (sectionId === 'trending_stores' || sectionId === 'new_stores' || sectionId === 'top_stores') {
        try {
          const storeData = {
            id: item.id,
            name: item.name || item.title,
            title: item.title || item.name,
            description: item.description,
            image: item.image,
            logo: item.logo,
            rating: typeof item.rating === 'object' ? item.rating.value || 4.5 : item.rating || 4.5,
            ratingCount: typeof item.rating === 'object' ? item.rating.count || 0 : 0,
            cashback: item.cashback,
            category: item.category,
            location: item.location,
            deliveryTime: item.deliveryTime,
            minimumOrder: item.minimumOrder,
            isTrending: item.isTrending,
            isPartner: item.isPartner,
            partnerLevel: item.partnerLevel,
            discount: item.discount,
            backgroundColor: item.backgroundColor,
            brandName: item.brandName,
            type: item.type,
            section: sectionId,
            originalData: item
          };

          router.push({
            pathname: '/MainStorePage',
            params: {
              storeId: item.id,
              storeType: sectionId,
              storeData: JSON.stringify(storeData)
            }
          });
        } catch {
          router.push('/MainStorePage');
        }
        return;
      }

      // Events section navigation
      if (sectionId === 'events' || item.type === 'event') {
        try {
          const eventData = {
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            image: item.image,
            price: item.price,
            location: item.location,
            date: item.date,
            time: item.time,
            category: item.category,
            organizer: item.organizer,
            isOnline: item.isOnline,
            registrationRequired: item.registrationRequired,
            bookingUrl: item.bookingUrl,
            availableSlots: item.availableSlots,
            type: item.type,
            section: sectionId,
            originalData: item
          };

          router.push({
            pathname: '/EventPage',
            params: {
              id: item.id,
              eventType: sectionId,
              eventData: JSON.stringify(eventData)
            }
          });
        } catch {
          router.push({ pathname: '/EventPage', params: { id: item.id } } as any);
        }
        return;
      }

      // Fallback navigation for other item types
      switch (item.type) {
        case 'event':
          router.push({ pathname: '/EventPage', params: { id: item.id } } as any);
          break;
        case 'store':
          router.push('/StorePage' as any);
          break;
        case 'product':
          router.push({
            pathname: '/product-page',
            params: { id: item.id, cardType: 'product', cardData: JSON.stringify(item) }
          } as any);
          break;
        case 'branded_store':
          router.push('/MainStorePage');
          break;
        default:
          router.push({
            pathname: '/StorePage',
            params: { cardId: item.id, cardType: sectionId, cardData: JSON.stringify(item) }
          } as any);
      }
    } catch {
      // Prevent navigation error from crashing the app
    }
  }, [router]);

  const handleAddToCart = useCallback(async (item: any) => {
    try {
      const productId = item._id || item.id;
      if (!productId) {
        platformAlertSimple('Error', 'Cannot add item to cart - invalid product');
        return;
      }

      // Extract price
      let currentPrice = 0;
      let originalPrice = 0;
      if (item.price) {
        if (typeof item.price === 'number') {
          currentPrice = item.price;
          originalPrice = item.originalPrice || item.price;
        } else if (typeof item.price === 'object') {
          currentPrice = item.price.current || item.price.selling || item.price.amount || 0;
          originalPrice = item.price.original || item.price.mrp || item.price.current || item.price.selling || item.price.amount || 0;
        }
      } else if (item.pricing) {
        currentPrice = item.pricing.selling || item.pricing.current || 0;
        originalPrice = item.pricing.mrp || item.pricing.original || item.pricing.selling || 0;
      }

      // Extract image
      let imageUrl = '';
      if (item.image) {
        imageUrl = item.image;
      } else if (item.imageUrl) {
        imageUrl = item.imageUrl;
      } else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        imageUrl = item.images[0].url || item.images[0];
      } else if (item.images && typeof item.images === 'string') {
        imageUrl = item.images;
      }

      await cartActions.addItem({
        id: productId,
        name: item.name || item.title || 'Product',
        image: imageUrl,
        price: currentPrice,
        originalPrice: originalPrice,
        discountedPrice: currentPrice,
        quantity: 1,
        cashback: item.cashback || 0,
        category: item.category || 'general',
        variants: item.variants || item.options || null,
        selectedVariant: item.selectedVariant || null,
        storeId: item.store?._id || item.store?.id || item.storeId,
        storeName: item.store?.name || item.storeName || 'Store'
      });

      showToast({
        message: `${item.name || item.title || 'Item'} added to cart`,
        type: 'success',
        duration: 3000
      });
    } catch {
      showToast({
        message: 'Failed to add item to cart',
        type: 'error',
        duration: 3000
      });
    }
  }, [cartActions]);

  return { handleItemPress, handleAddToCart };
}

// ── Performance Hook ──

export function useHomepagePerformance() {
  const { data, isLoading } = useHomepageBatch();
  const sections = batchToSections(data);

  const getLoadingStats = useCallback(() => {
    const totalSections = sections.length;
    const loadingSections = sections.filter(s => s.loading).length;
    const errorSections = sections.filter(s => s.error).length;

    return {
      total: totalSections,
      loading: isLoading ? totalSections : loadingSections,
      errors: errorSections,
      loaded: totalSections - loadingSections - errorSections
    };
  }, [sections, isLoading]);

  const getSectionPerformance = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;

    return {
      id: section.id,
      itemCount: section.items.length,
      lastUpdated: section.lastUpdated,
      isLoading: section.loading,
      hasError: !!section.error,
      refreshable: section.refreshable
    };
  }, [sections]);

  return {
    getLoadingStats,
    getSectionPerformance,
    lastRefresh: data ? new Date().toISOString() : '',
  };
}
