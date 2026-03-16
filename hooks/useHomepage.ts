import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { platformAlertSimple } from '@/utils/platformAlert';
import {
  HomepageState,
  HomepageAction,
  UseHomepageDataResult,
  HomepageSection
} from '@/types/homepage.types';
import {
  initialHomepageState,
  fetchHomepageData,
  fetchSectionData
} from '@/data/homepageData';
import homepageDataService, { HomepageUserContext } from '@/services/homepageDataService';
import { useCartActions, useCurrentRegionId } from '@/stores/selectors';
import { showToast } from '@/components/common/ToastManager';
import {
  Product as UnifiedProduct,
  Store as UnifiedStore,
  toProduct,
  toStore
} from '@/types/unified';

// Homepage Reducer
function homepageReducer(state: HomepageState, action: HomepageAction): HomepageState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
        // Reset section-level loading to prevent skeleton stuck forever
        sections: state.sections.map(section =>
          section.loading ? { ...section, loading: false } : section
        )
      };

    case 'SET_SECTIONS':
      return {
        ...state,
        sections: action.payload,
        loading: false,
        error: null,
        lastRefresh: new Date().toISOString()
      };

    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map(section =>
          section.id === action.payload.sectionId
            ? { ...section, ...action.payload.section }
            : section
        )
      };

    case 'SET_USER_PREFERENCES':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: action.payload
        }
      };

    case 'REFRESH_SECTION':
      return {
        ...state,
        sections: state.sections.map(section =>
          section.id === action.payload
            ? { ...section, loading: true, error: null }
            : section
        )
      };

    case 'SET_LAST_REFRESH':
      return {
        ...state,
        lastRefresh: action.payload
      };

    default:
      return state;
  }
}

// ── Module-level dedup: survives component remounts caused by DeferredProviders ──
let _homepageLastFetch = 0;
let _homepagePending: Promise<void> | null = null;
let _homepageLastSections: any[] | null = null; // Cache last fetched sections for remount reuse
const HOMEPAGE_DEDUP_MS = 15_000; // 15 seconds dedup window

// Main Homepage Hook
export function useHomepage(): UseHomepageDataResult {
  const [state, dispatch] = useReducer(homepageReducer, initialHomepageState);
  const isMountedRef = useRef(true);
  const refreshVersionRef = useRef(0); // Race condition guard: only latest call updates state
  // Initialize to true if initial state already has sections with data (avoids skeleton flash on mount)
  const hasSectionsRef = useRef(
    initialHomepageState.sections.some((s: any) => s.items && s.items.length > 0 && !s.loading)
  );
  const currentRegion = useCurrentRegionId(); // Refetch when region changes

  // Track mounted state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep hasSectionsRef in sync with state — only true if we have sections WITH actual data
  useEffect(() => {
    hasSectionsRef.current = state.sections.some(
      (s: any) => s.items && s.items.length > 0 && !s.loading
    );
  }, [state.sections]);

  // Load all homepage sections (module-level dedup prevents re-fetching on DeferredProvider remounts)
  const refreshAllSections = useCallback(async (force: boolean = false) => {
    if (!isMountedRef.current) return;

    // Module-level dedup: coalesce with in-flight request
    if (_homepagePending) {
      await _homepagePending;
      // After awaiting, the original caller's dispatch may have targeted a now-unmounted
      // component instance (DeferredProvider remounts create new instances). Use cached
      // sections to update this instance's state.
      if (_homepageLastSections) {
        dispatch({ type: 'SET_SECTIONS', payload: _homepageLastSections });
      }
      return;
    }
    // Skip if fetched very recently (DeferredProvider remounts) — unless force=true (pull-to-refresh)
    if (!force && Date.now() - _homepageLastFetch < HOMEPAGE_DEDUP_MS) {
      // Reuse cached sections from the last successful fetch
      if (_homepageLastSections) {
        dispatch({ type: 'SET_SECTIONS', payload: _homepageLastSections });
      }
      return;
    }

    // Increment version to invalidate any in-flight calls
    const thisVersion = ++refreshVersionRef.current;
    _homepagePending = (async () => {
    try {
      // Only show loading skeleton if we have no existing sections
      // This avoids skeleton flash when data is already cached/displayed
      if (!hasSectionsRef.current) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

        // NEW: Try to use batch endpoint first
      try {
        const batchSections = await homepageDataService.fetchAllSectionsWithBatch();

        // Convert to array format for state
        const sectionsArray = [
          batchSections.events,
          batchSections.justForYou,
          batchSections.trendingStores,
          batchSections.offers,
          batchSections.flashSales,
          batchSections.newArrivals
        ].filter(section => {
          if (!section) return false;

          // Always include these sections (even if empty) so skeleton can show
          const alwaysShowSections = ['new_arrivals', 'just_for_you', 'trending_stores'];
          if (alwaysShowSections.includes(section.id)) {
            // Don't include if using fallback data
            if (section.error && section.error.includes('fallback')) {
              return false;
            }
            // Always include these sections (even if empty) - will show skeleton or content
            return true;
          }

          // For other sections, only include if they have data
          if (!section.items || section.items.length === 0) {
            return false;
          }

          // Don't include if using fallback data
          if (section.error && section.error.includes('fallback')) {
            return false;
          }

          return true;
        });

        // Cache sections BEFORE mount check — new instances from DeferredProvider
        // remounts need access to this data even if the old instance unmounted
        _homepageLastSections = sectionsArray;

        // Check if still mounted and not stale before dispatching to state
        if (!isMountedRef.current || thisVersion !== refreshVersionRef.current) return;

        dispatch({ type: 'SET_SECTIONS', payload: sectionsArray });

        return;
      } catch (_batchError) {
        // silently handle
      }

      // Fallback to original approach if batch fails

      // Get base homepage data (for sections that don't need API integration)
      const data = await fetchHomepageData();

      // Check if still mounted and not stale before continuing
      if (!isMountedRef.current || thisVersion !== refreshVersionRef.current) return;

      // Update specific sections with backend data
      const updatedSections = await Promise.all(
        data.sections.map(async (section) => {
          try {
            if (section.id === 'events') {
              return await homepageDataService.getEventsSection();
            } else if (section.id === 'just_for_you') {
              return await homepageDataService.getJustForYouSection();
            } else if (section.id === 'new_arrivals') {
              return await homepageDataService.getNewArrivalsSection();
            } else if (section.id === 'trending_stores') {
              return await homepageDataService.getTrendingStoresSection();
            } else if (section.id === 'offers' || section.id === 'special_offers') {
              return await homepageDataService.getOffersSection();
            } else if (section.id === 'flash_sales') {
              return await homepageDataService.getFlashSalesSection();
            } else {
              return section;
            }
          } catch (error) {
            return section; // fallback to original section
          }
        })
      );

      // Cache before mount check (same reason as batch path)
      _homepageLastSections = updatedSections;

      // Check if still mounted and not stale before updating state
      if (!isMountedRef.current || thisVersion !== refreshVersionRef.current) return;

      dispatch({ type: 'SET_SECTIONS', payload: updatedSections });
    } catch (error) {
      if (!isMountedRef.current || thisVersion !== refreshVersionRef.current) return;
      const errorMessage = error instanceof Error ? error.message : 'Failed to load homepage data';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      _homepageLastFetch = Date.now();
      _homepagePending = null;
    }
    })(); // end _homepagePending async wrapper

    await _homepagePending;
  }, []);

  // Refresh a specific section
  const refreshSection = useCallback(async (sectionId: string) => {
    if (!isMountedRef.current) return;
    try {
      dispatch({ type: 'REFRESH_SECTION', payload: sectionId });

      let sectionData: HomepageSection;

      // Use new backend service for specific sections
      if (sectionId === 'just_for_you') {
        sectionData = await homepageDataService.getJustForYouSection();
      } else if (sectionId === 'new_arrivals') {
        sectionData = await homepageDataService.getNewArrivalsSection();
      } else if (sectionId === 'trending_stores') {
        sectionData = await homepageDataService.getTrendingStoresSection();
      } else if (sectionId === 'brand_partnerships') {
        sectionData = await homepageDataService.getBrandPartnershipsSection();
      } else {
        // Use fallback for other sections
        sectionData = await fetchSectionData(sectionId);
      }

      // Check if still mounted before updating state
      if (!isMountedRef.current) return;

      dispatch({
        type: 'UPDATE_SECTION',
        payload: {
          sectionId,
          section: {
            ...sectionData,
            loading: false,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh section';
      dispatch({
        type: 'UPDATE_SECTION',
        payload: {
          sectionId,
          section: {
            loading: false,
            error: errorMessage
          }
        }
      });
    }
  }, []);

  // Update user preferences
  const updateUserPreferences = useCallback((preferences: string[]) => {
    dispatch({ type: 'SET_USER_PREFERENCES', payload: preferences });
  }, []);

  // Analytics tracking (placeholder for backend integration)
  const trackSectionView = useCallback((sectionId: string) => {
    // TODO: Send analytics event to backend
  }, []);

  const trackItemClick = useCallback((sectionId: string, itemId: string) => {
    // TODO: Send analytics event to backend
  }, []);

  // Auto-refresh on mount and when region actually changes (not just reference)
  const prevRegionRef = useRef(currentRegion);
  const hasInitialFetchRef = useRef(false);
  useEffect(() => {
    if (!hasInitialFetchRef.current) {
      // First mount — always fetch
      hasInitialFetchRef.current = true;
      prevRegionRef.current = currentRegion;
      refreshAllSections();
    } else if (prevRegionRef.current !== currentRegion) {
      // Region actually changed value — refetch
      prevRegionRef.current = currentRegion;
      refreshAllSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRegion]); // Refetch when region changes

  // Debug effect to test service directly - disabled to prevent infinite loop
  // This was causing infinite loops because state.sections.length changes constantly
  // useEffect(() => {
  //   const testService = async () => {
  //     try {
  //       const justForYouSection = await homepageDataService.getJustForYouSection();
  //     } catch (error) {
  //     }
  //   };
  //
  //   // Run test only once
  //   if (state.sections.length > 0) {
  //     testService();
  //   }
  // }, [state.sections.length]);

  const actions = useMemo(() => ({
    refreshAllSections,
    refreshSection,
    updateUserPreferences,
    trackSectionView,
    trackItemClick
  }), [refreshAllSections, refreshSection, updateUserPreferences, trackSectionView, trackItemClick]);

  // Expose userContext from the last batch response (avoids separate /user-context API call)
  const getUserContext = useCallback((): HomepageUserContext | null => {
    return homepageDataService.getLastUserContext();
  }, []);

  return { state, actions, getUserContext };
}

// Individual Section Hook
export function useHomepageSection(sectionId: string) {
  const { state, actions } = useHomepage();
  
  const section = state.sections.find(s => s.id === sectionId);
  
  const refresh = useCallback(async () => {
    await actions.refreshSection(sectionId);
  }, [actions, sectionId]);

  return {
    section: section || null,
    loading: section?.loading || false,
    error: section?.error || null,
    refresh
  };
}

// Events Section Hook
export function useEvents() {
  return useHomepageSection('events');
}

// Just for You Section Hook
export function useRecommendations() {
  return useHomepageSection('just_for_you');
}

// Trending Stores Section Hook
export function useTrendingStores() {
  return useHomepageSection('trending_stores');
}

// New Stores Section Hook
export function useNewStores() {
  return useHomepageSection('new_stores');
}

// Top Stores Section Hook
export function useTopStores() {
  return useHomepageSection('top_stores');
}

// New Arrivals Section Hook
export function useNewArrivals() {
  return useHomepageSection('new_arrivals');
}

// Brand Partnerships Section Hook
export function useBrandPartnerships() {
  return useHomepageSection('brand_partnerships');
}

// Helper hook for navigation actions
export function useHomepageNavigation() {
  const { actions } = useHomepage();
  const router = useRouter();
  const cartActions = useCartActions();

  const handleItemPress = useCallback((sectionId: string, item: any) => {
    // Track click
    actions.trackItemClick(sectionId, item.id);

    try {
      // For "Just for you" and "New Arrivals" sections, navigate to dynamic StorePage
      if (sectionId === 'just_for_you' || sectionId === 'new_arrivals') {
        // Pass complete item data to StorePage for dynamic content
        try {
          // Extract price from complex price object with proper fallback chain
          let extractedPrice = 999; // default
          if (item.price) {
            if (typeof item.price === 'number') {
              extractedPrice = item.price;
            } else if (typeof item.price === 'object') {
              extractedPrice = item.price.current || item.price.selling || item.price.amount || 999;
            } else if (typeof item.price === 'string') {
              extractedPrice = parseFloat(item.price) || 999;
            }
          } else if (item.pricing && item.pricing.selling) {
            extractedPrice = item.pricing.selling;
          }

          // Extract rating from complex rating object with proper fallback chain
          let extractedRating = 4.5; // default
          if (item.rating) {
            if (typeof item.rating === 'number') {
              extractedRating = item.rating;
            } else if (typeof item.rating === 'object') {
              extractedRating = item.rating.value || item.rating.average || 4.5;
            } else if (typeof item.rating === 'string') {
              extractedRating = parseFloat(item.rating) || 4.5;
            }
          } else if (item.ratings && item.ratings.average) {
            extractedRating = item.ratings.average;
          }

          const cardData = {
            id: item.id,
            title: item.title || item.name,
            description: item.description,
            image: item.image,
            price: extractedPrice,
            rating: extractedRating,
            category: item.category,
            merchant: item.merchant || item.store || item.brand,
            storeId: item.store?._id || item.store?.id || item.storeId,
            storeName: item.store?.name || item.storeName || 'Store',
            type: item.type,
            section: sectionId,
            originalPrice: item.price,
            originalRating: item.rating
          };

          router.push({
            pathname: '/product-page',
            params: {
              cardId: item.id,
              cardType: 'product'
            }
          });
        } catch (error) {
          router.push('/product-page');
        }
        return;
      }

      // Store sections navigation to dynamic MainStorePage
      if (sectionId === 'trending_stores' || sectionId === 'new_stores' || sectionId === 'top_stores') {
        // Pass complete store data to MainStorePage for dynamic content
        try {
          // Extract store data for MainStorePage
          const storeData = {
            id: item.id,
            name: item.name || item.title,
            title: item.title || item.name,
            description: item.description,
            image: item.image,
            logo: item.logo,
            // Extract rating from complex rating object
            rating: typeof item.rating === 'object' ? item.rating.value || 4.5 : item.rating || 4.5,
            ratingCount: typeof item.rating === 'object' ? item.rating.count || 0 : 0,
            // Extract cashback info
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
            // Include original data for reference
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
        } catch (error) {
          // Fallback to basic navigation
          router.push('/MainStorePage');
        }
        return;
      }

      // Events section navigation to dynamic EventPage
      if (sectionId === 'events' || item.type === 'event') {
        // Pass complete event data to EventPage for dynamic content
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
            bookingUrl: item.bookingUrl, // For online events
            availableSlots: item.availableSlots, // For offline events
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
        } catch (error) {
          // Fallback to basic navigation
          router.push({ pathname: '/EventPage', params: { id: item.id } } as any);
        }
        return;
      }

      // Original navigation logic for other sections
      switch (item.type) {
        case 'event':
          // Fallback for events not from events section
          router.push({ pathname: '/EventPage', params: { id: item.id } } as any);
          break;
        case 'store':
          // Navigate to store page (fallback)

          router.push('/StorePage' as any);
          break;
        case 'product':
          // Navigate to ProductPage (comprehensive product page)
          router.push({
            pathname: '/product-page',
            params: {
              id: item.id,
              cardType: 'product',
              cardData: JSON.stringify(item)
            }
          } as any);
          break;
        case 'branded_store':
          // Navigate to brand store (fallback)

          router.push('/MainStorePage');
          break;
        default:

          // Fallback navigation to dynamic StorePage with item data
          router.push({
            pathname: '/StorePage',
            params: {
              cardId: item.id,
              cardType: sectionId,
              cardData: JSON.stringify(item)
            }
          } as any);
      }
    } catch (error) {
      // Prevent the animation error by ensuring navigation completes
    }
  }, [actions, router]);

  const handleAddToCart = useCallback(async (item: any) => {
    try {
      // Extract product ID - handle both product._id and product.id formats
      const productId = item._id || item.id;

      if (!productId) {
        platformAlertSimple('Error', 'Cannot add item to cart - invalid product');
        return;
      }

      // Extract price - handle complex price objects with proper fallback chain
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
        // Fallback to pricing object for backend data format
        currentPrice = item.pricing.selling || item.pricing.current || 0;
        originalPrice = item.pricing.mrp || item.pricing.original || item.pricing.selling || 0;
      }

      // Extract image - handle multiple possible formats
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

      // Extract variants data if available
      const variants = item.variants || item.options || null;
      const selectedVariant = item.selectedVariant || null;

      // Check if item already exists in cart
      const existingItem = cartActions.isItemInCart(productId);

      if (existingItem) {

      }

      // Add to cart via CartContext (CartContext will handle increasing quantity if it exists)
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
        // Add variant data to cart flow
        variants: variants,
        selectedVariant: selectedVariant,
        storeId: item.store?._id || item.store?.id || item.storeId,
        storeName: item.store?.name || item.storeName || 'Store'
      });

      // Wait a bit for the cart state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Show success toast
      showToast({
        message: `${item.name || item.title || 'Item'} added to cart`,
        type: 'success',
        duration: 3000
      });

    } catch (error) {
      showToast({
        message: 'Failed to add item to cart',
        type: 'error',
        duration: 3000
      });
    }
  }, [cartActions]);

  return {
    handleItemPress,
    handleAddToCart
  };
}

// Performance tracking hook
export function useHomepagePerformance() {
  const { state } = useHomepage();
  
  const getLoadingStats = useCallback(() => {
    const totalSections = state.sections.length;
    const loadingSections = state.sections.filter(s => s.loading).length;
    const errorSections = state.sections.filter(s => s.error).length;
    
    return {
      total: totalSections,
      loading: loadingSections,
      errors: errorSections,
      loaded: totalSections - loadingSections - errorSections
    };
  }, [state.sections]);

  const getSectionPerformance = useCallback((sectionId: string) => {
    const section = state.sections.find(s => s.id === sectionId);
    
    if (!section) return null;
    
    return {
      id: section.id,
      itemCount: section.items.length,
      lastUpdated: section.lastUpdated,
      isLoading: section.loading,
      hasError: !!section.error,
      refreshable: section.refreshable
    };
  }, [state.sections]);

  return {
    getLoadingStats,
    getSectionPerformance,
    lastRefresh: state.lastRefresh
  };
}
