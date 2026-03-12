/**
 * Hook for Category Page Data - Production Ready
 * Fetches all category page data from backend APIs
 * Falls back to dummy data if API fails
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import categoriesApi, {
  Category,
  CategoryVibe,
  CategoryOccasion,
  CategoryHashtag,
  CategoryPageConfig
} from '@/services/categoriesApi';
import { storesApi } from '@/services/storesApi';
import productsApi from '@/services/productsApi';
import apiClient from '@/services/apiClient';

// Import dummy data as fallback
import { fashionCategoryData } from '@/data/category/fashionCategoryData';
import { foodCategoryData } from '@/data/category/foodCategoryData';
import { beautyCategoryData } from '@/data/category/beautyCategoryData';
import { groceryCategoryData } from '@/data/category/groceryCategoryData';
import { healthcareCategoryData } from '@/data/category/healthcareCategoryData';
import { educationCategoryData } from '@/data/category/educationCategoryData';
import { fitnessCategoryData } from '@/data/category/fitnessCategoryData';
import { homeServicesCategoryData } from '@/data/category/homeServicesCategoryData';
import { travelCategoryData } from '@/data/category/travelCategoryData';
import { entertainmentCategoryData } from '@/data/category/entertainmentCategoryData';
import { financialCategoryData } from '@/data/category/financialCategoryData';

// Subcategory interface for grid display
export interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  cashback?: number;
  itemCount?: number;
  image?: string;
}

// Store interface for category page
export interface CategoryStoreItem {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  rating: number;
  cashback?: number;
  distance?: string;
  is60Min?: boolean;
  hasPickup?: boolean;
  categories?: string[];
}

// Product interface for category page
export interface CategoryProductItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  cashback?: number;
  storeName?: string;
}

// UGC Post interface
export interface UGCPostItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  image: string;
  hashtag: string;
  likes: number;
  comments: number;
  coinsEarned: number;
  isVerified: boolean;
}

// Exclusive Offer interface
export interface ExclusiveOfferItem {
  id: string;
  title: string;
  icon: string;
  discount: string;
  description: string;
  color: string;
  gradient?: string;
}

interface UseCategoryPageDataResult {
  // Category Info
  category: Category | null;
  categoryName: string;
  categorySlug: string;

  // Dynamic Page Config (admin-driven)
  pageConfig: CategoryPageConfig | null;

  // Subcategories (for Browse Grid)
  subcategories: SubcategoryItem[];

  // Category Page Data
  vibes: CategoryVibe[];
  occasions: CategoryOccasion[];
  hashtags: CategoryHashtag[];

  // Stores & Products
  stores: CategoryStoreItem[];
  products: CategoryProductItem[];

  // UGC Data
  ugcPosts: UGCPostItem[];

  // Exclusive Offers
  exclusiveOffers: ExclusiveOfferItem[];

  // AI Search Data
  aiSuggestions: any[];
  aiFilterChips: any[];
  aiPlaceholders: string[];

  // Loading & Error States
  isLoading: boolean;
  isLoadingCategory: boolean;
  isLoadingStores: boolean;
  isLoadingProducts: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}

// Module-level data cache to avoid loading flash on remount (from DeferredProviders)
const _dataCache: Record<string, {
  stores: CategoryStoreItem[];
  subcategories: SubcategoryItem[];
  ugcPosts: UGCPostItem[];
  aiPlaceholders: string[];
  timestamp: number;
}> = {};
const DATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Map slug to dummy data
const getDummyData = (slug: string): any => {
  const dataMap: Record<string, any> = {
    'fashion': fashionCategoryData,
    'food-dining': foodCategoryData,
    'beauty-wellness': beautyCategoryData,
    'grocery-essentials': groceryCategoryData,
    'healthcare': healthcareCategoryData,
    'education-learning': educationCategoryData,
    'fitness-sports': fitnessCategoryData,
    'home-services': homeServicesCategoryData,
    'travel': travelCategoryData,
    'entertainment': entertainmentCategoryData,
    'financial-services': financialCategoryData,
  };
  return dataMap[slug] || fashionCategoryData;
};

export const useCategoryPageData = (slug: string, options?: { storesPerPage?: number }): UseCategoryPageDataResult => {
  const storesPerPage = options?.storesPerPage || 10;

  // Check module-level cache for instant init on remount
  const cached = slug ? _dataCache[slug] : undefined;
  const hasFreshCache = cached && Date.now() - cached.timestamp < DATA_CACHE_TTL;

  // Category state
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>(() => hasFreshCache ? cached!.subcategories : []);
  const [vibes, setVibes] = useState<CategoryVibe[]>([]);
  const [occasions, setOccasions] = useState<CategoryOccasion[]>([]);
  const [hashtags, setHashtags] = useState<CategoryHashtag[]>([]);

  // Stores & Products
  const [stores, setStores] = useState<CategoryStoreItem[]>(() => hasFreshCache ? cached!.stores : []);
  const [products, setProducts] = useState<CategoryProductItem[]>([]);

  // Dynamic Page Config (admin-driven)
  const [pageConfig, setPageConfig] = useState<CategoryPageConfig | null>(null);

  // UGC & Offers (from dummy data for now)
  const [ugcPosts, setUgcPosts] = useState<UGCPostItem[]>(() => hasFreshCache ? cached!.ugcPosts : []);
  const [exclusiveOffers, setExclusiveOffers] = useState<ExclusiveOfferItem[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiFilterChips, setAiFilterChips] = useState<any[]>([]);
  const [aiPlaceholders, setAiPlaceholders] = useState<string[]>(() => hasFreshCache ? cached!.aiPlaceholders : []);

  // Loading states — start as false if we have cached data
  const [isLoadingCategory, setIsLoadingCategory] = useState(() => !hasFreshCache);
  const [isLoadingStores, setIsLoadingStores] = useState(() => !hasFreshCache);
  const [isLoadingProducts, setIsLoadingProducts] = useState(() => !hasFreshCache);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch category data with vibes, occasions, hashtags
   */
  const fetchCategoryData = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoadingCategory(true);
      setError(null);

      // Fetch category data and page config in parallel
      const [response, configResponse] = await Promise.all([
        categoriesApi.getCategoryPageData(slug),
        categoriesApi.getPageConfig(slug).catch(() => null),
      ]);

      // Set page config if available
      if (configResponse?.success && configResponse.data) {
        setPageConfig(configResponse.data);
      }

      if (response.success && response.data) {
        const categoryData = response.data;
        setCategory(categoryData);

        // Extract subcategories from childCategories
        if (categoryData.childCategories && Array.isArray(categoryData.childCategories)) {
          // Fetch real counts for food-dining
          let cuisineCounts: any[] = [];
          if (slug === 'food-dining') {
            try {
              const countResponse = await storesApi.getCuisineCounts();
              if (countResponse.success && countResponse.data?.cuisines) {
                cuisineCounts = countResponse.data.cuisines;
              }
            } catch (_e) {
              // silently handle
            }
          }

          // Map cuisine names to icons and colors for fallback
          const cuisineIconMap: Record<string, { icon: string; color: string }> = {
            'pizza': { icon: '🍕', color: '#EF4444' },
            'biryani': { icon: '🍗', color: '#D946EF' },
            'burgers': { icon: '🍔', color: '#F97316' },
            'chinese': { icon: '🥡', color: '#3B82F6' },
            'desserts': { icon: '🍦', color: '#10B981' },
            'healthy': { icon: '🥗', color: '#22C55E' },
            'indian': { icon: '🍛', color: '#F59E0B' },
            'italian': { icon: '🍝', color: '#EF4444' },
            'thai': { icon: '🍜', color: '#EC4899' },
            'mexican': { icon: '🌮', color: '#F97316' },
            'south indian': { icon: '🥘', color: '#8B5CF6' },
            'north indian': { icon: '🍛', color: '#F59E0B' },
            'continental': { icon: '🥩', color: '#6366F1' },
            'japanese': { icon: '🍣', color: '#3B82F6' },
            'street': { icon: '🌮', color: '#F59E0B' },
            'chaat': { icon: '🥘', color: '#F59E0B' },
            'cafe': { icon: '☕', color: '#78350F' },
            'thali': { icon: '🍱', color: '#F59E0B' },
            'ice-cream': { icon: '🍦', color: '#EC4899' },
            'healthy-food': { icon: '🥗', color: '#22C55E' },
          };

          const subs = categoryData.childCategories.map((child: any) => {
            const nameLower = (child.name || '').toLowerCase();
            const slugLower = (child.slug || '').toLowerCase();

            // Find matching cuisine icon/color
            let fallbackIcon = '🍽️';
            let fallbackColor = '#6B7280';
            let matchedCount = 0;

            for (const [key, value] of Object.entries(cuisineIconMap)) {
              if (nameLower.includes(key) || slugLower.includes(key)) {
                fallbackIcon = value.icon;
                fallbackColor = value.color;
                break;
              }
            }

            // Find matching real count if available
            if (cuisineCounts.length > 0) {
              const matchedCuisine = cuisineCounts.find(c =>
                nameLower.includes(c.id) || slugLower.includes(c.id) ||
                c.id.includes(slugLower) || c.name.toLowerCase() === nameLower
              );
              if (matchedCuisine) {
                matchedCount = matchedCuisine.count;
              }
            }

            // Use real count if we found one (and it's greater than 0), otherwise fall back to DB count
            const finalCount = matchedCount > 0 ? matchedCount : (child.productCount || child.storeCount);

            return {
              id: child._id || child.id,
              name: child.name,
              slug: child.slug,
              icon: child.icon || fallbackIcon || '🍽️',
              color: child.metadata?.color || fallbackColor,
              cashback: child.maxCashback,
              itemCount: finalCount,
              image: child.image,
            };
          });
          setSubcategories(subs);
        }

        // Extract vibes, occasions, hashtags from category
        setVibes(categoryData.vibes || []);
        setOccasions(categoryData.occasions || []);
        setHashtags(categoryData.trendingHashtags || []);

      } else {
        // Fallback to dummy data
        loadDummyData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load category');
      loadDummyData();
    } finally {
      setIsLoadingCategory(false);
    }
  }, [slug]);

  /**
   * Fetch stores by category
   */
  const fetchStores = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoadingStores(true);

      const response = await storesApi.getStoresBySubcategorySlug(slug, storesPerPage);

      if (response.success && response.data) {
        const storesData = Array.isArray(response.data) ? response.data : [];
        const formattedStores = storesData.map((store: any) => ({
          // Basic fields
          id: store._id || store.id,
          _id: store._id || store.id, // Some components use _id
          name: store.name,
          slug: store.slug,
          logo: store.logo,
          banner: store.banner,
          rating: store.ratings?.average || store.rating || 0,
          ratings: store.ratings, // Full ratings object with count
          cashback: store.offers?.cashback || store.cashback,
          distance: store.distance || '',
          is60Min: store.deliveryCategories?.fastDelivery || (store.operationalInfo?.deliveryTime ? parseInt(store.operationalInfo.deliveryTime) <= 60 : false),
          hasPickup: store.hasStorePickup || false,
          categories: store.category ? [store.category.name] : [],
          category: store.category, // Full category object
          // Enhanced card fields
          tags: store.tags || [],
          rewardRules: store.rewardRules,
          priceForTwo: store.priceForTwo,
          offers: store.offers,
          operationalInfo: store.operationalInfo,
          deliveryCategories: store.deliveryCategories,
          location: store.location,
          isFeatured: store.isFeatured,
          // Dine-in fields
          bookingType: store.bookingType,
          bookingConfig: store.bookingConfig,
          storeVisitConfig: store.storeVisitConfig,
          isDineIn: store.bookingType === 'RESTAURANT' || store.bookingConfig?.enabled || store.storeVisitConfig?.enabled || false,
          isOpen: store.isOpen ?? store.operationalInfo?.isCurrentlyOpen,
          type: store.type,
        }));
        setStores(formattedStores);
      }
    } catch (err: any) {
      setError('Unable to load stores. Pull to refresh.');
    } finally {
      setIsLoadingStores(false);
    }
  }, [slug, storesPerPage]);

  /**
   * Fetch products by category
   */
  const fetchProducts = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoadingProducts(true);

      const response = await productsApi.getProductsByCategory(slug, { limit: storesPerPage });

      if (response.success && response.data) {
        const productsData = response.data.products || [];
        const formattedProducts = productsData.map((product: any) => ({
          id: product._id || product.id,
          _id: product._id || product.id,
          name: product.name,
          image: product.images?.[0]?.url || product.image,
          images: product.images?.map((img: any) => img?.url || img) || [],
          price: product.pricing?.selling || product.pricing?.original || product.price,
          originalPrice: product.pricing?.original,
          pricing: product.pricing, // Full pricing object (bulkPrice for wholesale filter)
          discount: product.pricing?.selling && product.pricing?.original && product.pricing.original > product.pricing.selling
            ? Math.round((1 - product.pricing.selling / product.pricing.original) * 100)
            : undefined,
          rating: product.ratings?.average || product.rating,
          cashback: product.cashback?.percentage,
          cashbackCoins: product.cashback?.coins || product.cashbackCoins || 0,
          storeName: product.store?.name || (typeof product.store === 'string' ? undefined : undefined),
          storeId: product.store?._id || product.store?.id || (typeof product.store === 'string' ? product.store : undefined),
          store: typeof product.store === 'object' ? {
            _id: product.store?._id || product.store?.id,
            id: product.store?._id || product.store?.id,
            name: product.store?.name,
            tags: product.store?.tags || [],
            type: product.store?.type,
            deliveryCategories: product.store?.deliveryCategories,
            operationalInfo: product.store?.operationalInfo,
            logo: product.store?.logo,
          } : product.store,
          tags: product.tags || [],
          brand: product.brand,
          unit: product.unit,
          deliveryCategories: product.deliveryCategories,
        }));
        setProducts(formattedProducts);
      }
    } catch (err: any) {
    } finally {
      setIsLoadingProducts(false);
    }
  }, [slug, storesPerPage]);

  /**
   * Load dummy data as fallback
   */
  const loadDummyData = useCallback(() => {
    const dummyData = getDummyData(slug);

    // Map dummy categories to subcategories
    if (dummyData.categories) {
      const subs = dummyData.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.id,
        icon: cat.icon,
        color: cat.color,
        cashback: cat.cashback,
        itemCount: cat.itemCount,
      }));
      setSubcategories(subs);
    }

    // Set vibes, occasions, hashtags from dummy data
    if (dummyData.vibes) setVibes(dummyData.vibes);
    if (dummyData.occasions) setOccasions(dummyData.occasions);
    if (dummyData.trendingHashtags) setHashtags(dummyData.trendingHashtags);

    // Don't set dummy UGC posts — only show real user content or nothing
    // UGC data is fetched from real APIs in loadUGCAndOffers()

    // Set exclusive offers
    if (dummyData.exclusiveOffers) {
      setExclusiveOffers(dummyData.exclusiveOffers);
    }

    // Set AI search data
    if (dummyData.aiSuggestions) setAiSuggestions(dummyData.aiSuggestions);
    if (dummyData.aiFilterChips) setAiFilterChips(dummyData.aiFilterChips);
    if (dummyData.aiPlaceholders) setAiPlaceholders(dummyData.aiPlaceholders);

    // Set stores from dummy
    if (dummyData.stores) {
      setStores(dummyData.stores);
    }

  }, [slug]);

  /**
   * Generate AI suggestions from category data (vibes, occasions, hashtags)
   */
  const generateAISuggestions = useCallback(() => {
    const suggestions: any[] = [];
    const filterChips: any[] = [];
    const placeholders: string[] = [];

    // Generate suggestions from vibes
    vibes.slice(0, 3).forEach((vibe) => {
      suggestions.push({
        id: `vibe-${vibe.id}`,
        text: `Find ${vibe.name.toLowerCase()} options`,
        icon: vibe.icon,
        color: vibe.color,
        type: 'vibe',
      });
    });

    // Generate suggestions from occasions
    occasions.slice(0, 3).forEach((occasion) => {
      suggestions.push({
        id: `occasion-${occasion.id}`,
        text: `${occasion.name} deals`,
        icon: occasion.icon,
        color: occasion.color,
        type: 'occasion',
        discount: occasion.discount,
      });
    });

    // Generate filter chips from hashtags
    hashtags.slice(0, 4).forEach((hashtag) => {
      filterChips.push({
        id: `hashtag-${hashtag.id}`,
        label: hashtag.tag,
        count: hashtag.count,
        color: hashtag.color,
        trending: hashtag.trending,
      });
    });

    // Generate search placeholders
    const categoryName = category?.name || slug.replace(/-/g, ' ');
    placeholders.push(
      `Search in ${categoryName}...`,
      `Find deals on ${categoryName.toLowerCase()}...`,
      vibes.length > 0 ? `Explore ${vibes[0].name.toLowerCase()} options...` : `Discover popular ${categoryName.toLowerCase()}...`,
    );

    setAiSuggestions(suggestions);
    setAiFilterChips(filterChips);
    setAiPlaceholders(placeholders);
  }, [vibes, occasions, hashtags, category, slug]);

  /**
   * Load real UGC data from videos + reviews APIs, fallback to dummy
   */
  const loadUGCAndOffers = useCallback(async () => {
    try {
      const [videosRes, reviewsRes] = await Promise.all([
        apiClient.get<any>('/videos', { category: slug, limit: 6, status: 'approved' }).catch(() => null),
        apiClient.get<any>('/reviews/featured', { category: slug, limit: 6 }).catch(() => null),
      ]);

      const combined: UGCPostItem[] = [];

      if (videosRes?.success && videosRes.data) {
        const videos = Array.isArray(videosRes.data) ? videosRes.data : (videosRes.data?.videos || []);
        videos.forEach((v: any) => {
          const creator = v.creator || v.user;
          combined.push({
            id: v._id,
            userId: creator?._id || '',
            userName: creator?.profile
              ? `${creator.profile.firstName || ''} ${creator.profile.lastName || ''}`.trim() || 'Foodie'
              : 'Foodie',
            userAvatar: creator?.profile?.avatar || '',
            image: v.thumbnail || v.videoUrl || '',
            hashtag: v.tags?.[0] ? `#${v.tags[0]}` : '#FoodieLife',
            likes: v.engagement?.likes?.length || 0,
            comments: v.engagement?.comments || v.comments?.length || 0,
            coinsEarned: v.coinsEarned || 0,
            isVerified: creator?.isVerified || false,
          });
        });
      }

      if (reviewsRes?.success && reviewsRes.data) {
        const reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : (reviewsRes.data?.reviews || []);
        reviews.forEach((r: any) => {
          if (r.images && r.images.length > 0) {
            combined.push({
              id: r._id,
              userId: r.user?._id || '',
              userName: r.user?.profile
                ? `${r.user.profile.firstName || ''} ${r.user.profile.lastName || ''}`.trim() || 'Reviewer'
                : 'Reviewer',
              userAvatar: r.user?.profile?.avatar || '',
              image: r.images[0],
              hashtag: r.store?.name ? `#${r.store.name.replace(/\s+/g, '')}` : '#FoodReview',
              likes: r.helpful || 0,
              comments: 0,
              coinsEarned: r.coinsEarned || 0,
              isVerified: r.user?.isVerified || false,
            });
          }
        });
      }

      if (combined.length > 0) {
        setUgcPosts(combined);
      } else {
        // No real UGC data - section will be hidden (component returns null for empty posts)
        setUgcPosts([]);
      }
    } catch (err) {
      setUgcPosts([]);
    }

    // Exclusive offers - from dummy for now (offers section handles its own real API)
    const dummyData = getDummyData(slug);
    if (dummyData.exclusiveOffers) {
      setExclusiveOffers(dummyData.exclusiveOffers);
    }
  }, [slug]);

  /**
   * Refetch all data
   */
  const refetch = useCallback(async () => {
    // Clear data cache for this slug
    delete _dataCache[slug];
    await Promise.all([
      fetchCategoryData(),
      fetchStores(),
      fetchProducts(),
    ]);
    loadUGCAndOffers();
  }, [slug, fetchCategoryData, fetchStores, fetchProducts, loadUGCAndOffers]);

  // Track latest callback refs so the effect only depends on slug
  const fetchCategoryDataRef = useRef(fetchCategoryData);
  const fetchStoresRef = useRef(fetchStores);
  const fetchProductsRef = useRef(fetchProducts);
  const loadUGCAndOffersRef = useRef(loadUGCAndOffers);
  fetchCategoryDataRef.current = fetchCategoryData;
  fetchStoresRef.current = fetchStores;
  fetchProductsRef.current = fetchProducts;
  loadUGCAndOffersRef.current = loadUGCAndOffers;

  // Initial fetch — only depends on slug to prevent refetch on remount/callback recreation
  useEffect(() => {
    if (slug) {
      fetchCategoryDataRef.current();
      fetchStoresRef.current();
      fetchProductsRef.current();
      loadUGCAndOffersRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Generate AI suggestions when category data changes
  useEffect(() => {
    if (vibes.length > 0 || occasions.length > 0 || hashtags.length > 0) {
      generateAISuggestions();
    }
  }, [vibes, occasions, hashtags, generateAISuggestions]);

  // Update module-level cache when data loads (for instant init on remount)
  useEffect(() => {
    if (slug && stores.length > 0) {
      _dataCache[slug] = {
        stores,
        subcategories,
        ugcPosts,
        aiPlaceholders,
        timestamp: Date.now(),
      };
    }
  }, [slug, stores, subcategories, ugcPosts, aiPlaceholders]);

  // Computed loading state
  const isLoading = isLoadingCategory || isLoadingStores || isLoadingProducts;

  return {
    // Category Info
    category,
    categoryName: category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    categorySlug: slug,

    // Dynamic Page Config (admin-driven)
    pageConfig,

    // Subcategories
    subcategories,

    // Category Page Data
    vibes,
    occasions,
    hashtags,

    // Stores & Products
    stores,
    products,

    // UGC Data
    ugcPosts,

    // Exclusive Offers
    exclusiveOffers,

    // AI Search Data
    aiSuggestions,
    aiFilterChips,
    aiPlaceholders,

    // Loading & Error States
    isLoading,
    isLoadingCategory,
    isLoadingStores,
    isLoadingProducts,
    error,

    // Actions
    refetch,
  };
};

export default useCategoryPageData;
