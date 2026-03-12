// MainStorePage.tsx
import React, { useCallback, useMemo, useState, useEffect, useRef, Suspense, lazy } from "react";
import {
  Animated,
  Dimensions,
  InteractionManager,
  Platform,
  ScrollView,
  RefreshControl,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useFocusEffect } from "@react-navigation/native";
import { useRegion } from "@/contexts/RegionContext";
import { ThemedView } from "@/components/ThemedView";
import {
  MainStoreHeader,
  ProductDisplay,
  TabNavigation,
  TabKey,
  ProductDetails,
  CashbackOffer,
  UGCSection,
  VisitStoreButton,
  StoreProducts,
  // New Magicpin-inspired components
  StoreHeroMetrics,
  VoucherCardsSection,
  RatingBreakdownSection,
  AIReviewSummary,
  // NEW COMPONENTS - Redesigned MainStorePage UI
  StoreInfoCard,
  CashbackHeroCard,
  StoreQuickInfoCard,
  StoreOffersPreview,
  UserLoyaltyCard,
  PaymentMethodsCard,
  StoreActionButtons as NewStoreActionButtons,
  StoreOffersSection,
  StoreLoyaltySection,
  PaymentMethodsSection,
  MenuSection,
  PeopleEarningSection,
  AIInsightCard,
  LocationSection,
  NearbyStoresSection,
  TermsTransparencySection,
  RewardsFooterBanner,
  StoreBottomActionBar,
} from "./MainStoreSection";
import Section2 from "./StoreSection/Section2";
import Section3 from "./StoreSection/Section3";
import Section4 from "./StoreSection/Section4";
import Section5 from "./StoreSection/Section5";
import FollowStoreSection from "./StoreSection/FollowStoreSection";
// Section6 removed - was redundant with VoucherCardsSection
// import Section6 from "./StoreSection/Section6";
import ProductInfo from "./StoreSection/ProductInfo";
import StoreActionButtons from "./StoreSection/StoreActionButtons";
import { MainStoreProduct, MainStorePageProps, CartItemFromProduct } from "@/types/mainstore";
import { useStoreReviews } from "@/hooks/useStoreReviews";
import reviewsApi from "@/services/reviewsApi";
import apiClient from "@/services/apiClient";
import {
  StoreHeaderSkeleton,
  ProductGridSkeleton,
  PromotionBannerSkeleton
} from "@/components/skeletons";
import FrequentlyBoughtTogether from '@/components/store/FrequentlyBoughtTogether';
import CrossStoreProductsSection from '@/components/store/CrossStoreProductsSection';
import SimilarStoresSection from '@/components/store/SimilarStoresSection';
import StoreGallerySection from '@/components/store/StoreGallerySection';
import { parsePrice } from '@/utils/priceParser';
import { platformAlert, platformAlertSimple } from '@/utils/platformAlert';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import wishlistApi from '@/services/wishlistApi';
import { storesApi } from '@/services/storesApi';
import { showAlert } from '@/components/common/CrossPlatformAlert';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';
import asyncStorageService from '@/services/asyncStorageService';

// ============================================================================
// LAZY LOADED COMPONENTS - Code Splitting for Bundle Size Optimization
// ============================================================================
// These modals are heavy (50-80KB each) and only needed when user interaction occurs
// Lazy loading reduces initial bundle from ~800KB to ~500KB (37.5% reduction)

import SectionLoader from "@/components/lazy/SectionLoader";
const LazyAboutModal = lazy(() => import('@/components/AboutModal'));
const LazyWalkInDealsModal = lazy(() => import('@/components/WalkInDealsModal'));
const LazyReviewModal = lazy(() => import('@/components/ReviewModal'));
import WriteReviewModal from "@/components/WriteReviewModal";
import StarRating from "@/components/StarRating";
import RatingBreakdown from "@/components/RatingBreakdown";
import ReviewCard from "@/components/ReviewCard";
import UGCGrid from "@/components/UGCGrid";

// ============================================================================
// CUSTOM HOOKS - Data Management & State Logic Extraction
// ============================================================================
// These hooks encapsulate data fetching, filtering, and state management logic
// reducing component complexity and improving reusability

import { useStoreData } from "@/hooks/useStoreData";
import { useStoreProducts } from "@/hooks/useStoreProducts";
import { useStorePromotions } from "@/hooks/useStorePromotions";
import { useProductFilters } from "@/hooks/useProductFilters";

// NOTE: These hooks are currently ready but not actively used in this component
// because MainStorePage is currently using static/mock data from params.
// When backend integration is complete, replace the static productData logic with:
//
// const storeId = params.storeId as string;
// const { data: storeDetails, loading: storeLoading, error: storeError } = useStoreData(storeId);
// const { products, loading: productsLoading, loadMore, hasMore } = useStoreProducts(storeId);
// const { promotions, loading: promotionsLoading } = useStorePromotions(storeId);
// const { filters, setCategory, setSortBy, clearFilters } = useProductFilters();

// Future lazy-loaded components (ready for when implemented):
// import {
//   LazyFrequentlyBoughtTogether,
//   LazyRelatedProductsSection,
//   LazyCombinedSection78,
//   LazyCategoryRecommendationsGrid,
//   LazySection6,
// } from '@/components/lazy';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';

interface LocationData {
  address?: string;
  city?: string;
  distance?: string;
  [key: string]: unknown;
}

interface CashbackData {
  percentage?: number;
  [key: string]: unknown;
}

interface DynamicStoreData {
  id: string;
  name: string;
  title: string;
  description?: string;
  image?: string;
  logo?: string;
  rating: number;
  ratingCount: number;
  category?: string;
  location?: string | LocationData;
  deliveryTime?: string;
  minimumOrder?: number;
  cashback?: number | CashbackData;
  discount?: number | Record<string, unknown>;
  section?: string;
  operationalInfo?: {
    hours?: {
      monday?: { open: string; close: string; closed?: boolean };
      tuesday?: { open: string; close: string; closed?: boolean };
      wednesday?: { open: string; close: string; closed?: boolean };
      thursday?: { open: string; close: string; closed?: boolean };
      friday?: { open: string; close: string; closed?: boolean };
      saturday?: { open: string; close: string; closed?: boolean };
      sunday?: { open: string; close: string; closed?: boolean };
    };
    deliveryTime?: string;
    minimumOrder?: number;
    deliveryFee?: number;
    freeDeliveryAbove?: number;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
  };
  tags?: string[];
  createdAt?: string | Date;
  [key: string]: unknown;
}

export default function MainStorePage({ productId, initialProduct }: MainStorePageProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state: authState } = useAuth();
  const { state: gamificationState } = useGamification();
  const isAuthenticated = authState?.isAuthenticated && !!authState?.user;
  const userCoins = gamificationState?.coinBalance?.total || 0;
  const { getCurrencySymbol, currency: regionCurrency } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [screenData, setScreenData] = useState(Dimensions.get("window"));
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive breakpoints
  const isWeb = Platform.OS === 'web';
  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;
  const isMobile = screenData.width < 768;

  // Dynamic store data state
  const [storeData, setStoreData] = useState<DynamicStoreData | null>(null);
  const [isDynamic, setIsDynamic] = useState(false);
  const initializedRef = useRef(false); // Prevent re-initialization
  const fullStoreDataRef = useRef<any>(null); // Store full fetched store data for modals

  // Parse dynamic store data from navigation params
  // FIX: Extract primitive values from params to prevent infinite loop
  const storeDataParam = params.storeData as string | undefined;
  const storeIdParam = params.storeId as string | undefined;
  const storeTypeParam = params.storeType as string | undefined;

  // ALWAYS fetch full store data from API if storeId is available
  // This ensures we have complete data (location with state/pincode, contact, operationalInfo, description)
  // even if storeDataParam is provided (which might be incomplete)
  const shouldFetchStore = !!storeIdParam;
  const { 
    data: fetchedStoreData, 
    loading: storeLoading, 
    error: storeError,
    refetch: refetchStore 
  } = useStoreData(shouldFetchStore ? storeIdParam : '');

  // Transform fetched store data to DynamicStoreData format
  // This runs whenever we fetch data from API (whether or not storeDataParam exists)
  useEffect(() => {
    if (fetchedStoreData && storeIdParam) {
      try {
        // Transform location object to string or keep as object
        let locationValue: string | LocationData = '';
        if (fetchedStoreData.location) {
          if (typeof fetchedStoreData.location === 'object') {
            locationValue = {
              address: fetchedStoreData.location.address || '',
              city: fetchedStoreData.location.city || '',
              state: fetchedStoreData.location.state || '',
              pincode: fetchedStoreData.location.pincode || '',
              landmark: fetchedStoreData.location.landmark || '',
              coordinates: fetchedStoreData.location.coordinates || undefined,
              deliveryRadius: fetchedStoreData.location.deliveryRadius || undefined,
            };
          } else {
            locationValue = fetchedStoreData.location;
          }
        }

        const transformedData: DynamicStoreData = {
          id: fetchedStoreData._id || fetchedStoreData.id || storeIdParam,
          name: fetchedStoreData.name || 'Unnamed Store',
          title: fetchedStoreData.name || 'Unnamed Store',
          description: fetchedStoreData.description || '',
          // banner may be string[] from backend — keep as-is, getBannerArray() handles both array and string
          image: fetchedStoreData.banner || fetchedStoreData.image || '',
          logo: fetchedStoreData.logo || '',
          rating: fetchedStoreData.ratings?.average || 0,
          ratingCount: fetchedStoreData.ratings?.count || 0,
          category: fetchedStoreData.category?.name || fetchedStoreData.category || '',
          location: locationValue,
          deliveryTime: fetchedStoreData.operationalInfo?.deliveryTime || '',
          minimumOrder: fetchedStoreData.operationalInfo?.minimumOrder || 0,
          cashback: fetchedStoreData.offers?.cashback || 0,
          discount: fetchedStoreData.offers?.discounts?.length || 0,
          section: 'store',
          // Add additional fields for About modal
          operationalInfo: fetchedStoreData.operationalInfo,
          contact: fetchedStoreData.contact,
          tags: fetchedStoreData.tags || [],
          createdAt: fetchedStoreData.createdAt,
        };
        setStoreData(transformedData);
        setIsDynamic(true);
        fullStoreDataRef.current = fetchedStoreData; // Store full data for modals

        // Track this store as recently viewed
        // Note: Backend has 'address' field separate from 'location' (GeoJSON)
        asyncStorageService.addRecentlyViewedStore({
          _id: transformedData.id,
          name: transformedData.name,
          slug: fetchedStoreData.slug,
          logo: transformedData.logo,
          banner: transformedData.image,
          // Use 'address' field from backend (not 'location' which is GeoJSON)
          address: fetchedStoreData.address ? {
            street: fetchedStoreData.address.street,
            city: fetchedStoreData.address.city,
            state: fetchedStoreData.address.state,
          } : undefined,
          ratings: {
            average: transformedData.rating,
            count: transformedData.ratingCount,
          },
          offers: {
            cashback: typeof transformedData.cashback === 'number' && transformedData.cashback > 0
              ? transformedData.cashback
              : undefined,
          },
        }).catch(() => {});

        // Track store visit for "Shop at your favorite" section
        asyncStorageService.trackStoreVisit({
          _id: transformedData.id,
          name: transformedData.name,
          slug: fetchedStoreData.slug,
          logo: transformedData.logo,
          banner: transformedData.image,
          description: fetchedStoreData.description || '',
          // Pass address if available
          address: fetchedStoreData.address ? {
            street: fetchedStoreData.address.street || '',
            city: fetchedStoreData.address.city || '',
            state: fetchedStoreData.address.state || '',
            pincode: fetchedStoreData.address.pincode || '',
            landmark: fetchedStoreData.address.landmark || '',
          } : undefined,
          // Pass location if available (fallback for stores without address field)
          location: fetchedStoreData.location ? {
            address: fetchedStoreData.location.address || '',
            city: fetchedStoreData.location.city || '',
            state: fetchedStoreData.location.state || '',
            pincode: fetchedStoreData.location.pincode || '',
          } : undefined,
          ratings: {
            average: transformedData.rating,
            count: transformedData.ratingCount,
          },
          offers: {
            cashback: typeof transformedData.cashback === 'number' && transformedData.cashback > 0
              ? transformedData.cashback
              : undefined,
          },
          operationalInfo: {
            deliveryTime: fetchedStoreData.operationalInfo?.deliveryTime || '',
          },
        }).catch(() => {});

      } catch (error) {
        setError('Failed to load store details');
      }
    }
  }, [fetchedStoreData, storeIdParam, storeDataParam]);

  // Handle store loading state + store error in a single effect
  useEffect(() => {
    if (storeLoading) {
      setPageLoading(true);
      return;
    }

    if (storeError) {

      // If we have storeDataParam, use it as fallback instead of showing error
      if (storeDataParam) {
        try {
          const parsedData = JSON.parse(storeDataParam);

          // Transform to DynamicStoreData format
          const fallbackData: DynamicStoreData = {
            id: parsedData.id || storeIdParam || '',
            name: parsedData.name || parsedData.title || 'Store',
            title: parsedData.title || parsedData.name || 'Store',
            description: parsedData.description || '',
            image: parsedData.image || parsedData.banner || '',
            logo: parsedData.logo || '',
            rating: parsedData.rating || 0,
            ratingCount: parsedData.ratingCount || 0,
            category: parsedData.category || '',
            location: parsedData.location || '',
            deliveryTime: parsedData.deliveryTime || '',
            minimumOrder: parsedData.minimumOrder || 0,
            cashback: parsedData.cashback || 0,
            discount: parsedData.discount || 0,
            section: 'store',
            tags: parsedData.tags || [],
          };

          setStoreData(fallbackData);
          setIsDynamic(true);
          setError(null); // Clear error since we have fallback data
        } catch (parseError) {
          setError(storeError.message || 'Failed to load store details');
        }
      } else {
        setError(storeError.message || 'Failed to load store details');
      }
      setPageLoading(false);
      return;
    }

    // Not loading and no error - end page loading after a brief delay (for skeleton animation)
    loadingTimeoutRef.current = setTimeout(() => {
      setPageLoading(false);
    }, 300);
  }, [storeLoading, storeError, storeDataParam, storeIdParam]);

  useEffect(() => {
    // Only initialize once or when actual params change
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    setPageLoading(true); // Start page loading

    const task = InteractionManager.runAfterInteractions(() => {
      if (storeDataParam && storeIdParam && storeTypeParam) {
        try {
          // Parse storeDataParam for immediate display (might be incomplete)
          const parsedData = JSON.parse(storeDataParam);
          setStoreData(parsedData);
          setIsDynamic(true);
          // Note: We still fetch full data via useStoreData hook above
          // fullStoreDataRef.current will be set when fetchedStoreData arrives
        } catch (error) {
          setIsDynamic(false);
        }
      } else if (storeIdParam) {
        // If only storeId is provided, useStoreData hook will fetch it
      } else {
        setIsDynamic(false);
      }
    });

    // Cleanup timeout on unmount
    return () => {
      task.cancel();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      initializedRef.current = false; // Reset on unmount
    };
  }, [storeDataParam, storeIdParam, storeTypeParam]); // Use primitive values instead of params object

  // Responsive horizontal padding
  // Mobile: 12-16px, Tablet: 24px, Desktop: 32px, Large Desktop: max 1200px container
  const HORIZONTAL_PADDING = (() => {
    if (screenData.width < 375) return 12; // Small mobile
    if (screenData.width < 768) return 16; // Mobile
    if (screenData.width < 1024) return 24; // Tablet
    if (screenData.width < 1440) return 32; // Desktop
    // Large desktop: center content with max width
    return Math.max(32, (screenData.width - 1200) / 2);
  })();

  // Content max width for web
  const MAX_CONTENT_WIDTH = isDesktop ? 1200 : undefined;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        setScreenData(window);
      }, 100);
    });

    return () => {
      subscription?.remove();
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>("menu"); // Default to Menu tab

  // Derive menu tab label based on store category
  const menuTabLabel = useMemo(() => {
    const cat = (storeData?.category || '').toLowerCase();
    if (['food', 'dining', 'restaurant', 'cafe', 'bakery', 'kitchen', 'street food'].some(k => cat.includes(k))) return 'Menu';
    if (['service', 'repair', 'cleaning', 'plumbing', 'electrical', 'pest', 'laundry', 'tutor', 'nursing'].some(k => cat.includes(k))) return 'Services';
    return 'Products';
  }, [storeData?.category]);
  const [isFavorited, setIsFavorited] = useState(false);

  // Sticky tab navigation state
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const stickyHeaderAnim = useRef(new Animated.Value(0)).current;
  const tabsContainerRef = useRef<View>(null);
  const tabsPositionY = useRef(0);
  const tabsPositionMeasured = useRef(false);

  // Animate sticky header appearing/disappearing
  useEffect(() => {
    Animated.timing(stickyHeaderAnim, {
      toValue: showStickyTabs ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showStickyTabs, stickyHeaderAnim]);

  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Master page loading state
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state

  // User visits/loyalty state
  const [userVisitsData, setUserVisitsData] = useState<{
    visitsCompleted: number;
    totalVisitsRequired: number;
    nextReward: string;
    visitsRemaining: number;
    progress: number;
    hasCompletedMilestone: boolean;
  } | null>(null);

  // Measure tabs position after page loads
  useEffect(() => {
    if (!pageLoading) {
      // Delay to ensure layout is complete
      const timer = setTimeout(() => {
        // Try to measure via ref first
        if (tabsContainerRef.current && (tabsContainerRef.current as any).measure) {
          (tabsContainerRef.current as any).measure(
            (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
              const position = y + height;
              tabsPositionY.current = position;
              tabsPositionMeasured.current = true;
            }
          );
        } else {
          // Fallback: Use estimated position based on typical layout
          tabsPositionY.current = 550;
          tabsPositionMeasured.current = true;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pageLoading]);
  const [error, setError] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [reviewInnerTab, setReviewInnerTab] = useState<'reviews' | 'ugc'>('reviews'); // Inner tab for reviews section
  const [checkingCanReview, setCheckingCanReview] = useState(false);

  // Always fetch reviews when store ID is available (not just when modal opens)
  // Use storeIdParam or storeData.id directly instead of productData.storeId to avoid initialization error
  const reviewStoreId = storeIdParam || storeData?.id || (isDynamic && storeData ? storeData.id : undefined);
  
  const {
    reviews: storeReviews,
    stats: reviewStats,
    ratingBreakdown: reviewRatingBreakdown,
    loading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useStoreReviews(
    reviewStoreId,
    { limit: 20, sort: 'newest' }
  );

  // UGC content state
  const [ugcContent, setUgcContent] = useState<any[]>([]);
  const [ugcLoading, setUgcLoading] = useState(false);

  // Combined: Check canReview + Fetch UGC content when reviews tab is active or review modal opens
  // Both share the same trigger condition, so we run them in parallel via Promise.all
  useEffect(() => {
    if ((activeTab === "reviews" || showReviewModal) && reviewStoreId) {
      const fetchReviewTabData = async () => {
        // Run canReview check and UGC fetch in parallel
        const [canReviewResult] = await Promise.allSettled([
          // Check if user can review
          (async () => {
            try {
              setCheckingCanReview(true);
              const response = await import('@/services/reviewApi').then(m => m.default.canUserReviewStore(reviewStoreId));
              if (response.success && response.data) {
                setCanReview(response.data.canReview);
              }
            } catch (error) {
              setCanReview(true); // Default to true on error
            } finally {
              setCheckingCanReview(false);
            }
          })(),
          // Fetch UGC content
          (async () => {
            try {
              setUgcLoading(true);
              const response = await apiClient.get(`/ugc/store/${reviewStoreId}`, {
                limit: 20,
                offset: 0,
              });
              if (response.success && response.data) {
                const content = (response.data as any).content || [];
                const transformed = content.map((item: any) => ({
                  id: item._id || item.id,
                  userId: item.userId || item.user?._id,
                  userName: item.user?.profile?.firstName
                    ? `${item.user.profile.firstName} ${item.user.profile.lastName || ''}`.trim()
                    : 'Anonymous',
                  userAvatar: item.user?.profile?.avatar || '',
                  contentType: item.type === 'video' ? 'video' : 'image',
                  uri: item.url || item.thumbnail || '',
                  caption: item.caption || '',
                  likes: item.likes || 0,
                  isLiked: item.isLiked || false,
                  isBookmarked: item.isBookmarked || false,
                  date: new Date(item.createdAt || item.updatedAt),
                  productTags: item.tags || [],
                }));
                setUgcContent(transformed);
              }
            } catch (error) {
              setUgcContent([]);
            } finally {
              setUgcLoading(false);
            }
          })(),
        ]);
      };
      fetchReviewTabData();
    }
  }, [activeTab, showReviewModal, reviewStoreId]);

  // Check if user is following this store (for ProductDisplay heart icon)
  // + Re-check follow status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const storeIdToCheck = storeIdParam || storeData?.id;
      if (storeIdToCheck && isAuthenticated) {
        wishlistApi.checkWishlistStatus('store', storeIdToCheck)
          .then(response => {
            if (response.success && response.data) {
              setIsFavorited(response.data.inWishlist || false);
            }
          })
          .catch(() => {});
      }
    }, [storeIdParam, storeData?.id, isAuthenticated])
  );

  // Refetch store data when review stats change (e.g., after approval)
  // Use a ref to track last fetched values to prevent unnecessary refetches
  const lastFetchedStatsRef = useRef<{ totalReviews: number; averageRating: number } | null>(null);
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Clear any pending refetch
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    
    if (reviewStats && reviewStats.totalReviews > 0 && refetchStore) {
      const currentStats = {
        totalReviews: reviewStats.totalReviews,
        averageRating: reviewStats.averageRating,
      };
      
      // Only refetch if stats actually changed significantly
      const lastStats = lastFetchedStatsRef.current;
      if (!lastStats || 
          lastStats.totalReviews !== currentStats.totalReviews || 
          Math.abs(lastStats.averageRating - currentStats.averageRating) > 0.01) {
        lastFetchedStatsRef.current = currentStats;
        // Debounce the refetch to prevent multiple rapid calls
        refetchTimeoutRef.current = setTimeout(() => {
          if (refetchStore) {
            refetchStore();
          }
          refetchTimeoutRef.current = null;
        }, 1000); // Increased debounce to 1 second
      }
    }
    
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
        refetchTimeoutRef.current = null;
      }
    };
  }, [reviewStats?.totalReviews, reviewStats?.averageRating]); // Removed refetchStore from deps to prevent loops

  // Review action handlers
  const handleReviewHelpful = useCallback(async (reviewId: string) => {
    try {
      const response = await reviewsApi.markHelpful(reviewId);
      if (response.success) {
        // Refetch reviews to update helpful count
        await refetchReviews();
        // Note: Store data will be refetched automatically via useEffect when reviewStats change
      }
    } catch (error) {
      // silently handle
    }
  }, [refetchReviews]);

  const handleReviewReport = useCallback(async (reviewId: string) => {
    try {
      const response = await reviewsApi.reportReview(reviewId, 'inappropriate');
      if (response.success) {
        platformAlertSimple('Success', 'Review reported successfully. Thank you for helping keep our community safe.');
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to report review. Please try again.');
    }
  }, []);

  const handleReviewLike = useCallback(async (reviewId: string) => {
    // Note: The backend doesn't have a separate "like" endpoint, 
    // but we can use helpful as a like mechanism
    await handleReviewHelpful(reviewId);
  }, [handleReviewHelpful]);

  const productData: MainStoreProduct = useMemo(
    () => {
      if (isDynamic && storeData) {

        // Extract location data properly - include all available fields
        let locationStr = "";
        let cityStr = "";
        let stateStr = "";
        let pincodeStr = "";

        if (storeData.location) {
          if (typeof storeData.location === 'object') {
            const locObj = storeData.location as LocationData;
            locationStr = locObj.address || "";
            cityStr = locObj.city || "";
            stateStr = (locObj as any).state || "";
            pincodeStr = (locObj as any).pincode || (locObj as any).pinCode || "";
          } else if (typeof storeData.location === 'string') {
            locationStr = storeData.location;
          }
        }

        // Combine address, city, state, and pincode for display
        // Format: "Address, City, State - Pincode" or simpler format if some fields are missing
        const locationParts = [locationStr, cityStr].filter(Boolean);
        const statePinParts = [stateStr, pincodeStr].filter(Boolean);
        const fullLocation = locationParts.length > 0
          ? locationParts.join(", ") + (statePinParts.length > 0 ? `, ${statePinParts.join(" - ")}` : "")
          : "Location not available";

        // Extract distance if available (from top-level or calculate based on user location)
        const distanceStr = (storeData as any).distance
          ? `${(storeData as any).distance} Km`
          : "";

        // Generate store images - prioritize banner, use logo only as last resort fallback
        // First image should be banner (main store picture), not logo
        // Handle banner as array or string (backward compatibility)
        const getBannerArray = (): string[] => {
          if (!storeData.image) {
            // Use logo if available, otherwise return empty — ProductDisplay will handle empty gracefully
            return storeData.logo ? [storeData.logo] : [];
          }
          if (Array.isArray(storeData.image)) {
            return storeData.image.length > 0 ? storeData.image : (storeData.logo ? [storeData.logo] : []);
          }
          return [storeData.image];
        };
        
        const bannerImages = getBannerArray();
        const storeImages = bannerImages.map((uri, index) => ({ 
          id: `banner-${index + 1}`, 
          uri: typeof uri === 'string' ? uri : String(uri)
        }));
        
        // Only include logo as separate image if it exists and is different from all banner images
        if (storeData.logo && !bannerImages.includes(storeData.logo)) {
          storeImages.push({ id: "logo", uri: storeData.logo });
        }

        return {
          id: storeData.id,
          title: storeData.name || storeData.title || "Store",
          description: storeData.description || `Discover amazing products and services at ${storeData.name}.`,
          price: "View Products", // Store page - not a single product
          location: fullLocation,
          distance: distanceStr,
          isOpen: (() => {
            // Calculate isOpen based on operationalInfo hours if available
            const storeDataToUse = fullStoreDataRef.current;
            if (storeDataToUse?.operationalInfo?.hours) {
              const now = new Date();
              const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // 'monday', 'tuesday', etc.
              const dayHours = storeDataToUse.operationalInfo.hours[currentDayName as keyof typeof storeDataToUse.operationalInfo.hours];
              
              if (dayHours && !dayHours.closed && dayHours.open && dayHours.close) {
                const [openHour, openMin] = dayHours.open.split(':').map(Number);
                const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const openTime = openHour * 60 + openMin;
                const closeTime = closeHour * 60 + closeMin;
                return currentTime >= openTime && currentTime <= closeTime;
              }
              return dayHours?.closed === false || dayHours?.closed === undefined;
            }
            return true; // Default to open if hours not available
          })(),
          images: storeImages,
          logo: storeData.logo || '', // Add logo to productData for circular display
          cashbackPercentage: typeof storeData.cashback === 'object'
            ? storeData.cashback.percentage?.toString() || "0"
            : storeData.cashback?.toString() || "0",
          storeName: storeData.name || storeData.title || "Store",
          storeId: storeData.id,
          category: storeData.category || "General",
        };
      }
      
      // Fallback to existing logic for static mode
      return initialProduct || {
        id: productId || "product-001",
        title: "Little Big Comfort Tee",
        description:
          "Little Big Comfort Tee offers a perfect blend of relaxed fit and soft fabric for all-day comfort and effortless style.",
        price: `${currencySymbol}2,199`,
        location: "BTM",
        distance: "0.7 Km",
        isOpen: true,
        images: [],
        cashbackPercentage: "0",
        storeName: "Reliance Trends",
        storeId: storeIdParam || "store-001",
        category: "Fashion",
      };
    },
    [initialProduct, productId, isDynamic, storeData, currencySymbol]
  );

  // Fetch user visits data (after page has finished loading and interactions are complete)
  useEffect(() => {
    if (!isDynamic || pageLoading) return;

    const storeId = storeIdParam || storeData?.id || productData.storeId;
    if (!storeId) return;

    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const response = await storesApi.getUserStoreVisits(storeId);
        if (response.success && response.data) {
          setUserVisitsData({
            visitsCompleted: response.data.visitsCompleted,
            totalVisitsRequired: response.data.totalVisitsRequired,
            nextReward: response.data.nextReward,
            visitsRemaining: response.data.visitsRemaining,
            progress: response.data.progress,
            hasCompletedMilestone: response.data.hasCompletedMilestone,
          });
        }
      } catch (error) {
        // Keep default null state - user may not be logged in
      }
    });

    return () => task.cancel();
  }, [storeIdParam, storeData?.id, productData.storeId, isDynamic, pageLoading]);

  const handleSharePress = useCallback(async () => {
    try {
      setIsLoading(true);
      await Share.share({
        message: `Check out ${productData.title} at ${productData.storeName} for ${productData.price}`,
        url: `https://store.example.com/products/${productData.id}`,
        title: productData.title,
      });
    } catch (err) {
      setError("Failed to share product.");
    } finally {
      setIsLoading(false);
    }
  }, [productData]);

  const handleFavoritePress = useCallback(async () => {
    if (!isAuthenticated) {
      showAlert(
        'Sign In Required',
        'Please sign in to follow stores and get updates on their offers.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/sign-in') },
        ],
        'info'
      );
      return;
    }

    const storeIdToUse = storeIdParam || storeData?.id || productData.storeId;
    if (!storeIdToUse) {
      showAlert('Error', 'Store information not available', undefined, 'error');
      return;
    }

    // Optimistic update
    const wasFollowing = isFavorited;
    setIsFavorited(!wasFollowing);
    setIsFollowLoading(true);

    try {
      if (wasFollowing) {
        // Unfollow store - use wishlistApi (backend supports this)
        const response = await wishlistApi.removeFromWishlist('store', storeIdToUse);
        if (response.success) {
          showAlert(
            'Unfollowed',
            `You've unfollowed ${productData.title || productData.storeName}.`,
            undefined,
            'info'
          );
        } else {
          throw new Error(response.message || 'Failed to unfollow');
        }
      } else {
        // Follow store - use wishlistApi (backend supports this)
        const response = await wishlistApi.addToWishlist({
          itemType: 'store',
          itemId: storeIdToUse,
          notes: `Following ${productData.title || productData.storeName}`,
          priority: 'medium',
        });
        if (response.success) {
          showAlert(
            'Store Followed!',
            `You're now following ${productData.title || productData.storeName}. You'll see their latest offers in your feed.`,
            undefined,
            'success'
          );
        } else {
          throw new Error(response.message || 'Failed to follow');
        }
      }
    } catch (error) {
      // Revert on error
      setIsFavorited(wasFollowing);
      showAlert('Error', 'Something went wrong. Please try again.', undefined, 'error');
    } finally {
      setIsFollowLoading(false);
    }
  }, [isAuthenticated, isFavorited, storeIdParam, storeData?.id, productData.storeId, productData.title, productData.storeName, router]);

  // Tab-based content: Change active tab to show different sections
  // All content is rendered inline based on activeTab state
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const handleCloseAboutModal = useCallback(() => setShowAboutModal(false), []);
  const handleCloseDealsModal = useCallback(() => setShowDealsModal(false), []);
  const handleCloseReviewModal = useCallback(() => setShowReviewModal(false), []);
  const handleWriteReview = useCallback(() => {
    if (canReview === false) {
      platformAlert(
        'Already Reviewed',
        'You have already reviewed this store. You can edit your existing review from your profile.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowReviewModal(false); // Close review modal first
    setTimeout(() => {
      setShowWriteReviewModal(true); // Open write review modal
    }, 300);
  }, [canReview]);
  const handleCloseWriteReviewModal = useCallback(() => setShowWriteReviewModal(false), []);
  const handleReviewSubmitted = useCallback(async (review: any) => {
    // Refresh reviews after submission
    if (reviewStoreId) {
      // Refetch reviews to show the new review
      if (refetchReviews) {
        await refetchReviews();
      }
      // Note: Store data will be refetched automatically via useEffect when reviewStats change
      // Show success message
      platformAlert(
        'Review Submitted',
        'Your review has been submitted successfully! It will be visible after merchant approval.',
        [{ text: 'OK' }]
      );
    }
  }, [reviewStoreId, refetchReviews]);

  const handleViewAllPress = useCallback(() => {
    platformAlert("UGC", "View all UGC");
  }, []);

  const handleImagePress = useCallback((imageId: string) => {
    // Navigate to UGC detail page
    router.push(`/ugc/${imageId}`);
  }, [router]);

  const handleAddToCart = useCallback(() => {
    const cartItem: CartItemFromProduct = {
      id: productData.id,
      name: productData.title,
      price: parsePrice(productData.price), // Use safe price parser
      image: productData.images[0]?.uri || "",
      cashback: `${productData.cashbackPercentage} cashback`,
      category: "products",
    };
    platformAlert("Added to Cart", `${productData.title} has been added to your cart.`);
  }, [productData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setShowStickyTabs(false); // Hide sticky tabs during refresh
    tabsPositionMeasured.current = false; // Reset measurement for re-layout
    try {
      // Refetch store data if storeId is provided
      if (storeIdParam && !storeDataParam) {
        await refetchStore();
      } else {
        // Simulate refresh delay for smooth animation
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // In a real implementation, you would also:
      // - Reload products
      // - Refresh UGC content
      // - Update promotions/discounts

    } catch (error) {
      setError('Failed to refresh store data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleVisitStorePress = useCallback(() => {
    platformAlert("Visit Store", `Open ${productData.storeName}`);
  }, [productData.storeName]);

  const handleBackPress = useCallback(() => router.back(), [router]);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4500);
    return () => clearTimeout(id);
  }, [error]);

  const styles = useMemo(() => createStyles(HORIZONTAL_PADDING, screenData), [HORIZONTAL_PADDING, screenData]);

  return (
    <ThemedView style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />

      {/* NEW: Redesigned Header - Clean white with coin display */}
      <MainStoreHeader
        storeName={isDynamic && storeData ? storeData.name || storeData.title : productData.storeName}
        storeCategory={storeData?.category || productData.category || 'Store'}
        onBack={handleBackPress}
        onFavoritePress={handleFavoritePress}
        isFavorited={isFavorited}
        userCoins={userCoins}
        storeId={storeIdParam || storeData?.id || productData.storeId}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const y = event.nativeEvent.contentOffset.y;
              // Show sticky tabs when original tabs scroll out of view
              const shouldShow = tabsPositionMeasured.current && y > tabsPositionY.current;
              setShowStickyTabs(shouldShow);
            }
          }
        )}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.webScrollContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.gold, Colors.nileBlue]} // Android
            tintColor={Colors.gold} // iOS
            title="Pull to refresh" // iOS
            titleColor={Colors.text.tertiary}
          />
        }
      >
        <View style={[
          styles.contentWrapper,
          MAX_CONTENT_WIDTH && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }
        ]}>
          {/* SKELETON LOADING STATE - Amazon/Flipkart Style */}
          {pageLoading ? (
            <>
              {/* Promotion Banners Skeleton */}
              <PromotionBannerSkeleton count={2} />

              {/* Store Header Skeleton */}
              <StoreHeaderSkeleton />

              {/* Products Grid Skeleton */}
              <View style={{ paddingHorizontal: HORIZONTAL_PADDING, marginTop: Spacing.lg }}>
                <ProductGridSkeleton count={6} />
              </View>
            </>
          ) : (
            <>
            <View style={styles.imageSection}>
              <View style={styles.imageCard}>
                <ProductDisplay
                  images={productData.images}
                  onSharePress={handleSharePress}
                  onFavoritePress={handleFavoritePress}
                  isFavorited={isFavorited}
                  // New Magicpin-inspired props
                  rating={reviewStats?.averageRating || storeData?.rating || 0}
                  reviewCount={reviewStats?.totalReviews || storeData?.ratingCount || 0}
                  categoryTags={storeData?.tags || []}
                  phoneNumber={storeData?.contact?.phone}
                  locationCoords={
                    storeData?.location && typeof storeData.location === 'object'
                      ? (() => {
                          const coords = (storeData.location as any).coordinates;
                          if (!coords) return undefined;
                          // Handle both {lat,lng} object and [lng,lat] array (MongoDB GeoJSON)
                          const lat = coords.lat || coords[1] || 0;
                          const lng = coords.lng || coords[0] || 0;
                          return (lat && lng) ? { lat, lng } : undefined;
                        })()
                      : undefined
                  }
                />
              </View>
            </View>

            {/* Store Info Section - Clean Design */}
            {(productData.title || storeData?.name) && (() => {
              const rating = reviewStats?.averageRating || storeData?.rating || 0;
              const reviewCount = reviewStats?.totalReviews || storeData?.ratingCount || 0;
              const distance = productData.distance; // Only show if real data exists
              const isVerified = true; // All stores on ReZ platform are verified partners
              const hasCashback = true; // All stores on ReZ platform have instant cashback
              const hasExtraCoins = true; // All stores on ReZ platform offer extra coins
              const categoryTags = storeData?.tags || [];

              // Get icon for category tag
              const getCategoryIcon = (tag: string): keyof typeof Ionicons.glyphMap => {
                const lowerTag = tag.toLowerCase();
                if (lowerTag.includes('coffee') || lowerTag.includes('cafe')) return 'cafe-outline';
                if (lowerTag.includes('art')) return 'color-palette-outline';
                if (lowerTag.includes('food') || lowerTag.includes('restaurant') || lowerTag.includes('dining')) return 'restaurant-outline';
                if (lowerTag.includes('local')) return 'location-outline';
                if (lowerTag.includes('chain')) return 'link-outline';
                if (lowerTag.includes('premium')) return 'diamond-outline';
                if (lowerTag.includes('fast')) return 'flash-outline';
                if (lowerTag.includes('healthy')) return 'leaf-outline';
                return 'pricetag-outline';
              };

              return (
                <View style={styles.storeInfoSection}>
                  {/* Store Name */}
                  <ThemedText style={styles.storeNameLarge} numberOfLines={1}>
                    {productData.title || storeData?.name || 'Store'}
                  </ThemedText>

                  {/* Rating + Feature Tags Row */}
                  <View style={styles.ratingTagsRow}>
                    {/* Rating Badge - Green Pill */}
                    <View style={styles.ratingBadgePill}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <ThemedText style={styles.ratingBadgeText}>
                        {rating > 0 ? rating.toFixed(1) : 'New'}
                      </ThemedText>
                    </View>

                    {/* Category Tags */}
                    {categoryTags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.categoryTag}>
                        <Ionicons name={getCategoryIcon(tag)} size={12} color={Colors.text.tertiary} />
                        <ThemedText style={styles.categoryTagText}>{tag}</ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Feature Tags Row */}
                  <View style={styles.featureTagsRow}>
                    {isVerified && (
                      <View style={styles.tagVerified}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.gold} />
                        <ThemedText style={styles.tagTextVerified}>Verified Partner</ThemedText>
                      </View>
                    )}
                    {hasCashback && (
                      <View style={styles.tagCashback}>
                        <Ionicons name="flash" size={14} color="#FF9500" />
                        <ThemedText style={styles.tagTextCashback}>Instant Cashback</ThemedText>
                      </View>
                    )}
                    {hasExtraCoins && (
                      <View style={styles.tagCoins}>
                        <Ionicons name="gift" size={14} color={Colors.brand.purpleLight} />
                        <ThemedText style={styles.tagTextCoins}>Extra Coins</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Cashback Hero Card - Only show when store has actual cashback */}
            {isDynamic && storeData && (() => {
              const cashbackVal = typeof storeData.cashback === 'number'
                ? storeData.cashback
                : (storeData as any).offers?.cashback || 0;
              if (cashbackVal <= 0) return null;
              return (
                <CashbackHeroCard
                  cashbackPercentage={cashbackVal}
                  coinsToEarn={(storeData as any).rewardRules?.reviewBonusCoins || 50}
                />
              );
            })()}

            {/* Store Action Buttons */}
            <NewStoreActionButtons
              storeId={storeIdParam || storeData?.id || productData.storeId}
              onScanPay={() => {
                router.push({
                  pathname: '/pay-in-store/enter-amount',
                  params: {
                    storeId: storeIdParam || storeData?.id || productData.storeId,
                    storeName: storeData?.name || storeData?.title || productData.storeName || '',
                    storeLogo: storeData?.logo || '',
                  }
                } as any);
              }}
              onUploadBill={() => {
                router.push({
                  pathname: '/bill-upload',
                  params: {
                    storeId: storeIdParam || storeData?.id || productData.storeId,
                    storeName: storeData?.name || storeData?.title || productData.storeName,
                  }
                } as any);
              }}
              onViewOffers={() => {
                router.push({
                  pathname: '/CardOffersPage',
                  params: {
                    storeId: storeIdParam || storeData?.id || productData.storeId,
                    storeName: storeData?.name || storeData?.title || productData.storeName,
                    orderValue: '1000',
                  }
                } as any);
              }}
            />

            {/* Store Quick Info - Real data */}
            {isDynamic && storeData && (
              <StoreQuickInfoCard
                storeName={storeData.name || storeData.title || productData.title}
                description={(storeData as any).description}
                isVerified={(storeData as any).isVerified}
                operationalInfo={(storeData as any).operationalInfo}
                location={
                  storeData.location && typeof storeData.location === 'object'
                    ? {
                        address: (storeData.location as any).address,
                        city: (storeData.location as any).city,
                        state: (storeData.location as any).state,
                        coordinates: (storeData.location as any).coordinates
                          ? {
                              lat: (storeData.location as any).coordinates.lat || (storeData.location as any).coordinates[1],
                              lng: (storeData.location as any).coordinates.lng || (storeData.location as any).coordinates[0],
                            }
                          : undefined,
                      }
                    : undefined
                }
              />
            )}

            {/* Book a Table Section - Food/Dining stores only */}
            {isDynamic && storeData && (() => {
              const storeCategory = (storeData.category || '').toLowerCase();
              const isFoodStore = ['food', 'dining', 'restaurant', 'cafe', 'bakery', 'kitchen', 'street food'].some(k => storeCategory.includes(k));
              if (!isFoodStore) return null;

              const theStoreId = storeIdParam || storeData?.id;
              const theStoreName = storeData?.name || storeData?.title;

              return (
                <View style={bookTableStyles.container}>
                  <Pressable
                    style={bookTableStyles.card}
                    onPress={() => router.push(`/MainCategory/food-dining/book-table?storeId=${theStoreId}&storeName=${encodeURIComponent(theStoreName || '')}` as any)}
                   
                  >
                    <LinearGradient
                      colors={[Colors.nileBlue, '#0f2638']}
                      style={bookTableStyles.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={bookTableStyles.row}>
                        <View style={bookTableStyles.iconWrap}>
                          <Ionicons name="restaurant-outline" size={20} color={Colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={bookTableStyles.title}>Book a Table</Text>
                          <Text style={bookTableStyles.subtitle}>
                            Reserve & earn cashback on dine-in
                          </Text>
                        </View>
                        <View style={bookTableStyles.cta}>
                          <Ionicons name="chevron-forward" size={16} color={Colors.nileBlue} />
                        </View>
                      </View>
                      <View style={bookTableStyles.perks}>
                        <View style={bookTableStyles.perk}>
                          <Ionicons name="checkmark-circle" size={13} color="#34D399" />
                          <Text style={bookTableStyles.perkText}>No pre-payment</Text>
                        </View>
                        <View style={bookTableStyles.perk}>
                          <Ionicons name="wallet-outline" size={13} color={Colors.warning} />
                          <Text style={bookTableStyles.perkText}>Bonus coins</Text>
                        </View>
                        <View style={bookTableStyles.perk}>
                          <Ionicons name="time-outline" size={13} color="#60A5FA" />
                          <Text style={bookTableStyles.perkText}>Instant confirm</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              );
            })()}

            {/* Store Offers Preview - Real data */}
            {isDynamic && storeData && (() => {
              // Get offers from store data
              const storeOffers = (storeData as any).offers;
              const cashbackPercent = typeof storeData.cashback === 'number' ? storeData.cashback : (storeData as any).offers?.cashback || 0;

              // Build offers array from store data
              const offers = [];

              // Add cashback offer if available
              if (cashbackPercent > 0) {
                offers.push({
                  id: 'cashback-offer',
                  type: 'cashback' as const,
                  value: cashbackPercent,
                  title: `Get ${cashbackPercent}% Cashback on all orders`,
                  description: storeOffers?.maxCashback ? `Max cashback ${currencySymbol}${storeOffers.maxCashback}` : undefined,
                  minOrderAmount: storeOffers?.minOrderAmount,
                  validTill: undefined,
                  coinsToEarn: Math.round((storeOffers?.maxCashback || 100) * 0.05), // 5% of max cashback as coins
                });
              }

              // Add first order offer
              if ((storeData as any).offers?.firstOrderDiscount) {
                const discount = (storeData as any).offers.firstOrderDiscount;
                offers.push({
                  id: 'first-order',
                  type: 'flat' as const,
                  value: discount,
                  title: `Flat ${currencySymbol}${discount} off on first order`,
                  code: 'FIRST' + discount,
                  validTill: undefined,
                  coinsToEarn: Math.round(discount * 0.05), // 5% of discount as coins
                });
              }

              // Add BOGO offer if store has it
              if ((storeData as any).deliveryCategories?.budgetFriendly) {
                offers.push({
                  id: 'bogo-offer',
                  type: 'percentage' as const,
                  value: 20,
                  title: 'Buy 1 Get 1 Free on select items',
                  minOrderAmount: 300,
                  validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 7 days
                  coinsToEarn: 25, // 5% of ₹500 average order
                });
              }

              // Add UPI cashback offer
              if ((storeData as any).paymentSettings?.acceptUPI !== false) {
                offers.push({
                  id: 'upi-cashback',
                  type: 'cashback' as const,
                  value: 15,
                  title: 'Extra 15% Cashback with UPI',
                  description: `Max cashback ${currencySymbol}150`,
                  validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 30 days
                  coinsToEarn: Math.round(150 * 0.05), // 5% of max cashback
                });
              }

              if (offers.length === 0) return null;

              return (
                <StoreOffersPreview
                  offers={offers}
                  onViewAll={() => {
                    router.push({
                      pathname: '/CardOffersPage',
                      params: {
                        storeId: storeIdParam || storeData?.id || productData.storeId,
                        storeName: storeData?.name || storeData?.title || productData.storeName,
                      }
                    } as any);
                  }}
                  onApplyOffer={(offer) => {
                    // Navigate to payment or show offer details
                    router.push({
                      pathname: '/pay-in-store',
                      params: {
                        storeId: storeIdParam || storeData?.id || productData.storeId,
                        offerId: offer.id,
                      }
                    } as any);
                  }}
                />
              );
            })()}

            {/* User Loyalty Card - Only show when loyalty data was fetched */}
            {isDynamic && storeData && userVisitsData && (
              <UserLoyaltyCard
                visitsCompleted={userVisitsData?.visitsCompleted ?? 0}
                totalVisitsRequired={userVisitsData?.totalVisitsRequired ?? (storeData as any).rewardRules?.visitMilestoneRewards?.[0]?.visits ?? 5}
                nextReward={userVisitsData?.nextReward ?? (storeData as any).rewardRules?.visitMilestoneRewards?.[0]?.reward ?? 'Free Coffee'}
                rewardIcon="cafe"
                onViewDetails={() => {
                  router.push({
                    pathname: '/loyalty',
                    params: {
                      storeId: storeIdParam || storeData?.id || productData.storeId,
                      storeName: storeData?.name || storeData?.title || productData.storeName,
                    }
                  } as any);
                }}
              />
            )}

            {/* Payment Methods Card - Only show when store has payment settings */}
            {isDynamic && storeData && fullStoreDataRef.current?.paymentSettings && (
              <PaymentMethodsCard
                acceptPromoCoins={(storeData as any).paymentSettings?.acceptPromoCoins !== false}
                acceptBrandedCoins={true}
                acceptRezCoins={(storeData as any).paymentSettings?.acceptRezCoins !== false}
                acceptUPI={(storeData as any).paymentSettings?.acceptUPI !== false}
                acceptCards={(storeData as any).paymentSettings?.acceptCards !== false}
                acceptPayLater={(storeData as any).paymentSettings?.acceptPayLater === true}
              />
            )}

            <View
              ref={tabsContainerRef}
              style={styles.tabsContainer}
              onLayout={(e) => {
                // Measure tab position for sticky header trigger
                const position = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
                tabsPositionY.current = position;
                tabsPositionMeasured.current = true;
              }}
            >
              <TabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                menuTabLabel={menuTabLabel}
                // New Magicpin-inspired props
                maxSavingsPercent={
                  typeof storeData?.cashback === 'number'
                    ? storeData.cashback
                    : typeof storeData?.discount === 'number'
                      ? storeData.discount
                      : undefined
                }
                reviewCount={reviewStats?.totalReviews || storeData?.ratingCount}
                photoCount={storeData?.photoCount} // Only show if real data exists
              />
            </View>

            {/* ===== TAB-BASED CONTENT SECTIONS ===== */}

            {/* MENU TAB (menu) - Products and store items */}
            {activeTab === "menu" && (
              <>
                {/* Product Details - Only on Overview tab */}
                <View style={styles.sectionCard}>
                  <ProductDetails
                    title={productData.title}
                    description={productData.description}
                    location={productData.location}
                    distance={productData.distance}
                    isOpen={productData.isOpen}
                    // New Magicpin-inspired props
                    isVerified={true}
                    operatingHours={storeData?.operationalInfo?.hours}
                  />
                </View>

                {/* Cashback Offer - Only show when store has cashback */}
                {productData.cashbackPercentage && productData.cashbackPercentage !== "0" && (
                  <View style={styles.sectionCard}>
                    <CashbackOffer
                      percentage={productData.cashbackPercentage}
                      title="Cash back"
                      onPress={() => platformAlert('Cashback Details', `Get ${productData.cashbackPercentage}% cashback on purchases from this store!`)}
                    />
                  </View>
                )}

                {/* Store Products Grid */}
                {isDynamic && storeData && (
                  <View style={styles.sectionCard}>
                    <ErrorBoundary>
                      <StoreProducts storeId={productData.storeId} storeName={productData.storeName} />
                    </ErrorBoundary>
                  </View>
                )}

                {/* Frequently Bought Together / Popular Products */}
                {isDynamic && storeData && productData.storeId && (
                  <View style={styles.sectionCard}>
                    <ErrorBoundary>
                      <FrequentlyBoughtTogether
                        storeId={productData.storeId}
                        currentProduct={{
                          id: productData.id,
                          type: 'product',
                          name: productData.title,
                          brand: productData.storeName,
                          image: productData.images[0]?.uri || '',
                          title: productData.title,
                          description: productData.description,
                          price: {
                            current: parsePrice(productData.price, { fallback: 1000 }),
                            currency: regionCurrency,
                            discount: 0,
                          },
                          category: productData.category,
                          availabilityStatus: productData.isOpen ? 'in_stock' : 'out_of_stock',
                          tags: [],
                        }}
                        onBundleAdded={() => {
                          platformAlert('Added to Cart', 'Bundle products have been added to your cart!');
                        }}
                      />
                    </ErrorBoundary>
                  </View>
                )}
              </>
            )}

            {/* OFFERS SECTION - Now visible on Menu tab */}
            {activeTab === "menu" && (
              <>
                {/* Voucher Cards Section - No wrapper View to avoid empty space when no vouchers */}
                {isDynamic && storeData && (
                  <VoucherCardsSection
                    storeId={productData.storeId}
                    onBuyVoucher={(voucherId) => {
                      platformAlert('Buy Voucher', `Purchasing voucher ${voucherId}...`);
                    }}
                    onSeeAllPress={() => {
                      platformAlert('All Vouchers', 'View all available vouchers');
                    }}
                  />
                )}
              </>
            )}

            {/* REVIEWS TAB - Full Inline Review Section */}
            {activeTab === "reviews" && (
              <>
                {/* Reviews Header */}
                <View style={styles.sectionCard}>
                  <View style={styles.reviewsHeader}>
                    <ThemedText style={styles.reviewsHeaderTitle}>Reviews & Ratings</ThemedText>
                    <ThemedText style={styles.reviewsStoreName}>
                      {isDynamic && storeData ? storeData.name || storeData.title : productData.storeName}
                    </ThemedText>
                  </View>
                </View>

                {/* Rating Summary Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.ratingSummaryCard}>
                    <View style={styles.averageRatingContainer}>
                      <ThemedText style={styles.averageRatingNumber}>
                        {(reviewStats?.averageRating || storeData?.rating || 0).toFixed(1)}
                      </ThemedText>
                      <ThemedText style={styles.outOfFive}> / 5</ThemedText>
                    </View>
                    <View style={styles.starsContainer}>
                      <StarRating
                        rating={reviewStats?.averageRating || storeData?.rating || 0}
                        size="large"
                        showHalf={true}
                      />
                    </View>
                    <ThemedText style={styles.totalReviewsText}>
                      Based on {(reviewStats?.totalReviews || storeData?.ratingCount || 0).toLocaleString()} reviews
                    </ThemedText>
                  </View>
                </View>

                {/* Rating Breakdown */}
                <View style={styles.sectionCard}>
                  <RatingBreakdown
                    ratingBreakdown={{
                      fiveStars: reviewRatingBreakdown[5] || 0,
                      fourStars: reviewRatingBreakdown[4] || 0,
                      threeStars: reviewRatingBreakdown[3] || 0,
                      twoStars: reviewRatingBreakdown[2] || 0,
                      oneStar: reviewRatingBreakdown[1] || 0,
                    }}
                    totalReviews={reviewStats?.totalReviews || storeData?.ratingCount || 0}
                  />
                </View>

                {/* Write Review Button */}
                <View style={styles.sectionCard}>
                  {canReview === false ? (
                    <View style={styles.alreadyReviewedBanner}>
                      <View style={styles.alreadyReviewedContent}>
                        <View style={styles.alreadyReviewedIconContainer}>
                          <Ionicons name="star" size={20} color="#FFC857" />
                        </View>
                        <ThemedText style={styles.alreadyReviewedText}>
                          You have already reviewed this store
                        </ThemedText>
                        <Pressable style={styles.editReviewButton}>
                          <Ionicons name="create-outline" size={18} color={Colors.gold} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.writeReviewButton}
                      onPress={() => setShowWriteReviewModal(true)}
                    >
                      <LinearGradient
                        colors={[Colors.gold, Colors.nileBlue]}
                        style={styles.writeReviewGradient}
                      >
                        <Ionicons name="create-outline" size={20} color={Colors.text.inverse} />
                        <ThemedText style={styles.writeReviewText}>Write a Review</ThemedText>
                      </LinearGradient>
                    </Pressable>
                  )}
                </View>

                {/* Inner Tabs - Reviews / UGC Content */}
                <View style={styles.sectionCard}>
                  <View style={styles.reviewInnerTabsContainer}>
                    <Pressable
                      style={[styles.reviewInnerTab, reviewInnerTab === 'reviews' && styles.reviewInnerTabActive]}
                      onPress={() => setReviewInnerTab('reviews')}
                    >
                      {reviewInnerTab === 'reviews' ? (
                        <LinearGradient
                          colors={[Colors.gold, Colors.nileBlue]}
                          style={styles.reviewInnerTabGradient}
                        >
                          <ThemedText style={styles.reviewInnerTabTextActive}>
                            Reviews ({reviewStats?.totalReviews || storeData?.ratingCount || 0})
                          </ThemedText>
                        </LinearGradient>
                      ) : (
                        <ThemedText style={styles.reviewInnerTabText}>
                          Reviews ({reviewStats?.totalReviews || storeData?.ratingCount || 0})
                        </ThemedText>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.reviewInnerTab, reviewInnerTab === 'ugc' && styles.reviewInnerTabActive]}
                      onPress={() => setReviewInnerTab('ugc')}
                    >
                      {reviewInnerTab === 'ugc' ? (
                        <LinearGradient
                          colors={[Colors.gold, Colors.nileBlue]}
                          style={styles.reviewInnerTabGradient}
                        >
                          <ThemedText style={styles.reviewInnerTabTextActive}>UGC Content</ThemedText>
                        </LinearGradient>
                      ) : (
                        <ThemedText style={styles.reviewInnerTabText}>UGC Content</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Reviews List or UGC Content */}
                {reviewInnerTab === 'reviews' ? (
                  <View style={styles.sectionCard}>
                    {reviewsLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.gold} />
                        <ThemedText style={styles.loadingText}>Loading reviews...</ThemedText>
                      </View>
                    ) : storeReviews.length === 0 ? (
                      <View style={styles.emptyReviewState}>
                        <LinearGradient
                          colors={[Colors.gold, Colors.nileBlue]}
                          style={styles.emptyIconContainer}
                        >
                          <Ionicons name="chatbubble-outline" size={32} color={Colors.text.inverse} />
                        </LinearGradient>
                        <ThemedText style={styles.emptyStateTitle}>No reviews yet</ThemedText>
                        <ThemedText style={styles.emptyStateText}>
                          Be the first to review this store!
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.reviewListContainer}>
                        {storeReviews.map((review) => (
                          <View key={review.id} style={styles.reviewCardWrapper}>
                            <ReviewCard
                              review={review}
                              onLike={handleReviewLike ? () => handleReviewLike(review.id) : undefined}
                              onReport={handleReviewReport ? () => handleReviewReport(review.id) : undefined}
                              onHelpful={handleReviewHelpful ? () => handleReviewHelpful(review.id) : undefined}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.sectionCard}>
                    {ugcLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.gold} />
                        <ThemedText style={styles.loadingText}>Loading UGC content...</ThemedText>
                      </View>
                    ) : ugcContent.length === 0 ? (
                      <View style={styles.emptyReviewState}>
                        <LinearGradient
                          colors={['#FFC857', '#E5A500']}
                          style={styles.emptyIconContainer}
                        >
                          <Ionicons name="images-outline" size={32} color="#0B2240" />
                        </LinearGradient>
                        <ThemedText style={styles.emptyStateTitle}>No content yet</ThemedText>
                        <ThemedText style={styles.emptyStateText}>
                          User-generated content will appear here.
                        </ThemedText>
                      </View>
                    ) : (
                      <UGCGrid
                        ugcContent={ugcContent}
                        onContentPress={() => {}}
                        onLikeContent={() => {}}
                      />
                    )}
                  </View>
                )}
              </>
            )}

            {/* PHOTOS TAB */}
            {activeTab === "photos" && (
              <>
                {/* Photos content will be moved here - see StoreGallerySection and UGCSection below */}
              </>
            )}

            {/* ABOUT TAB - Store info, recommendations */}
            {activeTab === "about" && (
              <>
                {/* Cross-Store Products Recommendations */}
                <View style={styles.sectionCard}>
                  <ErrorBoundary>
                    <CrossStoreProductsSection
                      currentStoreId={productData.storeId}
                      limit={10}
                      onProductPress={(productId, product) => {
                        router.push({
                          pathname: '/product-page',
                          params: { cardId: productId, cardType: 'product' }
                        } as any);
                      }}
                    />
                  </ErrorBoundary>
                </View>

                {/* Similar Stores Recommendations */}
                <View style={styles.sectionCard}>
                  <ErrorBoundary>
                    <SimilarStoresSection
                      currentStoreId={productData.storeId}
                      currentStoreCategory={isDynamic && storeData ? storeData.category : undefined}
                      limit={8}
                      onStorePress={(storeId, storeData) => {
                        router.push({
                          pathname: '/MainStorePage',
                          params: {
                            storeId: storeId,
                            storeData: JSON.stringify(storeData),
                            storeType: 'dynamic'
                          }
                        } as any);
                      }}
                    />
                  </ErrorBoundary>
                </View>
              </>
            )}

            {/* MENU TAB - Additional Sections (offers, etc.) */}
            {activeTab === "menu" && (
              <>
                {/* Mega Sale Offers */}
                <View style={styles.sectionCard}>
                  <ErrorBoundary>
                    <Section3 productPrice={parsePrice(productData.price, { fallback: 1000 })} storeId={productData.storeId} />
                  </ErrorBoundary>
                </View>

                {/* Card Offers */}
                <View style={styles.sectionCard}>
                  <ErrorBoundary>
                    <Section4
                      productPrice={parsePrice(productData.price, { fallback: 1000 })}
                      storeId={productData.storeId}
                      onPress={() => {
                        router.push({
                          pathname: '/CardOffersPage',
                          params: {
                            storeId: productData.storeId,
                            storeName: productData.storeName,
                            orderValue: parsePrice(productData.price, { fallback: 1000 }).toString(),
                          },
                        } as any);
                      }}
                    />
                  </ErrorBoundary>
                </View>

                {/* Follow Store Section */}
                <View style={styles.sectionCard}>
                  <FollowStoreSection
                    storeData={isDynamic && storeData ? {
                      id: storeData.id,
                      _id: storeData.id,
                      name: (storeData as any).name || (storeData as any).title,
                      title: (storeData as any).title || (storeData as any).name,
                      image: (storeData as any).image,
                      logo: (storeData as any).logo,
                      category: (storeData as any).category,
                      cashback: typeof (storeData as any).cashback === 'number'
                        ? (storeData as any).cashback
                        : (storeData as any).cashback?.percentage,
                      discount: typeof (storeData as any).discount === 'number'
                        ? (storeData as any).discount
                        : undefined,
                    } : null}
                    isFollowingProp={isFavorited}
                    onFollowChange={setIsFavorited}
                  />
                </View>
              </>
            )}

            {/* PHOTOS TAB - Gallery and UGC Sections */}
            {activeTab === "photos" && (
              <>
                {/* Store Gallery Section */}
                {storeIdParam && (
                  <View style={styles.sectionCard}>
                    <ErrorBoundary>
                      <StoreGallerySection storeId={storeIdParam} />
                    </ErrorBoundary>
                  </View>
                )}

                {/* UGC Section */}
                <View style={styles.sectionCard}>
                  <ErrorBoundary>
                    <UGCSection
                      storeId={productData.storeId}
                      onViewAllPress={handleViewAllPress}
                      onImagePress={handleImagePress}
                    />
                  </ErrorBoundary>
                </View>
              </>
            )}

            {/* Quick Actions - Always visible */}
            <View style={styles.sectionCard}>
              <Section2 dynamicData={isDynamic && storeData ? {
                store: {
                  phone: (storeData as any).phone || (storeData as any).contact?.phone,
                  contact: (storeData as any).contact?.phone || (storeData as any).phone,
                  email: (storeData as any).contact?.email || (storeData as any).email,
                  location: typeof storeData.location === 'object' ? {
                    lat: (storeData.location as any).lat,
                    lng: (storeData.location as any).lng,
                    address: (storeData.location as LocationData).address || (storeData.location as LocationData).city
                  } : undefined
                },
                id: storeData.id,
                _id: storeData.id,
                name: storeData.name,
                title: storeData.title,
                contact: storeData.contact,
              } : null} />
            </View>

            {/* People Are Earning Here Section */}
            <View style={styles.sectionCard}>
              <PeopleEarningSection storeId={productData.storeId} />
            </View>

            {/* Location & Directions Section */}
            <View style={styles.sectionCard}>
              <LocationSection
                address={
                  typeof productData.location === 'object'
                    ? `${(productData.location as LocationData).address || ''}, ${(productData.location as LocationData).city || ''}`
                    : productData.location || 'Store Location'
                }
                distance="Nearby"
                latitude={
                  typeof productData.location === 'object'
                    ? (() => { const c = (productData.location as any).coordinates; return c?.lat || c?.[1] || undefined; })()
                    : undefined
                }
                longitude={
                  typeof productData.location === 'object'
                    ? (() => { const c = (productData.location as any).coordinates; return c?.lng || c?.[0] || undefined; })()
                    : undefined
                }
              />
            </View>

            {/* Nearby Nquta Stores Section */}
            <NearbyStoresSection
              currentStoreId={productData.storeId}
              userLat={
                typeof productData.location === 'object'
                  ? (() => { const c = (productData.location as any).coordinates; return c?.lat || c?.[1] || undefined; })()
                  : undefined
              }
              userLng={
                typeof productData.location === 'object'
                  ? (() => { const c = (productData.location as any).coordinates; return c?.lng || c?.[0] || undefined; })()
                  : undefined
              }
            />

            {/* Terms & Transparency Section */}
            <TermsTransparencySection />

            {/* Rewards Footer Banner */}
            <RewardsFooterBanner />

          </>
        )}
        </View>
      </Animated.ScrollView>

      {/* Sticky Tab Navigation - Appears when original tabs scroll out of view */}
      <Animated.View
        style={[
          styles.stickyTabsContainer,
          {
            opacity: stickyHeaderAnim,
            transform: [
              {
                translateY: stickyHeaderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
            pointerEvents: showStickyTabs ? 'auto' : 'none',
          },
        ]}
      >
        <View style={styles.stickyTabsInner}>
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            menuTabLabel={menuTabLabel}
            maxSavingsPercent={
              typeof storeData?.cashback === 'number'
                ? storeData.cashback
                : typeof storeData?.discount === 'number'
                  ? storeData.discount
                  : undefined
            }
            reviewCount={reviewStats?.totalReviews || storeData?.ratingCount}
            photoCount={storeData?.photoCount}
            compact // Use compact mode for sticky header
          />
        </View>
      </Animated.View>

      {error && (
        <View style={styles.errorToast}>
          <Pressable onPress={() => setError(null)}>
            <View style={styles.errorInner}>
              <View style={styles.errorDot} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* LAZY LOADED MODALS - Only loaded when user opens them */}
      {/* This reduces initial bundle size by ~150KB (3 modals × 50KB each) */}

      {showAboutModal && (
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.gold} /></View>}>
          <LazyAboutModal
            visible={showAboutModal}
            onClose={handleCloseAboutModal}
            storeData={(() => {
              // CRITICAL: Always prioritize fullStoreDataRef.current (raw API response)
              // This has ALL fields: location (with state, pincode, landmark), contact, operationalInfo, description
              const storeDataToUse = fullStoreDataRef.current || fetchedStoreData;
              
              // Use storeDataToUse if available (has full API data), otherwise fall back to storeData
              if (isDynamic && storeData && (storeDataToUse || storeData)) {
                // CRITICAL: Always use the raw location from storeDataToUse (fullStoreDataRef.current)
                // This has the complete location object with all fields from the API
                // storeData.location might be transformed/combined, so we use the raw API data
                const rawLocation = storeDataToUse?.location;
                
                // Ensure we have the location object with all fields
                // Priority: storeDataToUse.location (raw API) > storeData.location (transformed)
                let location: any = {};
                if (rawLocation && typeof rawLocation === 'object' && rawLocation !== null) {
                  // Use the raw location object directly - it has all fields (state, pincode, landmark, etc.)
                  location = rawLocation;
                } else if (storeData?.location && typeof storeData.location === 'object' && storeData.location !== null) {
                  // Fallback to storeData.location if rawLocation is not available
                  location = storeData.location;
                }
                
                
                const hours = storeDataToUse?.operationalInfo?.hours || storeData?.operationalInfo?.hours || {};
                
                // Format address from location object
                // Backend stores: address, city, state, pincode, landmark
                // AboutModal expects: doorNo, floor, street, area, city, state, pinCode
                const formatAddress = () => {
                  if (typeof location === 'string') {
                    // If location is a string, use it as street address
                    return {
                      doorNo: '',
                      floor: '',
                      street: location,
                      area: '',
                      city: '',
                      state: '',
                      pinCode: '',
                    };
                  }
                  if (typeof location === 'object' && location !== null) {
                    // Map backend fields to AboutModal format
                    // address -> street, landmark -> area
                    // Ensure we extract all fields from the location object
                    return {
                      doorNo: '', // Not collected in merchant form
                      floor: '', // Not collected in merchant form
                      street: location.address || location.street || '',
                      area: location.landmark || location.area || '',
                      city: location.city || '',
                      state: location.state || '',
                      pinCode: location.pincode || location.pinCode || location.zipCode || '',
                    };
                  }
                  return {
                    doorNo: '',
                    floor: '',
                    street: '',
                    area: '',
                    city: '',
                    state: '',
                    pinCode: '',
                  };
                };

                // Format hours from operationalInfo
                const formatHours = () => {
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  
                  return days.map((day, idx) => {
                    const dayHours = hours[day as keyof typeof hours];
                    if (dayHours && !dayHours.closed && dayHours.open && dayHours.close) {
                      return {
                        day: dayNames[idx],
                        time: `${dayHours.open} - ${dayHours.close}`,
                      };
                    }
                    return {
                      day: dayNames[idx],
                      time: "Closed",
                    };
                  });
                };

                // Format categories - handle both object and string formats
                const categoryName = typeof storeDataToUse.category === 'object' 
                  ? (storeDataToUse.category?.name || storeDataToUse.category?.toString() || '')
                  : (storeDataToUse.category || '');
                
                const categoriesList = categoryName 
                  ? [categoryName, ...(storeDataToUse.tags || [])]
                  : (storeDataToUse.tags && storeDataToUse.tags.length > 0 
                      ? storeDataToUse.tags 
                      : ["General"]);

                // Extract contact info - prioritize storeDataToUse (raw API data)
                const contactFromStore = storeDataToUse.contact || storeData.contact;
                const contactData = contactFromStore && (
                  contactFromStore.phone || 
                  contactFromStore.email || 
                  contactFromStore.website || 
                  contactFromStore.whatsapp
                ) ? contactFromStore : undefined;
                
                
                // Extract operational info - prioritize storeDataToUse (raw API data)
                const operationalData = storeDataToUse.operationalInfo || storeData.operationalInfo;
                
                
                // Extract description - prioritize storeDataToUse (raw API data)
                const descriptionData = (storeDataToUse.description || storeData.description || '').trim() || undefined;
                
                
                // Build delivery info only if operationalData exists and has relevant fields
                const deliveryInfoData = operationalData && (
                  (operationalData.deliveryTime && operationalData.deliveryTime.trim()) || 
                  (operationalData.minimumOrder !== undefined && operationalData.minimumOrder !== null) || 
                  (operationalData.deliveryFee !== undefined && operationalData.deliveryFee !== null) || 
                  (operationalData.freeDeliveryAbove !== undefined && operationalData.freeDeliveryAbove !== null)
                ) ? {
                  deliveryTime: operationalData.deliveryTime?.trim() || undefined,
                  minimumOrder: (operationalData.minimumOrder !== undefined && operationalData.minimumOrder !== null) ? operationalData.minimumOrder : undefined,
                  deliveryFee: (operationalData.deliveryFee !== undefined && operationalData.deliveryFee !== null) ? operationalData.deliveryFee : undefined,
                  freeDeliveryAbove: (operationalData.freeDeliveryAbove !== undefined && operationalData.freeDeliveryAbove !== null) ? operationalData.freeDeliveryAbove : undefined,
                } : undefined;

                const aboutModalData = {
                  name: storeData?.name || storeData?.title || productData.storeName,
                  description: descriptionData,
                  establishedYear: (storeDataToUse as any).establishedYear || new Date((storeDataToUse.createdAt || Date.now()).toString()).getFullYear(),
                  address: formatAddress(),
                  contact: contactData,
                  deliveryInfo: deliveryInfoData,
                  isOpen: productData.isOpen,
                  categories: categoriesList,
                  hours: formatHours(),
                };
                
                
                return aboutModalData;
              }
              
              // Fallback to default data
              return {
                name: productData.storeName,
                description: undefined,
              establishedYear: 2020,
              address: {
                  doorNo: "",
                  floor: "",
                  street: productData.location || "",
                  area: "",
                  city: "",
                  state: "",
                  pinCode: "",
                },
                contact: undefined,
                deliveryInfo: undefined,
              isOpen: productData.isOpen,
                categories: ["General"],
              hours: [
                { day: "Monday", time: "10:00 AM - 6:00 PM" },
                { day: "Tuesday", time: "10:00 AM - 6:00 PM" },
                { day: "Wednesday", time: "10:00 AM - 6:00 PM" },
                { day: "Thursday", time: "10:00 AM - 6:00 PM" },
                { day: "Friday", time: "10:00 AM - 6:00 PM" },
                { day: "Saturday", time: "10:00 AM - 6:00 PM" },
                { day: "Sunday", time: "Closed" },
              ],
              };
            })()}
          />
        </Suspense>
      )}

      {showDealsModal && (
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.gold} /></View>}>
          <LazyWalkInDealsModal
            visible={showDealsModal}
            onClose={handleCloseDealsModal}
            storeId={productData.storeId}
          />
        </Suspense>
      )}

      {showReviewModal && (
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.gold} /></View>}>
          <LazyReviewModal
            visible={showReviewModal}
            onClose={handleCloseReviewModal}
            storeName={isDynamic && storeData ? storeData.name || storeData.title : productData.storeName}
            storeId={reviewStoreId || productData.storeId}
            averageRating={
              reviewStats?.averageRating || 
              (isDynamic && storeData?.rating ? storeData.rating : 0)
            }
            totalReviews={
              reviewStats?.totalReviews || 
              (isDynamic && storeData?.ratingCount ? storeData.ratingCount : 0)
            }
            ratingBreakdown={
              Object.keys(reviewRatingBreakdown).some(k => reviewRatingBreakdown[k as unknown as keyof typeof reviewRatingBreakdown] > 0)
                ? {
                    fiveStars: reviewRatingBreakdown[5] || 0,
                    fourStars: reviewRatingBreakdown[4] || 0,
                    threeStars: reviewRatingBreakdown[3] || 0,
                    twoStars: reviewRatingBreakdown[2] || 0,
                    oneStar: reviewRatingBreakdown[1] || 0,
                  }
                : {
                    fiveStars: 0,
                    fourStars: 0,
                    threeStars: 0,
                    twoStars: 0,
                    oneStar: 0,
                  }
            }
            reviews={storeReviews}
            onLikeReview={handleReviewLike}
            onReportReview={handleReviewReport}
            onHelpfulReview={handleReviewHelpful}
            onWriteReview={canReview !== false ? handleWriteReview : undefined}
            ugcContent={ugcContent}
            ugcLoading={ugcLoading}
          />
        </Suspense>
      )}

      {showWriteReviewModal && (
        <WriteReviewModal
          visible={showWriteReviewModal}
          onClose={handleCloseWriteReviewModal}
          storeId={reviewStoreId || productData.storeId}
          storeName={isDynamic && storeData ? storeData.name || storeData.title : productData.storeName}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* NEW: Store Bottom Action Bar - Sticky at bottom */}
      <StoreBottomActionBar
        storeId={storeIdParam || storeData?.id || productData.storeId}
        onScanPayEarn={() => {
          router.push({
            pathname: '/pay-in-store/enter-amount',
            params: {
              storeId: storeIdParam || storeData?.id || productData.storeId,
              storeName: storeData?.name || storeData?.title || productData.storeName || '',
              storeLogo: storeData?.logo || '',
            }
          } as any);
        }}
      />

    </ThemedView>
  );
}

const createStyles = (HORIZONTAL_PADDING: number, screenData: { width: number; height: number }) =>
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: Colors.background.secondary,
    },
    headerGradient: {
      paddingBottom: Spacing.sm,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: "hidden",
      shadowColor: Colors.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    scrollContent: {
      paddingBottom: 0,
      paddingTop: 0, // Remove top padding for edge-to-edge header
    },
    webScrollContent: {
      // Web-specific scroll styles
      paddingBottom: 0,
    },
    contentWrapper: {
      // Wrapper for max-width constraint on web/desktop
      flex: 1,
    },
    imageSection: {
      paddingHorizontal: HORIZONTAL_PADDING,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm, // Reduced - no logo overlay to accommodate
    },
    imageCard: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: BorderRadius.xl,
      overflow: "hidden", // Changed back to hidden - logo is now separate
      shadowColor: Colors.gold,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 10,
      padding: 0,
      borderWidth: 1,
      borderColor: "rgba(0, 192, 106, 0.1)",
    },
    tabsContainer: {
      marginTop: Spacing.base, // Reduced since store info row is now above
      marginHorizontal: HORIZONTAL_PADDING,
      marginBottom: Spacing.md,
    },
    sectionCard: {
      marginHorizontal: HORIZONTAL_PADDING,
      marginTop: Spacing.md,
      backgroundColor: Colors.background.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: 14,
      paddingHorizontal: 14,
      // Subtle shadow for depth
      shadowColor: "#0B2240",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
      // Subtle border for definition
      borderWidth: 1,
      borderColor: "rgba(0, 0, 0, 0.03)",
    },
    cashbackFullWidth: {
      marginHorizontal: HORIZONTAL_PADDING,
      marginTop: Spacing.base,
      paddingVertical: 18,
      paddingHorizontal: Spacing.lg,
      borderRadius: 18,
    },
    fixedBottom: {
      position: "absolute",
      left: HORIZONTAL_PADDING,
      right: HORIZONTAL_PADDING,
      bottom: Platform.OS === "ios" ? 34 : 16,
    },
    errorToast: {
      position: "absolute",
      left: HORIZONTAL_PADDING + 4,
      right: HORIZONTAL_PADDING + 4,
      top: Platform.OS === "ios" ? 60 : 44,
    },
    // Store Info Row - Logo on left with store name
    storeInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: HORIZONTAL_PADDING,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.base,
      paddingVertical: 14,
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderRadius: BorderRadius.lg,
      gap: 14,
      // Subtle shadow
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: "rgba(0, 192, 106, 0.08)",
    },
    storeLogoWrapper: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: Colors.background.primary,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "rgba(0, 192, 106, 0.15)",
      // Shadow for logo
      shadowColor: Colors.gold,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    storeLogo: {
      width: "100%",
      height: "100%",
    },
    storeInfoContent: {
      flex: 1,
      gap: Spacing.xs,
    },
    storeNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    storeNameText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#0B2240",
      flex: 1,
    },
    verifiedBadge: {
      marginLeft: 2,
    },
    storeRatingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    storeRatingText: {
      ...Typography.body,
      fontWeight: "600",
      color: "#0B2240",
    },
    storeReviewCount: {
      ...Typography.bodySmall,
      color: Colors.text.tertiary,
      marginLeft: 2,
    },
    quickFollowBtn: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.xl,
      backgroundColor: "rgba(0, 192, 106, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(0, 192, 106, 0.15)",
    },
    quickFollowBtnActive: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderColor: "rgba(239, 68, 68, 0.2)",
    },
    // Store meta row - shown when no rating
    storeMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: 2,
    },
    storeMetaTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: "rgba(107, 114, 128, 0.08)",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: 6,
    },
    storeMetaText: {
      ...Typography.caption,
      fontWeight: "500",
      color: Colors.text.tertiary,
    },
    openTag: {
      backgroundColor: "rgba(0, 192, 106, 0.1)",
    },
    closedTag: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    openDot: {
      backgroundColor: Colors.gold,
    },
    closedDot: {
      backgroundColor: Colors.error,
    },
    openText: {
      color: "#00875A",
    },
    closedText: {
      color: Colors.error,
    },
    // NEW Store Info Section - Clean design
    storeInfoSection: {
      marginHorizontal: HORIZONTAL_PADDING,
      marginTop: Spacing.base,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.base,
      backgroundColor: Colors.background.primary,
      borderRadius: BorderRadius.lg,
      // Subtle shadow
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: "rgba(0, 0, 0, 0.04)",
    },
    storeNameLarge: {
      ...Typography.h3,
      fontWeight: "700",
      color: "#0B2240",
      letterSpacing: -0.3,
      marginBottom: Spacing.md,
    },
    ratingTagsRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    ratingBadgePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: "rgba(0, 192, 106, 0.12)",
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.xl,
    },
    ratingBadgeText: {
      ...Typography.body,
      fontWeight: "700",
      color: "#0B2240",
    },
    categoryTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: "rgba(0, 0, 0, 0.04)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.xl,
    },
    categoryTagText: {
      ...Typography.bodySmall,
      fontWeight: "500",
      color: Colors.text.secondary,
    },
    featureTagsRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginTop: 10,
    },
    tagVerified: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: "rgba(0, 192, 106, 0.1)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.xl,
    },
    tagTextVerified: {
      ...Typography.bodySmall,
      fontWeight: "600",
      color: "#00875A",
    },
    tagCashback: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: "rgba(255, 149, 0, 0.1)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.xl,
    },
    tagTextCashback: {
      ...Typography.bodySmall,
      fontWeight: "600",
      color: "#CC7700",
    },
    tagCoins: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.xl,
    },
    tagTextCoins: {
      ...Typography.bodySmall,
      fontWeight: "600",
      color: Colors.brand.purple,
    },
    errorInner: {
      backgroundColor: "#FEF2F2",
      borderLeftWidth: 6,
      borderLeftColor: Colors.error,
      padding: Spacing.base,
      borderRadius: BorderRadius.lg,
      flexDirection: "row",
      alignItems: "center",
    },
    errorDot: {
      width: 12,
      height: 12,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors.error,
    },
    errorText: {
      color: "#991B1B",
      ...Typography.body,
      fontWeight: "600",
    },
    // Sticky Tab Navigation
    stickyTabsContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 80 : 72,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: Colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.06)',
      // Shadow for elevated appearance
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    stickyTabsInner: {
      paddingHorizontal: Spacing.base,
      paddingVertical: 0,
    },
    // Inline Reviews Section Styles
    reviewsHeader: {
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    reviewsHeaderTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: Colors.text.primary,
      letterSpacing: -0.3,
    },
    reviewsStoreName: {
      ...Typography.body,
      color: Colors.gold,
      fontWeight: '600',
      marginTop: Spacing.xs,
    },
    ratingSummaryCard: {
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: 'rgba(0, 192, 106, 0.08)',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: 'rgba(0, 192, 106, 0.2)',
    },
    averageRatingContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    averageRatingNumber: {
      fontSize: 44,
      fontWeight: '800',
      color: Colors.text.primary,
      letterSpacing: -1,
    },
    outOfFive: {
      ...Typography.h4,
      color: Colors.text.tertiary,
      fontWeight: '500',
    },
    starsContainer: {
      marginVertical: 10,
    },
    totalReviewsText: {
      ...Typography.body,
      color: Colors.text.tertiary,
      fontWeight: '500',
    },
    alreadyReviewedBanner: {
      backgroundColor: 'rgba(255, 200, 87, 0.12)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 200, 87, 0.35)',
      overflow: 'hidden',
    },
    alreadyReviewedContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: Spacing.md,
    },
    alreadyReviewedIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 200, 87, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    alreadyReviewedText: {
      flex: 1,
      ...Typography.body,
      fontWeight: '600',
      color: Colors.text.primary,
    },
    editReviewButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0, 192, 106, 0.2)',
    },
    writeReviewButton: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    writeReviewGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: Spacing.sm,
    },
    writeReviewText: {
      ...Typography.body,
      fontWeight: '700',
      color: Colors.text.inverse,
    },
    reviewInnerTabsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    reviewInnerTab: {
      flex: 1,
      borderRadius: BorderRadius['2xl'],
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    reviewInnerTabActive: {
      borderColor: Colors.gold,
    },
    reviewInnerTabGradient: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    reviewInnerTabText: {
      ...Typography.body,
      fontWeight: '600',
      color: Colors.text.tertiary,
      textAlign: 'center',
      paddingVertical: Spacing.md,
    },
    reviewInnerTabTextActive: {
      ...Typography.body,
      fontWeight: '700',
      color: Colors.text.inverse,
    },
    reviewListContainer: {
      gap: Spacing.md,
    },
    reviewCardWrapper: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#0B2240',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      ...Typography.body,
      color: Colors.text.tertiary,
      fontWeight: '500',
    },
    emptyReviewState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.base,
      ...Platform.select({
        ios: {
          shadowColor: Colors.gold,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    emptyStateTitle: {
      ...Typography.h4,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: Spacing.sm,
    },
    emptyStateText: {
      ...Typography.body,
      color: Colors.text.tertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

// Book a Table card styles (food/dining stores)
const bookTableStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  gradient: {
    padding: Spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(251,191,36,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  subtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  cta: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  perkText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
});
