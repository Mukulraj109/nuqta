/**
 * useCashStoreSection Hook
 *
 * Custom hook for managing cash store section data and state.
 * Uses /api/cashstore/homepage for initial data (categories + brands) and
 * /api/cashstore/brands for server-side category filtering.
 *
 * Sections filtered by category: TopOnlineBrands, TrendingCashback, HighCashbackDeals
 * Sections NOT filtered: BuyCoupon, BestCoupons, Travel, HowItWorks, Activity
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Clipboard, Linking } from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import cashbackService, { CashbackSummary } from '../services/cashbackApi';
import realVouchersApi from '../services/realVouchersApi';
import realOffersApi, { Offer } from '../services/realOffersApi';
import couponService, { Coupon } from '../services/couponApi';
import cashStoreApi from '../services/cashStoreApi';
import travelApi from '../services/travelApi';
import { BRAND } from '@/constants/brand';
import {
  CashStoreBrand,
  TrendingDeal,
  GiftCardBrand,
  CashStoreCoupon,
  HighCashbackDeal,
  TravelDeal,
  CashbackActivity,
  CashStoreHeroBanner,
  CashStoreQuickAction,
  CashStoreCategoryFilter,
  CashStoreCategoryFilterKey,
  UseCashStoreSectionReturn,
  getTimeRemainingMs,
} from '../types/cash-store.types';

interface UseCashStoreSectionOptions {
  autoFetch?: boolean;
  cacheTimeout?: number;
}

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Default quick actions
const DEFAULT_QUICK_ACTIONS: CashStoreQuickAction[] = [
  {
    id: 'buy-coupons',
    title: 'Buy coupons & save instantly',
    subtitle: 'Get extra cashback on gift cards',
    icon: 'pricetag',
    backgroundColor: '#FF9F1C',
    gradientColors: ['#FF9F1C', '#F77F00'],
    action: 'buy-coupons',
  },
  {
    id: 'extra-coins',
    title: `Extra ${BRAND.COIN_NAME} on brands`,
    subtitle: 'Double rewards on selected stores',
    icon: 'wallet',
    backgroundColor: '#9B59B6',
    gradientColors: ['#9B59B6', '#8E44AD'],
    action: 'extra-coins',
  },
];

// Default hero banners
const DEFAULT_HERO_BANNERS: CashStoreHeroBanner[] = [
  {
    _id: 'hero-1',
    id: 'hero-1',
    title: 'Earn cashback on every online order',
    subtitle: 'Shop from 1000+ brands and get instant rewards',
    backgroundColor: '#FF9F1C',
    gradientColors: ['#FF9F1C', '#F77F00'],
    textColor: '#FFFFFF',
    ctaText: 'Start Shopping',
    ctaAction: 'shop',
    badge: 'Hot Deal',
    priority: 1,
    isActive: true,
  },
];

// Travel deals data
const DEFAULT_TRAVEL_DEALS: TravelDeal[] = [
  {
    _id: 'travel-flights',
    id: 'travel-flights',
    category: 'flights',
    title: 'Flights',
    cashbackRate: 5,
    icon: 'airplane',
    backgroundColor: '#667EEA',
    gradientColors: ['#667EEA', '#764BA2'],
  },
  {
    _id: 'travel-hotels',
    id: 'travel-hotels',
    category: 'hotels',
    title: 'Hotels',
    cashbackRate: 8,
    icon: 'bed',
    backgroundColor: '#F093FB',
    gradientColors: ['#F093FB', '#F5576C'],
  },
  {
    _id: 'travel-cabs',
    id: 'travel-cabs',
    category: 'cabs',
    title: 'Cabs',
    cashbackRate: 3,
    icon: 'car',
    backgroundColor: '#FFE259',
    gradientColors: ['#FFE259', '#FFA751'],
  },
  {
    _id: 'travel-experiences',
    id: 'travel-experiences',
    category: 'experiences',
    title: 'Experiences',
    cashbackRate: 6,
    icon: 'compass',
    backgroundColor: '#A18CD1',
    gradientColors: ['#A18CD1', '#FBC2EB'],
  },
];

/**
 * Adjust a hex color brightness for gradient second color
 */
function adjustCategoryColor(color: string): string {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = -30;
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  } catch {
    return '#764BA2';
  }
}

/**
 * Transform MallBrand (from backend) → CashStoreBrand (frontend type)
 */
function transformMallBrandToCashStoreBrand(brand: any): CashStoreBrand {
  return {
    _id: brand._id,
    id: brand._id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo || '',
    description: brand.description,
    category: brand.mallCategory?.slug || '',
    brandType: brand.externalUrl ? 'affiliate' : 'hybrid',
    cashbackRate: brand.cashback?.percentage || 0,
    maxCashback: brand.cashback?.maxAmount,
    minPurchase: brand.cashback?.minPurchase,
    externalUrl: brand.externalUrl,
    isActive: brand.isActive,
    isFeatured: brand.isFeatured,
    isTopBrand: brand.isFeatured || (brand.ratings?.average >= 4),
    rating: brand.ratings?.average,
    ratingCount: brand.ratings?.count,
    successRate: brand.ratings?.successRate,
    analytics: brand.analytics ? {
      views: brand.analytics.views,
      clicks: brand.analytics.clicks,
      purchases: brand.analytics.purchases,
    } : undefined,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

/**
 * Transform MallBrand → TrendingDeal
 */
function transformMallBrandToTrendingDeal(brand: any): TrendingDeal {
  const cashback = brand.cashback?.percentage || 0;
  return {
    _id: brand._id,
    id: brand._id,
    brand: {
      id: brand._id,
      name: brand.name,
      logo: brand.logo || '',
    },
    category: brand.mallCategory?.slug || '',
    cashbackRate: cashback,
    bonusCoins: brand.isFeatured ? 50 : undefined,
    validUntil: brand.cashback?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    badge: brand.badges?.includes('trending') ? 'trending' : brand.isNewArrival ? 'new' : undefined,
    isFlashSale: false,
    priority: brand.isFeatured ? 1 : 0,
    externalUrl: brand.externalUrl,
  };
}

/**
 * Transform MallBrand → HighCashbackDeal
 */
function transformMallBrandToHighCashbackDeal(brand: any): HighCashbackDeal {
  const cashback = brand.cashback?.percentage || 0;
  return {
    _id: brand._id,
    id: brand._id,
    brand: {
      id: brand._id,
      name: brand.name,
      logo: brand.logo || '',
    },
    title: `${brand.name} - Up to ${cashback}% Cashback`,
    subtitle: brand.description,
    cashbackRate: cashback,
    bonusCoins: brand.isFeatured ? 75 : undefined,
    validUntil: brand.cashback?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    badge: cashback >= 15 ? 'hot' : cashback >= 10 ? 'best-deal' : undefined,
    externalUrl: brand.externalUrl,
  };
}

export function useCashStoreSection(
  options: UseCashStoreSectionOptions = {}
): UseCashStoreSectionReturn {
  const { autoFetch = true, cacheTimeout = CACHE_TIMEOUT } = options;
  const router = useRouter();

  // State
  const [cashbackSummary, setCashbackSummary] = useState<{
    total: number;
    pending: number;
    confirmed: number;
    available: number;
  }>({
    total: 0,
    pending: 0,
    confirmed: 0,
    available: 0,
  });
  const [heroBanners, setHeroBanners] = useState<CashStoreHeroBanner[]>(DEFAULT_HERO_BANNERS);
  const [quickActions, setQuickActions] = useState<CashStoreQuickAction[]>(DEFAULT_QUICK_ACTIONS);
  const [topBrands, setTopBrands] = useState<CashStoreBrand[]>([]);
  const [trendingDeals, setTrendingDeals] = useState<TrendingDeal[]>([]);
  const [giftCardBrands, setGiftCardBrands] = useState<GiftCardBrand[]>([]);
  const [couponCodes, setCouponCodes] = useState<CashStoreCoupon[]>([]);
  const [highCashbackDeals, setHighCashbackDeals] = useState<HighCashbackDeal[]>([]);
  const [travelDeals, setTravelDeals] = useState<TravelDeal[]>(DEFAULT_TRAVEL_DEALS);
  const [recentActivity, setRecentActivity] = useState<CashbackActivity[]>([]);

  // Dynamic categories from API
  const [categories, setCategories] = useState<CashStoreCategoryFilter[]>([]);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<CashStoreCategoryFilterKey>('all');

  // Filtered data (server-side filtered when category changes)
  const [filteredTopBrands, setFilteredTopBrands] = useState<CashStoreBrand[]>([]);
  const [filteredTrendingDeals, setFilteredTrendingDeals] = useState<TrendingDeal[]>([]);
  const [filteredHighCashbackDeals, setFilteredHighCashbackDeals] = useState<HighCashbackDeal[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for caching
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  // Cache homepage data for restoring "All" without API call
  const homepageCacheRef = useRef<{
    topBrands: CashStoreBrand[];
    trendingDeals: TrendingDeal[];
    highCashbackDeals: HighCashbackDeal[];
  } | null>(null);

  /**
   * Transform coupon to cash store coupon
   */
  const transformCouponToCashStoreCoupon = useCallback((coupon: Coupon): CashStoreCoupon => {
    return {
      _id: coupon._id,
      id: coupon._id,
      code: coupon.couponCode,
      brand: {
        id: coupon.applicableTo?.stores?.[0] || '',
        name: coupon.title.split(' - ')[0] || coupon.title,
        logo: coupon.imageUrl || '',
      },
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscountCap: coupon.maxDiscountCap,
      validUntil: coupon.validTo,
      isVerified: true,
      isExclusive: coupon.tags?.includes('rez-exclusive') || false,
      usageCount: coupon.usageCount,
      successRate: 95,
      tags: coupon.tags,
    };
  }, []);

  /**
   * Transform offer to trending deal (for fallback)
   */
  const transformOfferToTrendingDeal = useCallback((offer: Offer): TrendingDeal => {
    return {
      _id: offer._id,
      id: offer._id,
      brand: {
        id: offer.store?.id || '',
        name: offer.store?.name || offer.title,
        logo: offer.store?.logo || offer.image,
      },
      category: offer.category,
      cashbackRate: offer.cashbackPercentage,
      bonusCoins: offer.metadata?.isTrending ? 50 : undefined,
      validUntil: offer.validity.endDate,
      timeRemaining: getTimeRemainingMs(offer.validity.endDate),
      badge: offer.metadata?.isTrending ? 'trending' : offer.metadata?.isNew ? 'new' : undefined,
      isFlashSale: offer.metadata?.flashSale?.isActive || false,
      priority: offer.metadata?.priority || 0,
    };
  }, []);

  /**
   * Transform offer to high cashback deal (for fallback)
   */
  const transformOfferToHighCashbackDeal = useCallback((offer: Offer): HighCashbackDeal => {
    return {
      _id: offer._id,
      id: offer._id,
      brand: {
        id: offer.store?.id || '',
        name: offer.store?.name || offer.title,
        logo: offer.store?.logo || offer.image,
      },
      title: offer.title,
      subtitle: offer.subtitle,
      cashbackRate: offer.cashbackPercentage,
      bonusCoins: offer.metadata?.isBestSeller ? 75 : undefined,
      validUntil: offer.validity.endDate,
      badge: offer.metadata?.isBestSeller ? 'best-deal' : offer.cashbackPercentage >= 15 ? 'hot' : undefined,
    };
  }, []);

  /**
   * Fetch cashback summary
   */
  const fetchCashbackSummary = useCallback(async () => {
    try {
      const response = await cashbackService.getCashbackSummary();
      if (response.success && response.data && isMountedRef.current) {
        const summary = response.data;
        setCashbackSummary({
          total: summary.totalEarned ?? summary.total ?? 0,
          pending: summary.pending ?? 0,
          confirmed: summary.credited ?? summary.confirmed ?? 0,
          available: summary.credited ?? summary.available ?? 0,
        });
      }
    } catch (_err) {
      // silently handle
    }
  }, []);

  /**
   * Fetch homepage data from /api/cashstore/homepage
   * Returns categories + brands (top, trending, high cashback) in one call
   */
  const fetchHomepageData = useCallback(async () => {
    try {
      const data = await cashStoreApi.getHomepageData();

      if (data && isMountedRef.current) {
        // Set categories
        setCategories(data.categories || []);

        // Transform MallBrands → CashStoreBrand
        const transformedTopBrands = (data.topBrands || []).map(transformMallBrandToCashStoreBrand);
        const transformedTrending = (data.trendingBrands || []).map(transformMallBrandToTrendingDeal);
        const transformedHighCashback = (data.highCashbackBrands || []).map(transformMallBrandToHighCashbackDeal);

        setTopBrands(transformedTopBrands);
        setFilteredTopBrands(transformedTopBrands);
        setTrendingDeals(transformedTrending);
        setFilteredTrendingDeals(transformedTrending);
        setHighCashbackDeals(transformedHighCashback);
        setFilteredHighCashbackDeals(transformedHighCashback);

        // Cache for restoring "All"
        homepageCacheRef.current = {
          topBrands: transformedTopBrands,
          trendingDeals: transformedTrending,
          highCashbackDeals: transformedHighCashback,
        };

        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  /**
   * Fallback: fetch brands from realOffersApi (legacy)
   */
  const fetchTopBrandsFallback = useCallback(async () => {
    try {
      const response = await realOffersApi.getOffers({ featured: true, limit: 20 });
      if (response.success && response.data && isMountedRef.current) {
        const offers = Array.isArray(response.data) ? response.data : (response.data.items || []);
        const brandsMap = new Map<string, CashStoreBrand>();

        offers.forEach((offer: Offer) => {
          if (offer.store && !brandsMap.has(offer.store.id)) {
            brandsMap.set(offer.store.id, {
              _id: offer.store.id,
              id: offer.store.id,
              name: offer.store.name,
              slug: offer.store.name.toLowerCase().replace(/\s+/g, '-'),
              logo: offer.store.logo || offer.image,
              category: offer.category as any,
              brandType: 'hybrid',
              cashbackRate: offer.cashbackPercentage,
              rating: offer.store.rating,
              isActive: true,
              isFeatured: offer.metadata?.featured || false,
              isTopBrand: true,
              createdAt: offer.createdAt,
              updatedAt: offer.updatedAt,
            });
          }
        });

        const brands = Array.from(brandsMap.values()).slice(0, 12);
        setTopBrands(brands);
        setFilteredTopBrands(brands);

        // Also set trending from offers
        setTrendingDeals(offers.slice(0, 10).map(transformOfferToTrendingDeal));
        setFilteredTrendingDeals(offers.slice(0, 10).map(transformOfferToTrendingDeal));

        // High cashback
        const highCb = offers
          .filter((o: Offer) => o.cashbackPercentage >= 10)
          .sort((a: Offer, b: Offer) => b.cashbackPercentage - a.cashbackPercentage)
          .slice(0, 10)
          .map(transformOfferToHighCashbackDeal);
        setHighCashbackDeals(highCb);
        setFilteredHighCashbackDeals(highCb);

        homepageCacheRef.current = {
          topBrands: brands,
          trendingDeals: offers.slice(0, 10).map(transformOfferToTrendingDeal),
          highCashbackDeals: highCb,
        };
      }
    } catch (_err) {
      // silently handle
    }
  }, [transformOfferToTrendingDeal, transformOfferToHighCashbackDeal]);

  /**
   * Fetch gift card brands
   */
  const fetchGiftCardBrands = useCallback(async () => {
    try {
      const response = await realVouchersApi.getVoucherBrands({ featured: true, limit: 10 });
      if (response.success && response.data && isMountedRef.current) {
        const brands = response.data || [];
        setGiftCardBrands(
          brands.map((brand: any) => ({
            _id: brand._id,
            id: brand._id,
            name: brand.name,
            logo: brand.logo,
            backgroundColor: brand.backgroundColor,
            cashbackRate: brand.cashbackRate,
            denominations: brand.denominations,
            category: brand.category,
            rating: brand.rating,
            ratingCount: brand.ratingCount,
            isFeatured: brand.isFeatured,
            isNewlyAdded: brand.isNewlyAdded,
            termsAndConditions: brand.termsAndConditions,
            purchaseCount: brand.purchaseCount,
          }))
        );
      }
    } catch (_err) {
      // silently handle
    }
  }, []);

  /**
   * Fetch coupon codes
   */
  const fetchCouponCodes = useCallback(async () => {
    try {
      const response = await couponService.getFeaturedCoupons();
      if (response.success && response.data && isMountedRef.current) {
        const coupons = response.data.coupons || [];
        setCouponCodes(coupons.map(transformCouponToCashStoreCoupon));
      }
    } catch (_err) {
      // silently handle
    }
  }, [transformCouponToCashStoreCoupon]);

  /**
   * Fetch recent activity
   */
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await cashbackService.getCashbackHistory({ limit: 5 });
      if (response.success && response.data && isMountedRef.current) {
        const cashbacks = response.data.cashbacks || [];
        setRecentActivity(
          cashbacks.map((cb: any) => ({
            _id: cb._id,
            id: cb._id,
            brand: {
              id: cb.metadata?.storeId || '',
              name: cb.metadata?.storeName || `${BRAND.APP_NAME} Store`,
              logo: '',
            },
            orderNumber: cb.order?.orderNumber,
            purchaseAmount: cb.metadata?.orderAmount || 0,
            cashbackAmount: cb.amount,
            status: cb.status === 'credited' ? 'confirmed' : cb.status,
            date: cb.earnedDate,
            source: cb.source,
          }))
        );
      }
    } catch (_err) {
      // silently handle
    }
  }, []);

  /**
   * Fetch travel categories from API for Travel & Booking section
   */
  const fetchTravelDeals = useCallback(async () => {
    try {
      const response = await travelApi.getCategories();
      if (response.success && response.data && response.data.length > 0 && isMountedRef.current) {
        const travelCategories = response.data.map((cat: any) => ({
          _id: `travel-${cat.id}`,
          id: `travel-${cat.id}`,
          category: cat.id || cat.title?.toLowerCase(),
          title: cat.title,
          cashbackRate: cat.cashback || 0,
          icon: cat.icon || 'compass',
          backgroundColor: cat.color || '#667EEA',
          gradientColors: [cat.color || '#667EEA', adjustCategoryColor(cat.color || '#667EEA')],
        }));
        setTravelDeals(travelCategories);
      }
      // If API returns empty or fails, DEFAULT_TRAVEL_DEALS remains as initial state
    } catch (err) {
      // Keep DEFAULT_TRAVEL_DEALS as fallback
    }
  }, []);

  /**
   * Fetch all cash store data
   */
  const fetchCashStoreData = useCallback(
    async (forceRefresh: boolean = false) => {
      const now = Date.now();
      if (!forceRefresh && lastFetchRef.current > 0 && now - lastFetchRef.current < cacheTimeout) {
        return;
      }

      try {
        if (!forceRefresh) {
          setIsLoading(true);
        }
        setError(null);

        // Fetch homepage data first (categories + brands — core data)
        const homepageSuccess = await fetchHomepageData();

        // If homepage failed, try legacy fallback
        if (!homepageSuccess) {
          await fetchTopBrandsFallback();
        }

        // Show main content immediately — stop skeleton as soon as brands are ready
        if (isMountedRef.current) {
          setIsLoading(false);
          lastFetchRef.current = now;
          setIsInitialLoad(false);
        }

        // Fetch secondary data in parallel (non-blocking — sections render as data arrives)
        Promise.allSettled([
          fetchCashbackSummary(),
          fetchGiftCardBrands(),
          fetchCouponCodes(),
          fetchRecentActivity(),
          fetchTravelDeals(),
        ]).catch(() => {}); // Errors handled inside each function
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load Cash Store data');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false); // Safety net — already set above on success path
          setIsRefreshing(false);
        }
      }
    },
    [
      cacheTimeout,
      fetchHomepageData,
      fetchTopBrandsFallback,
      fetchCashbackSummary,
      fetchGiftCardBrands,
      fetchCouponCodes,
      fetchRecentActivity,
      fetchTravelDeals,
    ]
  );

  /**
   * Handle category change — server-side filtering
   */
  useEffect(() => {
    if (!isMountedRef.current) return;

    // "All" = restore cached homepage data (no API call)
    if (selectedCategory === 'all') {
      if (homepageCacheRef.current) {
        setFilteredTopBrands(homepageCacheRef.current.topBrands);
        setFilteredTrendingDeals(homepageCacheRef.current.trendingDeals);
        setFilteredHighCashbackDeals(homepageCacheRef.current.highCashbackDeals);
      }
      return;
    }

    // Server-side filter
    const fetchFilteredBrands = async () => {
      setIsCategoryLoading(true);
      try {
        let params: { category?: string; filter?: 'popular' | 'high-cashback'; limit: number } = { limit: 20 };

        if (selectedCategory === 'most-popular') {
          params.filter = 'popular';
        } else if (selectedCategory === 'high-cashback') {
          params.filter = 'high-cashback';
        } else {
          params.category = selectedCategory;
        }

        const result = await cashStoreApi.getBrands(params);
        const brands = result.brands || [];

        if (isMountedRef.current) {
          setFilteredTopBrands(brands.map(transformMallBrandToCashStoreBrand));
          setFilteredTrendingDeals(brands.slice(0, 10).map(transformMallBrandToTrendingDeal));
          setFilteredHighCashbackDeals(
            brands
              .filter((b: any) => (b.cashback?.percentage || 0) >= 10)
              .map(transformMallBrandToHighCashbackDeal)
          );
        }
      } catch (err) {
        // On error, restore "All" data so UI isn't stuck on stale filter
        if (homepageCacheRef.current && isMountedRef.current) {
          setFilteredTopBrands(homepageCacheRef.current.topBrands);
          setFilteredTrendingDeals(homepageCacheRef.current.trendingDeals);
          setFilteredHighCashbackDeals(homepageCacheRef.current.highCashbackDeals);
          setSelectedCategory('all');
        }
      } finally {
        if (isMountedRef.current) {
          setIsCategoryLoading(false);
        }
      }
    };

    fetchFilteredBrands();
  }, [selectedCategory]);

  /**
   * Refresh data (pull-to-refresh)
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setSelectedCategory('all'); // Reset filter on refresh
    await fetchCashStoreData(true);
  }, [fetchCashStoreData]);

  /**
   * Copy coupon code to clipboard
   */
  const copyCouponCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      await Clipboard.setString(code);
      platformAlertSimple('Copied!', `Coupon code "${code}" copied to clipboard`);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  /**
   * Navigate to brand with affiliate tracking
   */
  const navigateToBrand = useCallback(
    async (brand: CashStoreBrand) => {
      if (brand.brandType === 'in-app' && brand.storeId) {
        router.push(`/MainStorePage?storeId=${brand.storeId}` as any);
      } else if (brand.externalUrl) {
        try {
          const trackingResult = await cashStoreApi.trackAffiliateClick(brand.id);
          const urlToOpen = trackingResult?.trackingUrl || brand.externalUrl;

          await WebBrowser.openBrowserAsync(urlToOpen, {
            toolbarColor: '#ffcd57',
            controlsColor: '#FFFFFF',
            enableBarCollapsing: true,
            showTitle: true,
          });

          if (trackingResult) {
            platformAlertSimple(
              'Cashback Tracking Active',
              `Complete your purchase on ${brand.name} to earn up to ${trackingResult.brand.cashback}% cashback!`
            );
          }
        } catch (error) {
          if (brand.externalUrl) {
            try { await Linking.openURL(brand.externalUrl); } catch (e) {}
          }
        }
      }
    },
    [router]
  );

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;

    if (autoFetch) {
      fetchCashStoreData();
    }

    return () => {
      isMountedRef.current = false;
      homepageCacheRef.current = null;
      lastFetchRef.current = 0;
    };
  }, [autoFetch, fetchCashStoreData]);

  return {
    // Data
    cashbackSummary,
    heroBanners,
    quickActions,
    topBrands,
    trendingDeals,
    giftCardBrands,
    couponCodes,
    highCashbackDeals,
    travelDeals,
    recentActivity,

    // Dynamic categories
    categories,

    // Category filter
    selectedCategory,
    setSelectedCategory,
    filteredTopBrands,
    filteredTrendingDeals,
    filteredHighCashbackDeals,
    isCategoryLoading,

    // Loading states
    isLoading,
    isRefreshing,
    isInitialLoad,

    // Error state
    error,

    // Actions
    refresh,
    copyCouponCode,
    navigateToBrand,
  };
}

export default useCashStoreSection;
