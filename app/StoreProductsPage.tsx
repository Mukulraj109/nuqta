// StoreProductsPage.tsx
// Displays all products for a specific store in an Amazon-style grid layout

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Text,
  TextInput,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ProductCard from '@/components/homepage/cards/ProductCard';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductItem } from '@/types/homepage.types';
import storesApi from '@/services/storesApi';
import { useStoreData } from '@/hooks/useStoreData';
import { useCartState, useCartActions, useAuthUser, useIsAuthenticated, useGetCurrencySymbol } from '@/stores/selectors';
import { useWishlist } from '@/contexts/WishlistContext';
import { triggerImpact } from '@/utils/haptics';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import apiClient from '@/services/apiClient';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { handleNetworkError, isRetryableError } from '@/utils/networkErrorHandler';
import ProductGridSkeleton from '@/components/skeletons/ProductGridSkeleton';
import { RetryButton } from '@/components/common/RetryButton';
import analyticsService from '@/services/analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '@/components/common/ToastManager';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { errorReporter } from '@/utils/errorReporter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate card width for responsive grid (2 columns on mobile, 3+ on tablet)
const getCardWidth = () => {
  const padding = 16 * 2; // Horizontal padding
  const gap = 12; // Gap between cards
  const columns = SCREEN_WIDTH >= 768 ? 3 : 2;
  return (SCREEN_WIDTH - padding - (gap * (columns - 1))) / columns;
};

interface StoreProductsPageProps {}

function StoreProductsPage({}: StoreProductsPageProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const storeId = params.storeId as string;
  const storeName = params.storeName as string | undefined;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; isRetryable: boolean; suggestions?: string[] } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'rating' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  
  // Search history and suggestions
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  
  // Performance tracking
  const pageLoadStartTime = useRef<number>(Date.now());
  const productViewTimes = useRef<Map<string, number>>(new Map());

  // Quick view and product details modal states
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<ProductItem | null>(null);

  // URL params for web (sync filters with URL) - moved after state declarations
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location?.search || '');

        // Load filters from URL on mount
        const urlSearch = urlParams.get('search');
        const urlCategory = urlParams.get('category');
        const urlSort = urlParams.get('sort');

        if (urlSearch && urlSearch !== searchQuery) {
          setSearchQuery(urlSearch);
        }
        if (urlCategory && urlCategory !== selectedCategory) {
          setSelectedCategory(urlCategory);
        }
        if (urlSort && urlSort !== sortBy) {
          setSortBy(urlSort as typeof sortBy);
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }, []); // Only on mount

  // Update URL params when filters change (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams();
      
      if (searchQuery.trim()) {
        urlParams.set('search', searchQuery.trim());
      }
      if (selectedCategory) {
        urlParams.set('category', selectedCategory);
      }
      if (sortBy !== 'newest') {
        urlParams.set('sort', sortBy);
      }
      
      const newUrl = urlParams.toString()
        ? `${pathname}?${urlParams.toString()}`
        : pathname;

      // Update URL without page reload
      try {
        window.history?.replaceState?.({}, '', newUrl);
      } catch (e) {
        // Ignore history API errors
      }
    }
  }, [searchQuery, selectedCategory, sortBy, pathname]);

  // Keyboard shortcuts for web (accessibility)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as any;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + K: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus search input if available
        try {
          const searchInput = document.querySelector?.('[data-search-input]') as any;
          searchInput?.focus?.();
        } catch (e) { /* ignore */ }
      }

      // Ctrl/Cmd + F: Open filters
      if ((event.ctrlKey || event.metaKey) && event.key === 'f' && !event.shiftKey) {
        event.preventDefault();
        setShowFilters(true);
      }

      // Escape: Close modals
      if (event.key === 'Escape') {
        if (showQuickView) {
          setShowQuickView(false);
        }
        if (showProductDetails) {
          setShowProductDetails(false);
        }
        if (showFilters) {
          setShowFilters(false);
        }
      }

      // /: Focus search (when not in input)
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        try {
          const searchInput = document.querySelector?.('[data-search-input]') as any;
          searchInput?.focus?.();
        } catch (e) { /* ignore */ }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQuickView, showProductDetails, showFilters]);

  // Offline caching: Save products to cache
  useEffect(() => {
    if (!storeId || products.length === 0 || loading) return;

    const cacheProducts = async () => {
      try {
        const cacheKey = `products_cache_${storeId}`;
        const cacheData = {
          products,
          timestamp: Date.now(),
          filters: {
            searchQuery,
            selectedCategory,
            sortBy,
          },
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) { // Silent: non-critical AsyncStorage cache write
      }
    };

    // Cache after a short delay to avoid excessive writes
    const timeoutId = setTimeout(cacheProducts, 1000);
    return () => clearTimeout(timeoutId);
  }, [products, storeId, searchQuery, selectedCategory, sortBy, loading]);

  // Load cached products on mount (offline support) - moved after network status hook

  // Fetch store data for header
  const { data: storeData, loading: storeLoading } = useStoreData(storeId || '');

  // Cart and Wishlist context
  const cartState = useCartState();
  const cartActions = useCartActions();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  // Toast notifications (using showToast from ToastManager directly)

  // Authentication context
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();

  // Network status
  const { isOnline, isOffline, connectionQuality, waitForNetwork } = useNetworkStatus();

  // Animation refs
  const backButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const cartButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const wishlistButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const coinButtonScaleAnim = useRef(new Animated.Value(1)).current;

  // Cart item count
  const cartItemCount = useMemo(() => {
    return cartState.items.reduce((total, item) => total + item.quantity, 0);
  }, [cartState.items]);

  const cardWidth = useMemo(() => getCardWidth(), []);

  // Animation helper
  const animateScale = (animValue: Animated.Value, toValue: number) => {
    Animated.spring(animValue, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Header handlers
  const handleBack = () => {
    triggerImpact('Medium');
    router.back();
  };

  const handleCartPress = () => {
    triggerImpact('Medium');
    router.push('/cart');
  };

  const handleWishlistPress = () => {
    triggerImpact('Medium');
    router.push('/wishlist');
  };

  const handleCoinPress = () => {
    triggerImpact('Medium');
    if (Platform.OS === 'web') {
      setTimeout(() => router.push('/coins'), 50);
    } else {
      router.push('/coins');
    }
  };

  // Fetch categories from Category API
  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiClient.get('/categories', {
          type: 'home_delivery', // Get home delivery categories for products
        });

        if (cancelled) return;
        if (response.success && response.data) {
          const categoryList = Array.isArray(response.data)
            ? response.data
            : ((response.data as any).categories || []);

          setCategories(categoryList.map((cat: any) => ({
            id: cat._id || cat.id || '',
            name: cat.name || '',
            slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || '',
          })));
        }
      } catch (error: any) {
        if (cancelled) return;
        errorReporter.captureError(
          error instanceof Error ? error : new Error('Failed to fetch product categories'),
          { context: 'StoreProductsPage.loadCategories' },
          'info'
        );
        setCategories([]);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    loadCategories();
    return () => { cancelled = true; };
  }, []);

  // Fetch products with comprehensive error handling and retry logic
  const fetchProducts = useCallback(async (pageNum: number = 1, append: boolean = false, retryAttempt: number = 0) => {
    if (!storeId) {
      const errorMsg = 'Store ID is required';
      setError(errorMsg);
      setErrorInfo({ message: errorMsg, isRetryable: false });
      setLoading(false);
      return;
    }

    // Check network status before making request
    if (isOffline) {
      const errorMsg = 'No internet connection. Please check your network and try again.';
      setError(errorMsg);
      setErrorInfo({ 
        message: errorMsg, 
        isRetryable: true,
        suggestions: [
          'Check your WiFi or mobile data connection',
          'Try switching between WiFi and mobile data',
          'Move to an area with better reception'
        ]
      });
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    try {
      if (!append) {
        setLoading(true);
        setError(null);
        setErrorInfo(null);
      } else {
        setLoadingMore(true);
      }

      // Build query parameters
      const queryParams: any = {
        page: pageNum,
        limit: 20,
      };

      // Add search query
      if (searchQuery.trim()) {
        queryParams.search = searchQuery.trim();
      }

      // Add category filter
      if (selectedCategory) {
        queryParams.category = selectedCategory;
      }

      // Add sort
      if (sortBy) {
        queryParams.sortBy = sortBy;
      }

      const response = await storesApi.getStoreProducts(storeId, queryParams);

      if (response.success && response.data) {
        // Validate response structure
        if (!response.data.products || !Array.isArray(response.data.products)) {
          throw new Error('Invalid response format from server');
        }

        const newProducts: ProductItem[] = (response.data.products || []).map((product: any) => {
          const productId = product._id || product.id;
          
          // Validate product data
          if (!productId) {
            return null;
          }
          
          // Handle images - API returns array of strings (URLs)
          const productImage = Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : product.image;
          
          // Validate image URL
          const isValidImageUrl = typeof productImage === 'string' && 
            (productImage.startsWith('http') || productImage.startsWith('https') || productImage.startsWith('/'));
          
          // Handle pricing - API uses pricing.selling and pricing.original
          const sellingPrice = product.pricing?.selling || product.pricing?.basePrice || 0;
          const originalPrice = product.pricing?.original || product.pricing?.basePrice || 0;
          const discount = product.pricing?.discount || (originalPrice > sellingPrice
            ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
            : 0);
          
          // Validate prices
          if (isNaN(sellingPrice) || sellingPrice < 0) {
          }
          
          // Handle inventory - API uses inventory.stock and inventory.isAvailable
          const stock = product.inventory?.stock || 0;
          const isAvailable = product.inventory?.isAvailable !== false && stock > 0;
          
          return {
          id: productId,
          _id: productId,
          type: 'product' as const,
          name: product.name || 'Unnamed Product',
          title: product.name || 'Unnamed Product',
          brand: product.brand || storeData?.name || 'Store',
          image: isValidImageUrl ? productImage : undefined,
          description: product.description || product.shortDescription || '',
          price: {
            current: Math.max(0, sellingPrice),
            original: originalPrice > sellingPrice ? Math.max(0, originalPrice) : undefined,
            currency: product.pricing?.currency || 'INR',
            discount: Math.max(0, Math.min(100, discount)),
          },
          category: product.category?.name || product.category || 'General',
          subcategory: product.subcategory,
          rating: product.ratings ? {
            value: typeof product.ratings.average === 'string'
              ? parseFloat(product.ratings.average) || 0
              : (product.ratings.average || 0),
            count: product.ratings.count || 0,
          } : undefined,
          cashback: product.cashback ? {
            percentage: product.cashback.percentage || 0,
            maxAmount: product.cashback.maxAmount,
          } : undefined,
          availabilityStatus: isAvailable ? 'in_stock' : 'out_of_stock',
          inventory: {
            stock: Math.max(0, stock),
            lowStockThreshold: product.inventory?.lowStockThreshold || 5,
          },
          tags: Array.isArray(product.tags) ? product.tags : [],
          isNewArrival: product.isNewArrival,
          isRecommended: product.isFeatured || product.isRecommended,
          storeName: storeData?.name || storeName || 'Store',
          storeId: storeId,
        } as ProductItem;
        }).filter((product): product is ProductItem => product !== null);

        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }

        // Check if there are more pages
        const pagination = response.data.pagination;
        setHasMore(pagination ? (pageNum < pagination.pages) : false);
        
        // Reset retry count on success
        setRetryCount(0);
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      // Handle network errors with proper classification
      const networkError = handleNetworkError(err);
      const errorMessage = networkError.userMessage;
      const isRetryable = networkError.isRetryable && retryAttempt < maxRetries;

      setError(errorMessage);
      setErrorInfo({
        message: errorMessage,
        isRetryable,
        suggestions: networkError.suggestions,
      });

      if (!append) {
        setProducts([]);
      }

      // Auto-retry for retryable errors
      if (isRetryable && retryAttempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryAttempt), 5000); // Exponential backoff, max 5s
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          fetchProducts(pageNum, append, retryAttempt + 1);
        }, delay);
        return; // Don't set loading to false yet
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [storeId, storeData, storeName, searchQuery, selectedCategory, sortBy, isOffline]);

  // Save search history - defined before useEffects that use it
  const saveSearchHistory = useCallback(async (query: string) => {
    if (!query.trim() || !storeId) return;
    
    try {
      const sanitizedQuery = query.trim().toLowerCase();
      setSearchHistory(prev => {
        const updatedHistory = [
          sanitizedQuery,
          ...prev.filter(item => item !== sanitizedQuery)
        ].slice(0, 10);
        
        // Save to storage asynchronously
        AsyncStorage.setItem(`search_history_${storeId}`, JSON.stringify(updatedHistory)).catch(err => {
        });
        
        return updatedHistory;
      });
    } catch (error) { // Silent: non-critical search history save
    }
  }, [storeId]);

  // Debounced search with analytics
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!storeId) return;
    
    searchTimeoutRef.current = setTimeout(() => {
      // Track search if query is not empty
      if (searchQuery.trim()) {
        analyticsService.track('product_search', {
          storeId,
          query: searchQuery.trim(),
          hasCategoryFilter: !!selectedCategory,
          sortBy,
          resultCount: products.length,
        });
        
        // Save to search history
        saveSearchHistory(searchQuery);
      }
      
      // Reset to page 1 when search changes
      setPage(1);
      setHasMore(true);
      fetchProducts(1, false);
    }, 300); // Reduced to 300ms for better UX

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, storeId, fetchProducts, selectedCategory, sortBy, products.length, saveSearchHistory]);

  // Refetch when filters change with analytics
  useEffect(() => {
    if (!storeId) return;
    
    // Track filter changes
    if (selectedCategory || sortBy !== 'newest') {
      analyticsService.track('product_filter_applied', {
        storeId,
        category: selectedCategory,
        sortBy,
        availabilityFilter,
        hasPriceFilter: !!(minPrice || maxPrice),
      });
    }
    
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [selectedCategory, sortBy, storeId, fetchProducts, availabilityFilter, minPrice, maxPrice]);

  // Filter products client-side for price and availability (since backend doesn't support these yet)
  // Memoized for performance - only recalculates when dependencies change
  const filteredProducts = useMemo(() => {
    if (products.length === 0) return [];

    let filtered = [...products];

    // Filter by availability
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (availabilityFilter === 'in_stock') {
          return product.availabilityStatus === 'in_stock';
        } else {
          return product.availabilityStatus === 'out_of_stock';
        }
      });
    }

    // Filter by price range
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min) && min > 0) {
        filtered = filtered.filter(product => product.price.current >= min);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max) && max > 0) {
        filtered = filtered.filter(product => product.price.current <= max);
      }
    }

    return filtered;
  }, [products, availabilityFilter, minPrice, maxPrice]);

  // Load search history from storage
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await AsyncStorage.getItem(`search_history_${storeId}`);
        if (history) {
          const parsed = JSON.parse(history);
          setSearchHistory(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
        }
      } catch (error) { // Silent: non-critical AsyncStorage read
      }
    };

    if (storeId) {
      loadSearchHistory();
    }
  }, [storeId]);

  // Generate search suggestions from products and history
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestions: string[] = [];

    // Add matching search history
    searchHistory
      .filter(item => item.includes(query) && item !== query)
      .slice(0, 3)
      .forEach(item => suggestions.push(item));

    // Add matching product names
    products
      .filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .forEach(product => {
        if (!suggestions.includes(product.name.toLowerCase())) {
          suggestions.push(product.name);
        }
      });

    setSearchSuggestions(suggestions.slice(0, 5));
    setShowSearchSuggestions(suggestions.length > 0);
  }, [searchQuery, products, searchHistory]);

  // Enhanced error boundary handler with analytics
  const handleErrorBoundaryError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    analyticsService.track('error_boundary_caught', {
      storeId,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500), // Limit stack trace length
      componentStack: errorInfo.componentStack?.substring(0, 500),
      timestamp: new Date().toISOString(),
    });

    // Log to console in development
    if (__DEV__) {
    }
  }, [storeId]);

  // Track page view on mount
  useEffect(() => {
    if (storeId) {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      pageLoadStartTime.current = startTime;
      
      analyticsService.trackPageView('store_products_page', {
        storeId,
        storeName: storeData?.name || storeName,
        productCount: products.length,
        platform: Platform.OS,
        screenWidth: SCREEN_WIDTH,
      });
    }
  }, [storeId, storeData?.name, storeName, products.length]);

  // Track performance when products finish loading (single tracking point)
  useEffect(() => {
    if (!loading && products.length > 0 && pageLoadStartTime.current) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const startTime = pageLoadStartTime.current;
      const loadTime = typeof performance !== 'undefined' 
        ? Math.round(endTime - startTime)
        : Date.now() - startTime;
      
      // Calculate performance metrics
      const metrics = {
        storeId,
        loadTime,
        productCount: products.length,
        hasFilters: !!(selectedCategory || searchQuery || sortBy !== 'newest'),
        networkStatus: isOnline ? 'online' : 'offline',
        connectionQuality: connectionQuality || 'unknown',
        platform: Platform.OS,
        screenWidth: SCREEN_WIDTH,
      };

      analyticsService.track('store_products_page_load_performance', metrics);

      // Warn if load time is too slow
      if (loadTime > 3000) {
        analyticsService.track('performance_warning', {
          ...metrics,
          warning: 'slow_load_time',
          threshold: 3000,
        });
      }
    }
  }, [loading, products.length, storeId, selectedCategory, searchQuery, sortBy, isOnline, connectionQuality]);

  // Initial load
  useEffect(() => {
    if (storeId) {
      fetchProducts(1, false);
    }
  }, [storeId, fetchProducts]);

  // Load more products
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [page, hasMore, loadingMore, loading, fetchProducts]);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Handle product press with analytics
  const handleProductPress = useCallback((product: ProductItem) => {
    const productId = (product as any)._id || product.id;
    
    // Track product view
    analyticsService.trackProductView({
      productId,
      productName: product.name,
      productPrice: product.price.current,
      category: product.category || 'General',
      brand: product.brand || storeData?.name || 'Store',
    });

    // Track time spent viewing (if available)
    const viewStartTime = productViewTimes.current.get(productId);
    if (viewStartTime) {
      const timeSpent = Date.now() - viewStartTime;
      analyticsService.track('product_time_spent', {
        productId,
        timeSpent,
        storeId,
      });
    }

    router.push({
      pathname: '/product-page',
      params: {
        cardId: productId,
        cardType: 'product',
      },
    } as any);
  }, [router, storeData?.name, storeId]);

  // Handle add to cart with authentication check, analytics, and toast feedback
  const handleAddToCart = useCallback(async (product: ProductItem) => {
    // Track add to cart attempt
    analyticsService.trackAddToCart({
      productId: product.id,
      productName: product.name,
      price: product.price.current,
      quantity: 1,
      totalValue: product.price.current,
    });

    // Check authentication
    if (!isAuthenticated) {
      analyticsService.track('add_to_cart_blocked', {
        reason: 'not_authenticated',
        productId: product.id,
        productName: product.name,
      });

      // Show login prompt
      platformAlertConfirm(
        'Sign In Required',
        'Please sign in to add items to your cart.',
        () => router.push('/sign-in'),
        'Sign In'
      );
      return;
    }

    // Check network status
    if (isOffline) {
      analyticsService.track('add_to_cart_blocked', {
        reason: 'offline',
        productId: product.id,
        productName: product.name,
      });

      platformAlertSimple('No Internet', 'Please check your network connection and try again.');
      return;
    }

    // Add to cart via CartContext
    try {
      if (cartActions && typeof cartActions.addItem === 'function') {
        await cartActions.addItem({
          id: product.id,
          name: product.name,
          price: product.price.current,
          image: product.image,
          cashback: product.cashback ? `${product.cashback.percentage}% cashback` : '',
          category: (product.category || 'products') as 'products' | 'service',
          quantity: 1,
        });

        // Success feedback
        triggerImpact('Medium');
        analyticsService.track('add_to_cart_success', {
          productId: product.id,
          productName: product.name,
          price: product.price.current,
        });

        // Show success toast notification
        showToast({
          message: `${product.name} added to cart`,
          type: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      analyticsService.track('add_to_cart_error', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Show error toast
      showToast({
        message: 'Failed to add item to cart. Please try again.',
        type: 'error',
        duration: 3000,
      });
    }
  }, [isAuthenticated, isOffline, router, cartActions]);

  // Handle wishlist toggle with analytics
  const handleWishlistToggle = useCallback(async (product: ProductItem) => {
    const productId = (product as any)._id || product.id;
    const isInWishlistNow = isInWishlist(productId);

    try {
      if (isInWishlistNow) {
        await removeFromWishlist(productId);
        analyticsService.trackWishlist('remove', productId, product.name);
        triggerImpact('Light');
        
        showToast({
          message: `${product.name} removed from wishlist`,
          type: 'info',
          duration: 2000,
        });
      } else {
        // Check authentication
        if (!isAuthenticated) {
          platformAlertConfirm(
            'Sign In Required',
            'Please sign in to add items to your wishlist.',
            () => router.push('/sign-in'),
            'Sign In'
          );
          return;
        }

        await addToWishlist({
          productId,
          productName: product.name,
          productImage: product.image,
          price: product.price.current,
          originalPrice: typeof product.price.original === 'number' ? product.price.original : undefined,
          discount: (() => {
            const discount = product.price.discount;
            if (typeof discount === 'number') return discount;
            if (typeof discount === 'string') {
              const parsed = parseFloat(discount);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          })(),
          rating: (() => {
            const ratingValue = product.rating?.value;
            if (typeof ratingValue === 'number') return ratingValue;
            if (typeof ratingValue === 'string') {
              const parsed = parseFloat(ratingValue);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          })(),
          reviewCount: product.rating?.count || 0,
          brand: product.brand || storeData?.name || 'Store',
          category: product.category || 'General',
          availability: product.availabilityStatus === 'in_stock' ? 'IN_STOCK' : 'OUT_OF_STOCK',
        });
        analyticsService.trackWishlist('add', productId, product.name);
        triggerImpact('Medium');
        
        showToast({
          message: `${product.name} added to wishlist`,
          type: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      // silently handle
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist, isAuthenticated, router, storeData?.name]);

  // Handle share product
  const handleShareProduct = useCallback(async (product: ProductItem) => {
    const productId = (product as any)._id || product.id;
    const productUrl = Platform.OS === 'web' 
      ? `${window.location.origin}/product-page?cardId=${productId}&cardType=product`
      : `rez://product/${productId}`;

    try {
      const shareMessage = `Check out ${product.name} at ${storeData?.name || storeName || 'this store'} for ${currencySymbol}${product.price.current}${product.price.original ? ` (was ${currencySymbol}${product.price.original})` : ''}`;

      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: product.name,
          text: shareMessage,
          url: productUrl,
        });
      } else {
        const result = await Share.share({
          message: `${shareMessage}\n\n${productUrl}`,
          title: product.name,
        });

        if (result.action === Share.sharedAction) {
          analyticsService.track('product_shared', {
            productId,
            productName: product.name,
            platform: result.activityType || 'unknown',
            storeId,
          });
        }
      }

      analyticsService.track('product_share_attempt', {
        productId,
        productName: product.name,
        storeId,
      });
    } catch (error: any) {
      if (error?.name !== 'AbortError' && error?.message !== 'User did not share') {
      }
    }
  }, [storeData?.name, storeName, storeId]);

  // Handle quick view
  const handleQuickView = useCallback((product: ProductItem) => {
    setQuickViewProduct(product);
    setShowQuickView(true);
    
    analyticsService.track('product_quick_view_opened', {
      productId: (product as any)._id || product.id,
      productName: product.name,
      storeId,
    });
  }, [storeId]);

  // Handle product details
  const handleProductDetails = useCallback((product: ProductItem) => {
    setSelectedProductForDetails(product);
    setShowProductDetails(true);
    
    analyticsService.track('product_details_opened', {
      productId: (product as any)._id || product.id,
      productName: product.name,
      storeId,
    });
  }, [storeId]);

  // Render product item - memoized for performance with analytics
  const renderProduct = useCallback(({ item, index }: { item: ProductItem; index: number }) => {
    const productId = (item as any)._id || item.id;
    
    // Track when product comes into view (for view time calculation)
    // Use ref to avoid re-renders
    if (!productViewTimes.current.has(productId)) {
      if (productViewTimes.current.size >= 100) {
        const oldest = productViewTimes.current.keys().next();
        if (!oldest.done) productViewTimes.current.delete(oldest.value);
      }
      productViewTimes.current.set(productId, Date.now());
    }

    return (
      <View
        style={[styles.productWrapper, { width: cardWidth }]}
        accessible={true}
        accessibilityLabel={`Product ${index + 1} of ${filteredProducts.length}. ${item.name}. ${item.price.current} rupees. ${item.availabilityStatus === 'in_stock' ? 'In stock' : 'Out of stock'}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view product details or add to cart"
      >
        <ProductCard
          product={item}
          onPress={handleProductPress}
          onAddToCart={handleAddToCart}
          width={cardWidth}
          showAddToCart={true}
        />
        
        {/* Quick Actions Overlay */}
        <View style={styles.quickActionsOverlay}>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleQuickView(item)}
            accessible={true}
            accessibilityLabel="Quick view product"
            accessibilityRole="button"
          >
            <Ionicons name="eye-outline" size={18} color={Colors.text.inverse} />
          </Pressable>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleWishlistToggle(item)}
            accessible={true}
            accessibilityLabel={isInWishlist(productId) ? "Remove from wishlist" : "Add to wishlist"}
            accessibilityRole="button"
          >
            <Ionicons 
              name={isInWishlist(productId) ? "heart" : "heart-outline"} 
              size={18} 
              color={isInWishlist(productId) ? Colors.error : Colors.text.inverse}
            />
          </Pressable>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleShareProduct(item)}
            accessible={true}
            accessibilityLabel="Share product"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={18} color={Colors.text.inverse} />
          </Pressable>
        </View>
      </View>
    );
  }, [cardWidth, filteredProducts.length, handleProductPress, handleAddToCart, handleQuickView, handleWishlistToggle, handleShareProduct, isInWishlist]);

  // Render empty state with improved error handling
  const renderEmpty = () => {
    if (loading) {
      // Show skeleton loader instead of spinner
      return (
        <View style={styles.emptyContainer}>
          <ProductGridSkeleton count={6} columns={SCREEN_WIDTH >= 768 ? 3 : 2} />
        </View>
      );
    }

    if (error && errorInfo) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={isOffline ? "cloud-offline-outline" : "alert-circle-outline"} 
            size={64} 
            color={Colors.error}
          />
          <ThemedText style={styles.emptyTitle}>
            {isOffline ? 'No Internet Connection' : 'Unable to load products'}
          </ThemedText>
          <ThemedText style={styles.emptyText}>{errorInfo.message}</ThemedText>
          
          {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ThemedText style={styles.suggestionsTitle}>Try:</ThemedText>
              {errorInfo.suggestions.map((suggestion, index) => (
                <ThemedText key={index} style={styles.suggestionText}>
                  • {suggestion}
                </ThemedText>
              ))}
            </View>
          )}

          {errorInfo.isRetryable && (
            <View style={styles.retryContainer}>
              <RetryButton
                onRetry={() => {
                  setRetryCount(0);
                  setError(null);
                  setErrorInfo(null);
                  fetchProducts(1, false, 0);
                }}
                label="Try Again"
                variant="primary"
              />
            </View>
          )}

          {isOffline && (
            <Pressable
              style={styles.waitForNetworkButton}
              onPress={async () => {
                const connected = await waitForNetwork(10000);
                if (connected) {
                  setError(null);
                  setErrorInfo(null);
                  fetchProducts(1, false, 0);
                } else {
                  setError('Still offline. Please check your connection.');
                }
              }}
            >
              <Ionicons name="refresh" size={20} color={Colors.nileBlue} />
              <ThemedText style={styles.waitForNetworkText}>Wait for Network</ThemedText>
            </Pressable>
          )}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.text.tertiary} />
          <ThemedText style={styles.emptyTitle}>Unable to load products</ThemedText>
          <ThemedText style={styles.emptyText}>{error}</ThemedText>
          <RetryButton
            onRetry={() => {
              setRetryCount(0);
              setError(null);
              setErrorInfo(null);
              fetchProducts(1, false, 0);
            }}
            label="Try Again"
            variant="primary"
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={64} color={Colors.text.tertiary} />
        <ThemedText style={styles.emptyTitle}>No products found</ThemedText>
        <ThemedText style={styles.emptyText}>
          {searchQuery || selectedCategory || availabilityFilter !== 'all' || minPrice || maxPrice
            ? 'Try adjusting your filters or search terms.'
            : 'This store doesn\'t have any products yet.'}
        </ThemedText>
        {(searchQuery || selectedCategory || availabilityFilter !== 'all' || minPrice || maxPrice) && (
          <Pressable
            style={styles.clearFiltersButton}
            onPress={() => {
              analyticsService.track('filters_cleared', {
                storeId,
                hadSearch: !!searchQuery,
                hadCategory: !!selectedCategory,
                hadSort: sortBy !== 'newest',
                hadAvailability: availabilityFilter !== 'all',
                hadPrice: !!(minPrice || maxPrice),
              });
              
              setSearchQuery('');
              setSelectedCategory(null);
              setAvailabilityFilter('all');
              setMinPrice('');
              setMaxPrice('');
              setSortBy('newest');
            }}
            accessible={true}
            accessibilityLabel="Clear all filters"
            accessibilityRole="button"
          >
            <ThemedText style={styles.clearFiltersText}>Clear All Filters</ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  // Render footer (loading more indicator) - memoized
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.nileBlue} />
        <ThemedText style={styles.footerText}>Loading more products...</ThemedText>
      </View>
    );
  }, [loadingMore]);

  const displayStoreName = storeData?.name || storeName || 'Store';
  const { height } = Dimensions.get('window');
  const topPadding = Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight ?? 24;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ErrorBoundary onError={handleErrorBoundaryError}>
        <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.nileBlue} />
        
        {/* Network Status Indicator */}
        {isOffline && (
          <View style={styles.networkBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={Colors.text.inverse} />
            <ThemedText style={styles.networkBannerText}>
              No internet connection
            </ThemedText>
          </View>
        )}

        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[Colors.nileBlue, Colors.secondary[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerGradient, { paddingTop: topPadding + 12 }]}
        >
          <View style={styles.headerInner}>
            {/* Back Button */}
            <Animated.View style={{ transform: [{ scale: backButtonScaleAnim }] }}>
              <Pressable
                style={styles.iconButton}
                onPress={handleBack}
                onPressIn={() => animateScale(backButtonScaleAnim, 0.92)}
                onPressOut={() => animateScale(backButtonScaleAnim, 1)}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <View style={styles.iconButtonBackground}>
                  <Ionicons name="chevron-back" size={22} color={Colors.text.inverse} />
                </View>
              </Pressable>
            </Animated.View>

            {/* Title Section */}
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle} numberOfLines={1}>
                {displayStoreName}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                {products.length} product{products.length !== 1 ? 's' : ''}
              </ThemedText>
            </View>

            {/* Action Buttons */}
            <View style={styles.headerActions}>
              {/* Coin Page Button (Star Icon) */}
              <Animated.View style={{ transform: [{ scale: coinButtonScaleAnim }] }}>
                <Pressable
                  style={styles.iconButton}
                  onPress={handleCoinPress}
                  onPressIn={() => animateScale(coinButtonScaleAnim, 0.92)}
                  onPressOut={() => animateScale(coinButtonScaleAnim, 1)}
                  accessibilityLabel="View coins"
                  accessibilityRole="button"
                >
                  <View style={styles.iconButtonBackground}>
                    <Ionicons name="star" size={22} color={Colors.text.inverse} />
                  </View>
                </Pressable>
              </Animated.View>

              {/* Wishlist Button (Heart Icon) */}
              <Animated.View style={{ transform: [{ scale: wishlistButtonScaleAnim }] }}>
                <Pressable
                  style={styles.iconButton}
                  onPress={handleWishlistPress}
                  onPressIn={() => animateScale(wishlistButtonScaleAnim, 0.92)}
                  onPressOut={() => animateScale(wishlistButtonScaleAnim, 1)}
                  accessibilityLabel="View wishlist"
                  accessibilityRole="button"
                >
                  <View style={styles.iconButtonBackground}>
                    <Ionicons name="heart" size={22} color={Colors.text.inverse} />
                  </View>
                </Pressable>
              </Animated.View>

              {/* Cart Button with Badge */}
              <Animated.View style={{ transform: [{ scale: cartButtonScaleAnim }] }}>
                <Pressable
                  style={styles.iconButton}
                  onPress={handleCartPress}
                  onPressIn={() => animateScale(cartButtonScaleAnim, 0.92)}
                  onPressOut={() => animateScale(cartButtonScaleAnim, 1)}
                  accessibilityLabel={`Cart. ${cartItemCount} items`}
                  accessibilityRole="button"
                >
                  <View style={styles.iconButtonBackground}>
                    <Ionicons name="bag" size={22} color={Colors.text.inverse} />
                    {cartItemCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </LinearGradient>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={(text) => {
                  // Sanitize input - remove special characters that could cause issues
                  const sanitized = text.replace(/[<>{}[\]\\]/g, '').slice(0, 100); // Limit to 100 chars
                  setSearchQuery(sanitized);
                  setShowSearchSuggestions(sanitized.trim().length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.trim() || searchHistory.length > 0) {
                    setShowSearchSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay to allow suggestion click
                  setTimeout(() => setShowSearchSuggestions(false), 200);
                }}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    saveSearchHistory(searchQuery);
                    setShowSearchSuggestions(false);
                  }
                }}
                accessible={true}
                accessibilityLabel="Search products"
                accessibilityRole="search"
                accessibilityHint="Type to search for products. Press / to focus, Ctrl+K for quick search"
                data-search-input={true}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setShowSearchSuggestions(false);
                  }}
                  style={styles.clearButton}
                  accessible={true}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
                </Pressable>
              )}
            </View>

            {/* Search Suggestions Dropdown */}
            {showSearchSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0) && (
              <View style={styles.suggestionsDropdown}>
                <ScrollView 
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Search History */}
                  {searchHistory.length > 0 && !searchQuery.trim() && (
                    <>
                      <ThemedText style={styles.suggestionsHeader}>Recent Searches</ThemedText>
                      {searchHistory.slice(0, 5).map((item, index) => (
                        <Pressable
                          key={`history-${index}`}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setSearchQuery(item);
                            setShowSearchSuggestions(false);
                            saveSearchHistory(item);
                          }}
                          accessible={true}
                          accessibilityLabel={`Recent search: ${item}`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="time-outline" size={18} color={Colors.text.tertiary} />
                          <ThemedText style={styles.suggestionItemText}>{item}</ThemedText>
                        </Pressable>
                      ))}
                    </>
                  )}

                  {/* Search Suggestions */}
                  {searchSuggestions.length > 0 && searchQuery.trim() && (
                    <>
                      <ThemedText style={styles.suggestionsHeader}>Suggestions</ThemedText>
                      {searchSuggestions.map((suggestion, index) => (
                        <Pressable
                          key={`suggestion-${index}`}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setSearchQuery(suggestion);
                            setShowSearchSuggestions(false);
                            saveSearchHistory(suggestion);
                          }}
                          accessible={true}
                          accessibilityLabel={`Search suggestion: ${suggestion}`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="search-outline" size={18} color={Colors.text.tertiary} />
                          <ThemedText style={styles.suggestionItemText}>{suggestion}</ThemedText>
                        </Pressable>
                      ))}
                    </>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <Pressable
            style={styles.filterButton}
            onPress={() => {
              setShowFilters(true);
              analyticsService.track('filter_modal_opened', { storeId });
            }}
            accessible={true}
            accessibilityLabel="Open filters"
            accessibilityRole="button"
            accessibilityHint="Double tap to open filter options"
          >
            <Ionicons name="filter" size={20} color={Colors.text.inverse} />
            {(selectedCategory || sortBy !== 'newest' || availabilityFilter !== 'all' || minPrice || maxPrice) && (
              <View style={styles.filterBadge} />
            )}
          </Pressable>
        </View>

        {/* Active Filters Display */}
        {(selectedCategory || sortBy !== 'newest' || availabilityFilter !== 'all' || minPrice || maxPrice) && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>
              {selectedCategory && (
                <View style={styles.activeFilterTag}>
                  <ThemedText style={styles.activeFilterText}>
                    {categories.find(c => c.id === selectedCategory)?.name || 'Category'}
                  </ThemedText>
                  <Pressable onPress={() => setSelectedCategory(null)}>
                    <Ionicons name="close" size={16} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
              )}
              {sortBy !== 'newest' && (
                <View style={styles.activeFilterTag}>
                  <ThemedText style={styles.activeFilterText}>
                    Sort: {sortBy.replace('_', ' ')}
                  </ThemedText>
                  <Pressable onPress={() => setSortBy('newest')}>
                    <Ionicons name="close" size={16} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
              )}
              {availabilityFilter !== 'all' && (
                <View style={styles.activeFilterTag}>
                  <ThemedText style={styles.activeFilterText}>
                    {availabilityFilter === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                  </ThemedText>
                  <Pressable onPress={() => setAvailabilityFilter('all')}>
                    <Ionicons name="close" size={16} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
              )}
              {(minPrice || maxPrice) && (
                <View style={styles.activeFilterTag}>
                  <ThemedText style={styles.activeFilterText}>
                    {currencySymbol}{minPrice || '0'} - {currencySymbol}{maxPrice || '∞'}
                  </ThemedText>
                  <Pressable onPress={() => { setMinPrice(''); setMaxPrice(''); }}>
                    <Ionicons name="close" size={16} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
              )}
              <Pressable
                style={styles.clearAllButton}
                onPress={() => {
                  setSelectedCategory(null);
                  setSortBy('newest');
                  setAvailabilityFilter('all');
                  setMinPrice('');
                  setMaxPrice('');
                }}
              >
                <ThemedText style={styles.clearAllText}>Clear All</ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>
        {loading && products.length === 0 ? (
            // Show skeleton loader on initial load
            <View style={styles.skeletonContainer}>
              <ProductGridSkeleton count={6} columns={SCREEN_WIDTH >= 768 ? 3 : 2} />
            </View>
          ) : filteredProducts.length === 0 ? (
            renderEmpty()
          ) : (
          <FlashList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item, index) => (item as any)._id || item.id || `product-${index}`}
            numColumns={SCREEN_WIDTH >= 768 ? 3 : 2}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.nileBlue]}
                tintColor={Colors.nileBlue}
                enabled={isOnline}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            estimatedItemSize={220}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <ThemedText style={styles.modalTitle}>Filters</ThemedText>
               <Pressable 
                 onPress={() => {
                   setShowFilters(false);
                   analyticsService.track('filter_modal_closed', { storeId });
                 }}
                 accessible={true}
                 accessibilityLabel="Close filters"
                 accessibilityRole="button"
               >
                 <Ionicons name="close" size={24} color={Colors.text.primary} />
               </Pressable>
             </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <ThemedText style={styles.filterSectionTitle}>Category</ThemedText>
                {loadingCategories ? (
                  <ActivityIndicator size="small" color={Colors.nileBlue} />
                ) : (
                  <View style={styles.categoryGrid}>
                    <Pressable
                      style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(null)}
                    >
                      <ThemedText style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
                        All
                      </ThemedText>
                    </Pressable>
                    {categories.map((category) => (
                      <Pressable
                        key={category.id}
                        style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(category.id)}
                      >
                        <ThemedText style={[styles.categoryChipText, selectedCategory === category.id && styles.categoryChipTextActive]}>
                          {category.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Sort Filter */}
              <View style={styles.filterSection}>
                <ThemedText style={styles.filterSectionTitle}>Sort By</ThemedText>
                {(['newest', 'price_low', 'price_high', 'rating', 'popular'] as const).map((sort) => (
                  <Pressable
                    key={sort}
                    style={[styles.sortOption, sortBy === sort && styles.sortOptionActive]}
                    onPress={() => setSortBy(sort)}
                  >
                    <ThemedText style={[styles.sortOptionText, sortBy === sort && styles.sortOptionTextActive]}>
                      {sort === 'price_low' ? 'Price: Low to High' :
                       sort === 'price_high' ? 'Price: High to Low' :
                       sort === 'newest' ? 'Newest First' :
                       sort === 'rating' ? 'Highest Rated' :
                       'Most Popular'}
                    </ThemedText>
                    {sortBy === sort && (
                      <Ionicons name="checkmark" size={20} color={Colors.nileBlue} />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <ThemedText style={styles.filterSectionTitle}>Price Range</ThemedText>
                <View style={styles.priceRangeContainer}>
                   <View style={styles.priceInputContainer}>
                     <ThemedText style={styles.priceLabel}>Min ({currencySymbol})</ThemedText>
                     <TextInput
                       style={styles.priceInput}
                       placeholder="0"
                       value={minPrice}
                       onChangeText={(text) => {
                         // Validate and sanitize - only allow numbers
                         const sanitized = text.replace(/[^0-9]/g, '').slice(0, 10);
                         setMinPrice(sanitized);
                       }}
                       keyboardType="numeric"
                       accessible={true}
                       accessibilityLabel="Minimum price filter"
                       accessibilityHint="Enter minimum price in rupees"
                     />
                   </View>
                   <View style={styles.priceInputContainer}>
                     <ThemedText style={styles.priceLabel}>Max ({currencySymbol})</ThemedText>
                     <TextInput
                       style={styles.priceInput}
                       placeholder="∞"
                       value={maxPrice}
                       onChangeText={(text) => {
                         // Validate and sanitize - only allow numbers
                         const sanitized = text.replace(/[^0-9]/g, '').slice(0, 10);
                         setMaxPrice(sanitized);
                       }}
                       keyboardType="numeric"
                       accessible={true}
                       accessibilityLabel="Maximum price filter"
                       accessibilityHint="Enter maximum price in rupees"
                     />
                   </View>
                </View>
              </View>

              {/* Availability Filter */}
              <View style={styles.filterSection}>
                <ThemedText style={styles.filterSectionTitle}>Availability</ThemedText>
                {(['all', 'in_stock', 'out_of_stock'] as const).map((availability) => (
                  <Pressable
                    key={availability}
                    style={[styles.sortOption, availabilityFilter === availability && styles.sortOptionActive]}
                    onPress={() => setAvailabilityFilter(availability)}
                  >
                    <ThemedText style={[styles.sortOptionText, availabilityFilter === availability && styles.sortOptionTextActive]}>
                      {availability === 'all' ? 'All Products' :
                       availability === 'in_stock' ? 'In Stock Only' :
                       'Out of Stock'}
                    </ThemedText>
                    {availabilityFilter === availability && (
                      <Ionicons name="checkmark" size={20} color={Colors.nileBlue} />
                    )}
                  </Pressable>
                ))}
              </View>
            </ScrollView>

             <View style={styles.modalFooter}>
               <Pressable
                 style={styles.applyButton}
                 onPress={() => {
                   setShowFilters(false);
                   analyticsService.track('filters_applied', {
                     storeId,
                     category: selectedCategory,
                     sortBy,
                     availabilityFilter,
                     hasPriceFilter: !!(minPrice || maxPrice),
                   });
                 }}
                 accessible={true}
                 accessibilityLabel="Apply filters"
                 accessibilityRole="button"
                 accessibilityHint="Apply the selected filters to the product list"
               >
                 <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
               </Pressable>
             </View>
          </View>
        </View>
      </Modal>

      {/* Quick View Modal */}
      <Modal
        visible={showQuickView}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuickView(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quickViewContainer}>
            {quickViewProduct && (
              <>
                <View style={styles.quickViewHeader}>
                  <ThemedText style={styles.quickViewTitle} numberOfLines={1}>
                    {quickViewProduct.name}
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowQuickView(false)}
                    accessible={true}
                    accessibilityLabel="Close quick view"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={24} color={Colors.text.primary} />
                  </Pressable>
                </View>

                <ScrollView style={styles.quickViewContent} showsVerticalScrollIndicator={false}>
                  <CachedImage
                    source={quickViewProduct.image}
                    style={styles.quickViewImage}
                    contentFit="cover"
                  />
                  
                  <View style={styles.quickViewInfo}>
                    <View style={styles.quickViewPriceRow}>
                      <ThemedText style={styles.quickViewPrice}>
                        {currencySymbol}{quickViewProduct.price.current.toLocaleString()}
                      </ThemedText>
                      {quickViewProduct.price.original && quickViewProduct.price.original > quickViewProduct.price.current && (
                        <>
                          <ThemedText style={styles.quickViewOriginalPrice}>
                            {currencySymbol}{quickViewProduct.price.original.toLocaleString()}
                          </ThemedText>
                          <ThemedText style={styles.quickViewDiscount}>
                            {quickViewProduct.price.discount}% OFF
                          </ThemedText>
                        </>
                      )}
                    </View>

                    {quickViewProduct.rating && (
                      <View style={styles.quickViewRating}>
                        <Ionicons name="star" size={16} color={Colors.warning} />
                        <ThemedText style={styles.quickViewRatingText}>
                          {quickViewProduct.rating.value} ({quickViewProduct.rating.count} reviews)
                        </ThemedText>
                      </View>
                    )}

                      <ThemedText style={styles.quickViewDescription} numberOfLines={3}>
                        {quickViewProduct.description || 'No description available'}
                      </ThemedText>

                    <View style={styles.quickViewActions}>
                      <Pressable
                        style={[styles.quickViewButton, styles.quickViewButtonPrimary]}
                        onPress={() => {
                          setShowQuickView(false);
                          handleAddToCart(quickViewProduct);
                        }}
                        accessible={true}
                        accessibilityLabel="Add to cart"
                        accessibilityRole="button"
                      >
                        <Ionicons name="bag-outline" size={20} color={Colors.text.inverse} />
                        <ThemedText style={styles.quickViewButtonText}>Add to Cart</ThemedText>
                      </Pressable>

                      <Pressable
                        style={styles.quickViewButton}
                        onPress={() => {
                          setShowQuickView(false);
                          handleProductPress(quickViewProduct);
                        }}
                        accessible={true}
                        accessibilityLabel="View full details"
                        accessibilityRole="button"
                      >
                        <ThemedText style={styles.quickViewButtonTextSecondary}>View Details</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        visible={showProductDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProductDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.productDetailsContainer}>
            {selectedProductForDetails && (
              <>
                <View style={styles.productDetailsHeader}>
                  <ThemedText style={styles.productDetailsTitle}>Product Details</ThemedText>
                  <Pressable
                    onPress={() => setShowProductDetails(false)}
                    accessible={true}
                    accessibilityLabel="Close product details"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={24} color={Colors.text.primary} />
                  </Pressable>
                </View>

                <ScrollView style={styles.productDetailsContent} showsVerticalScrollIndicator={false}>
                    <CachedImage
                      source={selectedProductForDetails.image}
                      style={styles.productDetailsImage}
                      contentFit="cover"
                    />

                  <View style={styles.productDetailsInfo}>
                    <ThemedText style={styles.productDetailsName}>
                      {selectedProductForDetails.name}
                    </ThemedText>

                    <View style={styles.productDetailsPriceRow}>
                      <ThemedText style={styles.productDetailsPrice}>
                        {currencySymbol}{selectedProductForDetails.price.current.toLocaleString()}
                      </ThemedText>
                      {selectedProductForDetails.price.original && selectedProductForDetails.price.original > selectedProductForDetails.price.current && (
                        <>
                          <ThemedText style={styles.productDetailsOriginalPrice}>
                            {currencySymbol}{selectedProductForDetails.price.original.toLocaleString()}
                          </ThemedText>
                          <ThemedText style={styles.productDetailsDiscount}>
                            {selectedProductForDetails.price.discount}% OFF
                          </ThemedText>
                        </>
                      )}
                    </View>

                    {selectedProductForDetails.rating && (
                      <View style={styles.productDetailsRating}>
                        <Ionicons name="star" size={18} color={Colors.warning} />
                        <ThemedText style={styles.productDetailsRatingText}>
                          {selectedProductForDetails.rating.value} ({selectedProductForDetails.rating.count} reviews)
                        </ThemedText>
                      </View>
                    )}

                      <View style={styles.productDetailsSection}>
                        <ThemedText style={styles.productDetailsSectionTitle}>Description</ThemedText>
                        <ThemedText style={styles.productDetailsSectionText}>
                          {selectedProductForDetails.description || 'No description available'}
                        </ThemedText>
                      </View>

                    <View style={styles.productDetailsSection}>
                      <ThemedText style={styles.productDetailsSectionTitle}>Availability</ThemedText>
                      <ThemedText style={styles.productDetailsSectionText}>
                        {selectedProductForDetails.availabilityStatus === 'in_stock' ? '✅ In Stock' : '❌ Out of Stock'}
                      </ThemedText>
                    </View>

                    {selectedProductForDetails.brand && (
                      <View style={styles.productDetailsSection}>
                        <ThemedText style={styles.productDetailsSectionTitle}>Brand</ThemedText>
                        <ThemedText style={styles.productDetailsSectionText}>
                          {selectedProductForDetails.brand}
                        </ThemedText>
                      </View>
                    )}

                    {selectedProductForDetails.category && (
                      <View style={styles.productDetailsSection}>
                        <ThemedText style={styles.productDetailsSectionTitle}>Category</ThemedText>
                        <ThemedText style={styles.productDetailsSectionText}>
                          {selectedProductForDetails.category}
                        </ThemedText>
                      </View>
                    )}

                    {selectedProductForDetails.cashback && (
                      <View style={styles.productDetailsSection}>
                        <ThemedText style={styles.productDetailsSectionTitle}>Cashback</ThemedText>
                        <ThemedText style={styles.productDetailsSectionText}>
                          {selectedProductForDetails.cashback.percentage}% cashback
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.productDetailsActions}>
                      <Pressable
                        style={[styles.productDetailsButton, styles.productDetailsButtonPrimary]}
                        onPress={() => {
                          setShowProductDetails(false);
                          handleAddToCart(selectedProductForDetails);
                        }}
                        accessible={true}
                        accessibilityLabel="Add to cart"
                        accessibilityRole="button"
                      >
                        <Ionicons name="bag-outline" size={20} color={Colors.text.inverse} />
                        <ThemedText style={styles.productDetailsButtonText}>Add to Cart</ThemedText>
                      </Pressable>

                      <Pressable
                        style={styles.productDetailsButton}
                        onPress={() => {
                          setShowProductDetails(false);
                          handleProductPress(selectedProductForDetails);
                        }}
                        accessible={true}
                        accessibilityLabel="View full product page"
                        accessibilityRole="button"
                      >
                        <ThemedText style={styles.productDetailsButtonTextSecondary}>View Full Page</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
        </Modal>
      </ThemedView>
      </ErrorBoundary>
    </>
  );
}

// Performance optimization: Memoize component to prevent unnecessary re-renders
const MemoizedStoreProductsPage = React.memo(StoreProductsPage);
export default withErrorBoundary(MemoizedStoreProductsPage, 'Store Products');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerGradient: {
    paddingBottom: Spacing.base,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.strong,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.nileBlue,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  listContainer: {
    paddingBottom: 120,
    gap: Spacing.base,
  },
  row: {
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  productWrapper: {
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.background.primary,
    ...Shadows.medium,
  },
  networkBanner: {
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  networkBannerText: {
    color: Colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
  },
  skeletonContainer: {
    paddingVertical: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing['2xl'],
  },
  suggestionsContainer: {
    marginTop: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    width: '100%',
    maxWidth: 400,
  },
  suggestionsTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  retryContainer: {
    marginTop: Spacing.lg,
  },
  waitForNetworkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    backgroundColor: colors.tint.pink,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  waitForNetworkText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.nileBlue,
  },
  clearFiltersButton: {
    marginTop: Spacing.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.nileBlue,
    borderRadius: BorderRadius.sm,
  },
  clearFiltersText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerText: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  searchFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    gap: Spacing.md,
    position: 'relative',
    zIndex: 10,
  },
  searchWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.medium,
    maxHeight: 300,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionsHeader: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  suggestionItemText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.nileBlue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: Colors.error,
  },
  activeFiltersContainer: {
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingVertical: Spacing.sm,
  },
  activeFilters: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: 6,
  },
  activeFilterText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  clearAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  clearAllText: {
    ...Typography.body,
    color: Colors.nileBlue,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  categoryChipActive: {
    backgroundColor: Colors.nileBlue,
    borderColor: Colors.nileBlue,
  },
  categoryChipText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.text.inverse,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  sortOptionActive: {
    backgroundColor: colors.tint.pink,
    borderColor: Colors.nileBlue,
  },
  sortOptionText: {
    ...Typography.bodyLarge,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: Colors.nileBlue,
    fontWeight: '600',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  priceInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Typography.bodyLarge,
    color: Colors.text.primary,
  },
  modalFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  applyButton: {
    backgroundColor: Colors.nileBlue,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  // Quick Actions Overlay
  quickActionsOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'column',
    gap: Spacing.sm,
    zIndex: 10,
  },
  quickActionButton: {
    width: Spacing['2xl'],
    height: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Quick View Modal Styles
  quickViewContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  quickViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  quickViewTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.md,
  },
  quickViewContent: {
    maxHeight: '70%',
  },
  quickViewImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.background.secondary,
  },
  quickViewInfo: {
    padding: Spacing.base,
  },
  quickViewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickViewPrice: {
    ...Typography.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  quickViewOriginalPrice: {
    ...Typography.h4,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  quickViewDiscount: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.error,
    backgroundColor: colors.errorScale[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.xs,
  },
  quickViewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  quickViewRatingText: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  quickViewDescription: {
    ...Typography.body,
    color: Colors.text.tertiary,
    marginBottom: Spacing.base,
  },
  quickViewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickViewButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickViewButtonPrimary: {
    backgroundColor: Colors.nileBlue,
    borderColor: Colors.nileBlue,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickViewButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  quickViewButtonTextSecondary: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  // Product Details Modal Styles
  productDetailsContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  productDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  productDetailsTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  productDetailsContent: {
    maxHeight: '80%',
  },
  productDetailsImage: {
    width: '100%',
    height: 350,
    backgroundColor: Colors.background.secondary,
  },
  productDetailsInfo: {
    padding: Spacing.base,
  },
  productDetailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  productDetailsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  productDetailsPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  productDetailsOriginalPrice: {
    ...Typography.h3,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  productDetailsDiscount: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.error,
    backgroundColor: colors.errorScale[100],
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.xs,
  },
  productDetailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  productDetailsRatingText: {
    ...Typography.bodyLarge,
    color: Colors.text.tertiary,
  },
  productDetailsSection: {
    marginBottom: Spacing.lg,
  },
  productDetailsSectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  productDetailsSectionText: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  productDetailsActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  productDetailsButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetailsButtonPrimary: {
    backgroundColor: Colors.nileBlue,
    borderColor: Colors.nileBlue,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  productDetailsButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  productDetailsButtonTextSecondary: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

