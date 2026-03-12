import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useDebouncedCallback } from 'use-debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  GoingOutPageState,
  GoingOutFilters,
  UseGoingOutPageReturn,
  GoingOutProduct,
  GoingOutCategory,
} from '@/types/going-out.types';
import productsApi from '@/services/productsApi';
import categoriesApi from '@/services/categoriesApi';

// Wishlist persistence functions
const WISHLIST_STORAGE_KEY = 'going_out_wishlist';

const saveWishlistToStorage = async (wishlist: string[]) => {
  try {
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));

  } catch (_error) {
    // silently handle
  }
};

const loadWishlistFromStorage = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
    if (stored) {
      const wishlist = JSON.parse(stored);

      return wishlist;
    }
  } catch (_error) {
    // silently handle
  }
  return [];
};

// Helper function to map backend product to GoingOutProduct
const mapBackendProductToGoingOut = (product: any): GoingOutProduct => {
  // Calculate availability status from backend or inventory
  const stock = product.inventory?.stock || 0;
  let availabilityStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'out_of_stock';

  // Use backend availabilityStatus if available, otherwise calculate from stock
  if (product.availabilityStatus) {
    availabilityStatus = product.availabilityStatus.replace(/-/g, '_') as 'in_stock' | 'low_stock' | 'out_of_stock';
  } else if (stock > 10) {
    availabilityStatus = 'in_stock';
  } else if (stock > 0) {
    availabilityStatus = 'low_stock';
  }

  // Use real cashback from backend
  const cashbackPercentage = product.cashback?.percentage || 5;
  const cashbackMaxAmount = product.cashback?.maxAmount;

  const mappedProduct = {
    id: product._id || product.id,
    name: product.name || product.title,
    brand: product.brand,
    image: (() => {
      // Try different possible image sources
      if (Array.isArray(product.images) && product.images.length > 0) {
        const imageUrl = product.images[0]?.url || product.images[0];

        return imageUrl;
      }
      if (product.image) {

        return product.image;
      }
      if (product.thumbnail) {

        return product.thumbnail;
      }
      if (product.media && Array.isArray(product.media) && product.media.length > 0) {
        const mediaUrl = product.media[0]?.url || product.media[0];

        return mediaUrl;
      }

      // Return null instead of placeholder to trigger fallback UI
      return null;
    })(),
    price: {
      current: product.price?.current || product.pricing?.selling || 0,
      original: product.price?.original || product.pricing?.compare,
      currency: product.price?.currency || '₹',
      discount: product.price?.discount || (product.price?.original && product.price?.current
        ? Math.round(((product.price.original - product.price.current) / product.price.original) * 100)
        : (product.pricing?.compare && product.pricing?.selling
          ? Math.round(((product.pricing.compare - product.pricing.selling) / product.pricing.compare) * 100)
          : 0)),
    },
    cashback: {
      percentage: cashbackPercentage,
      maxAmount: cashbackMaxAmount,
    },
    category: product.category?.name || product.category || 'Uncategorized',
    categoryId: product.category?._id || product.category?.id || product.categoryId || 'all',
    rating: product.rating ? {
      value: product.rating.value || product.rating.average || 0,
      count: product.rating.count || 0,
    } : (product.ratings ? {
      value: product.ratings.average || 0,
      count: product.ratings.count || 0,
    } : undefined),
    isNew: product.isNew || product.isNewArrival || false,
    isFeatured: product.isFeatured || product.isRecommended || false,
    availabilityStatus,
    tags: product.tags || [],
    description: product.description || '',
    store: {
      id: product.store?._id || product.store?.id || '',
      name: product.store?.name || 'Store',
      logo: product.store?.logo || product.store?.image,
    },
  };

  // Debug category mapping

  return mappedProduct;
};

// Helper to map backend categories
const mapBackendCategories = (categories: any[]): GoingOutCategory[] => {
  // Icon mapping based on category name
  const getIconForCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // Fashion & Beauty
    if (lowerName.includes('fashion') || lowerName.includes('beauty') || lowerName.includes('clothing') || lowerName.includes('apparel')) {
      return 'shirt-outline';
    }
    
    // Jewelry & Gold
    if (lowerName.includes('jewelry') || lowerName.includes('gold') || lowerName.includes('diamond') || lowerName.includes('ring')) {
      return 'diamond-outline';
    }
    
    // Perfume & Fragrance
    if (lowerName.includes('perfume') || lowerName.includes('fragrance') || lowerName.includes('scent')) {
      return 'flower-outline';
    }
    
    // Gifts
    if (lowerName.includes('gift') || lowerName.includes('present') || lowerName.includes('surprise')) {
      return 'gift-outline';
    }
    
    // Travel & Experiences
    if (lowerName.includes('travel') || lowerName.includes('experience') || lowerName.includes('adventure')) {
      return 'airplane-outline';
    }
    
    // Entertainment
    if (lowerName.includes('entertainment') || lowerName.includes('movie') || lowerName.includes('music') || lowerName.includes('game')) {
      return 'play-circle-outline';
    }
    
    // Default fallback
    return 'cube-outline';
  };

  const mapped = categories.map(cat => {
    const icon = cat.icon || getIconForCategory(cat.name);

    return {
      id: cat._id || cat.id,
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
      icon: icon,
      isActive: false,
      productCount: cat.productCount || 0,
    };
  });

  // If no categories from backend, add default categories
  if (mapped.length === 0) {

    const defaultCategories = [
      {
        id: 'perfume',
        name: 'Perfume',
        slug: 'perfume',
        icon: 'flower-outline',
        isActive: false,
        productCount: 0,
      },
      {
        id: 'gold',
        name: 'Gold',
        slug: 'gold',
        icon: 'diamond-outline',
        isActive: false,
        productCount: 0,
      },
      {
        id: 'gifts',
        name: 'Gifts',
        slug: 'gifts',
        icon: 'gift-outline',
        isActive: false,
        productCount: 0,
      },
      {
        id: 'travel',
        name: 'Travel',
        slug: 'travel',
        icon: 'airplane-outline',
        isActive: false,
        productCount: 0,
      },
    ];
    
    return [
      {
        id: 'all',
        name: 'All',
        slug: 'all',
        icon: 'grid-outline',
        isActive: true,
        productCount: 0,
      },
      ...defaultCategories,
    ];
  }

  // Add "All" category at the beginning
  return [
    {
      id: 'all',
      name: 'All',
      slug: 'all',
      icon: 'grid-outline',
      isActive: true,
      productCount: categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0),
    },
    ...mapped,
  ];
};

// Initial state
const initialState: GoingOutPageState = {
  categories: [],
  products: [],
  filteredProducts: [],
  cashbackHubSections: [],
  activeCategory: 'all',
  searchQuery: '',
  showSearchBar: false,
  filters: {
    priceRange: { min: 0, max: Infinity },
    cashbackRange: { min: 0, max: 100 },
    brands: [],
    ratings: [],
    availability: [],
  },
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  sortBy: 'default',
  wishlist: [],
};

export function useGoingOutPage(): UseGoingOutPageReturn {
  const router = useRouter();
  const [state, setState] = useState<GoingOutPageState>(initialState);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load wishlist from storage on component mount
  useEffect(() => {
    const loadWishlist = async () => {
      const storedWishlist = await loadWishlistFromStorage();
      if (storedWishlist.length > 0) {
        setState(prev => ({ ...prev, wishlist: storedWishlist }));
      }
    };
    loadWishlist();
  }, []);

  const loadInitialData = async () => {

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Fetch categories and products in parallel
      const [categoriesResponse, productsResponse] = await Promise.all([
        categoriesApi.getCategories({ type: 'going_out' }),
        productsApi.getProducts({ page: 1, limit: 20 }),
      ]);

      // Map categories from backend response

      const rawCategories = categoriesResponse.success && categoriesResponse.data ? categoriesResponse.data : [];
      let categories = mapBackendCategories(rawCategories);
      
      // Map products - handle both data structures: data[] or data.products[]
      const rawProducts = productsResponse.success && productsResponse.data
        ? (Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data.products || [])
        : [];

      const products = rawProducts.map(mapBackendProductToGoingOut);
      
      // Update product counts based on actual products
      categories = categories.map(cat => {
        if (cat.id === 'all') {
          return { ...cat, productCount: products.length };
        }
        const categoryProducts = products.filter((p: any) => 
          p.categoryId === cat.id || 
          p.category.toLowerCase().includes(cat.name.toLowerCase()) ||
          cat.name.toLowerCase().includes(p.category.toLowerCase())
        );
        return { ...cat, productCount: categoryProducts.length };
      });

      // Create cashback hub sections from products
      const featuredProducts = products.filter((p: any) => p.isFeatured);
      const newProducts = products.filter((p: any) => p.isNew);

      const cashbackHubSections = [
        {
          id: 'cashback_hub_featured',
          title: 'Cashback Hub',
          subtitle: 'Best deals with maximum cashback',
          products: featuredProducts.slice(0, 10),
          showViewAll: false,
        },
        {
          id: 'new_arrivals',
          title: 'New Arrivals',
          subtitle: 'Latest products just for you',
          products: newProducts.slice(0, 10),
          showViewAll: false,
        },
        {
          id: 'trending',
          title: 'Trending',
          subtitle: 'Most popular items right now',
          products: products.filter((p: any) => p.rating && p.rating.value >= 4.5).slice(0, 10),
          showViewAll: false,
        },
      ];

      const hasMore = (productsResponse.data?.pagination?.pages || 1) > 1;

      setState(prev => ({
        ...prev,
        products,
        filteredProducts: products,
        categories,
        cashbackHubSections,
        loading: false,
        error: null,
        hasMore,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load products. Please try again.',
      }));
    }
  };

  // Actions
  const setActiveCategory = useCallback((categoryId: string) => {

    setState(prev => {
      let filteredProducts = prev.products;
      
      if (categoryId === 'all') {
        // Show all products
        filteredProducts = prev.products;
      } else {
        // Filter products by category
        filteredProducts = prev.products.filter(product => {
          // Check if product category matches the selected category
          const productCategoryName = product.category?.toLowerCase() || '';
          const productCategoryId = product.categoryId || '';
          
          // Map category ID to category name for comparison
          const categoryNameMap: { [key: string]: string } = {
            'perfume': 'perfume',
            'gold': 'gold',
            'gifts': 'gifts',
            'travel': 'travel',
          };
          
          const selectedCategoryName = categoryNameMap[categoryId] || categoryId.toLowerCase();

          // Multiple matching strategies
          const matches = 
            productCategoryName.includes(selectedCategoryName) || 
            productCategoryId === categoryId ||
            product.categoryId === categoryId ||
            productCategoryName === selectedCategoryName;

          return matches;
        });
      }

      return {
        ...prev,
        activeCategory: categoryId,
        filteredProducts,
        loading: false,
      };
    });
  }, []);

  // Debounced API search (300ms delay for faster response)
  const debouncedApiSearch = useDebouncedCallback(
    async (query: string, activeCategory: string) => {
      if (!query.trim() || query.trim().length < 2) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const searchQuery = {
          q: query,
          ...(activeCategory !== 'all' && { category: activeCategory }),
          page: 1,
          limit: 20,
        };

        const response = await productsApi.searchProducts(searchQuery);

        if (response.success && response.data?.products) {
          const products = response.data.products.map(mapBackendProductToGoingOut);
          
          setState(prev => ({
            ...prev,
            filteredProducts: products,
            loading: false,
          }));

        } else {
          setState(prev => ({
            ...prev,
            loading: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
        }));
      }
    },
    300 // 300ms delay for fast response
  );

  const setSearchQuery = useCallback((query: string) => {

    // INSTANT LOCAL FILTERING - Show results immediately
    setState(prev => {
      let filteredProducts = prev.products;
      
      // Apply category filter first
      if (prev.activeCategory !== 'all') {
        const selectedCategory = prev.categories.find(c => c.id === prev.activeCategory);
        filteredProducts = prev.products.filter(p => {
          return p.categoryId === prev.activeCategory || 
                 p.category.toLowerCase().includes(selectedCategory?.name.toLowerCase() || '');
        });
      }
      
      // Apply search filter instantly for immediate feedback
      if (query.trim().length > 0) {
        const searchTerm = query.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand?.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      return {
        ...prev,
        searchQuery: query,
        filteredProducts,
        loading: query.trim().length >= 2, // Show loading indicator for API search
      };
    });

    // DEBOUNCED API SEARCH - Enhance with comprehensive backend results (300ms delay)
    if (query.trim().length >= 2) {
      debouncedApiSearch(query, state.activeCategory);
    } else if (query.trim().length === 0) {
      // Clear loading state when search is empty
      setState(prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, [debouncedApiSearch, state.activeCategory, state.categories]);

  const setSortBy = useCallback((sortBy: GoingOutPageState['sortBy']) => {
    setState(prev => {
      const sortedProducts = [...prev.filteredProducts].sort((a, b) => {
        switch (sortBy) {
          case 'price_low':
            return a.price.current - b.price.current;
          case 'price_high':
            return b.price.current - a.price.current;
          case 'cashback_high':
            return b.cashback.percentage - a.cashback.percentage;
          case 'rating':
            return (b.rating?.value || 0) - (a.rating?.value || 0);
          case 'newest':
            return a.isNew ? -1 : 1;
          default:
            return 0;
        }
      });

      return {
        ...prev,
        sortBy,
        filteredProducts: sortedProducts,
      };
    });
  }, []);

  const loadProducts = useCallback(async () => {

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const query = state.activeCategory === 'all'
        ? { page: 1, limit: 20 }
        : { page: 1, limit: 20, category: state.activeCategory };

      const response = await productsApi.getProducts(query);

      if (response.success && response.data) {
        const rawProducts = Array.isArray(response.data) ? response.data : (response.data.products || []);
        const products = rawProducts.map(mapBackendProductToGoingOut);
        const hasMore = (response.data?.pagination?.pages || 1) > 1;

      setState(prev => ({
        ...prev,
          products,
          filteredProducts: products,
        loading: false,
          hasMore,
          page: 1,
      }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load products.',
      }));
    }
  }, [state.activeCategory]);

  const loadMoreProducts = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const query = state.activeCategory === 'all'
        ? { page: state.page + 1, limit: 20 }
        : { page: state.page + 1, limit: 20, category: state.activeCategory };

      const response = await productsApi.getProducts(query);

      if (response.success && response.data) {
        const rawProducts = Array.isArray(response.data) ? response.data : (response.data.products || []);
        const newProducts = rawProducts.map(mapBackendProductToGoingOut);
        const pagination = response.data?.pagination;
        const hasMore = pagination ? pagination.current < pagination.pages : false;

      setState(prev => ({
        ...prev,
          products: [...prev.products, ...newProducts],
          filteredProducts: [...prev.filteredProducts, ...newProducts],
          hasMore,
          page: prev.page + 1,
        loading: false,
      }));

      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load more products.',
      }));
    }
  }, [state.activeCategory, state.page, state.loading, state.hasMore]);

  const searchProductsAction = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If empty, reload products
      loadProducts();
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const searchQuery = {
        q: query,
        category: state.activeCategory !== 'all' ? state.activeCategory : undefined,
        page: 1,
        limit: 20,
      };

      const response = await productsApi.searchProducts(searchQuery);

      if (response.success && response.data?.products) {
        const products = response.data.products.map(mapBackendProductToGoingOut);

      setState(prev => ({
        ...prev,
          filteredProducts: products,
        loading: false,
      }));

      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Search failed. Please try again.',
      }));
    }
  }, [state.activeCategory, loadProducts]);

  const refreshProducts = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  const applyFilters = useCallback(async (filters: GoingOutFilters) => {

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Apply filters to existing products
      let filteredProducts = state.products;
      
      // Price range filter
      if (filters.priceRange.min > 0 || filters.priceRange.max < Infinity) {
        filteredProducts = filteredProducts.filter(product => 
          product.price.current >= filters.priceRange.min && 
          product.price.current <= filters.priceRange.max
        );
      }
      
      // Cashback range filter
      if (filters.cashbackRange.min > 0 || filters.cashbackRange.max < 100) {
        filteredProducts = filteredProducts.filter(product => 
          product.cashback.percentage >= filters.cashbackRange.min && 
          product.cashback.percentage <= filters.cashbackRange.max
        );
      }
      
      // Brand filter
      if (filters.brands.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.brand && filters.brands.includes(product.brand)
        );
      }
      
      // Rating filter
      if (filters.ratings.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.rating && filters.ratings.some(rating => product.rating!.value >= rating)
        );
      }
      
      // Availability filter
      if (filters.availability.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          filters.availability.includes(product.availabilityStatus)
        );
      }

      setState(prev => ({
        ...prev,
        filteredProducts,
        loading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to apply filters.',
      }));
    }
  }, [state.products]);

  const resetFilters = useCallback(async () => {

    setState(prev => ({
      ...prev,
      filteredProducts: prev.products, // Show all loaded products
    }));
  }, []);

  // Handlers
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, [setActiveCategory]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleSearchSubmit = useCallback((query: string) => {
    searchProductsAction(query);
  }, [searchProductsAction]);

  const handleProductPress = useCallback((product: GoingOutProduct) => {

    router.push(`/product-page?cardId=${product.id}&cardType=just_for_you&category=${product.categoryId}` as any);
  }, [router]);

  const handleSortChange = useCallback((sortBy: GoingOutPageState['sortBy']) => {
    setSortBy(sortBy);
  }, [setSortBy]);

  const handleLoadMore = useCallback(() => {
    loadMoreProducts();
  }, [loadMoreProducts]);

  const handleRefresh = useCallback(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleHideSearch = useCallback(() => {
    setState(prev => ({ ...prev, showSearchBar: false }));
  }, []);

  const handleShowSearch = useCallback(() => {
    setState(prev => ({ ...prev, showSearchBar: true }));
  }, []);

  const handleFilterChange = useCallback((filters: GoingOutFilters) => {

    // Update filters in state first
    setState(prev => ({ ...prev, filters }));
    // Apply filters to products
    applyFilters(filters);
  }, [applyFilters]);

  const handleToggleWishlist = useCallback((product: GoingOutProduct) => {
    setState(prev => {
      const isInWishlist = prev.wishlist.includes(product.id);
      const newWishlist = isInWishlist
        ? prev.wishlist.filter(id => id !== product.id)
        : [...prev.wishlist, product.id];

      // Save to storage
      saveWishlistToStorage(newWishlist);
      
      return { ...prev, wishlist: newWishlist };
    });
  }, []);

  const clearWishlist = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(WISHLIST_STORAGE_KEY);
      setState(prev => ({ ...prev, wishlist: [] }));

    } catch (_error) {
      // silently handle
    }
  }, []);

  return {
    state,
    actions: {
      setActiveCategory,
      setSearchQuery,
      setSortBy,
      loadProducts,
      loadMoreProducts,
      searchProducts: async (query: string) => { debouncedApiSearch(query, state.activeCategory); },
      refreshProducts,
      applyFilters,
      resetFilters,
      clearWishlist, // Wishlist persistence action
    },
    handlers: {
      handleCategoryChange,
      handleSearchChange,
      handleSearchSubmit,
      handleProductPress,
      handleSortChange,
      handleFilterChange,
      handleLoadMore,
      handleRefresh,
      handleHideSearch,
      handleShowSearch,
      handleToggleWishlist,
    },
  };
}
