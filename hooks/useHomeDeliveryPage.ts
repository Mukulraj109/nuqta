import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useDebouncedCallback } from 'use-debounce';

import {
  HomeDeliveryPageState,
  HomeDeliveryFilters,
  UseHomeDeliveryPageReturn,
  HomeDeliveryProduct,
  HomeDeliveryCategory,
} from '@/types/home-delivery.types';
import productsApi from '@/services/productsApi';
import categoriesApi from '@/services/categoriesApi';

// Helper function to map backend product to HomeDeliveryProduct
const mapBackendProductToHomeDelivery = (product: any): HomeDeliveryProduct => {
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

  // Use delivery time from backend deliveryInfo
  let deliveryTime = product.deliveryInfo?.estimatedDays || product.deliveryInfo?.standardDeliveryTime;
  if (!deliveryTime && product.store?.deliveryInfo?.estimatedTime) {
    deliveryTime = product.store.deliveryInfo.estimatedTime;
  }
  if (!deliveryTime) {
    // Fallback based on category and stock
    const categoryName = product.category?.name?.toLowerCase() || '';
    if (categoryName.includes('fashion') || categoryName.includes('book')) {
      deliveryTime = '1-2 days';
    } else if (categoryName.includes('electronics') && stock > 50) {
      deliveryTime = 'Under 30min';
    } else if (stock > 20) {
      deliveryTime = '2-3 days';
    } else {
      deliveryTime = '3-5 days';
    }
  }

  // Use real cashback from backend
  const cashbackPercentage = product.cashback?.percentage || 5;
  const cashbackMaxAmount = product.cashback?.maxAmount;

  const mappedProduct = {
    id: product._id || product.id,
    name: product.name || product.title,
    brand: product.brand,
    image: (() => {
      // Try different image sources
      if (Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        // Handle both string URLs and objects with url property
        return typeof firstImage === 'string' ? firstImage : (firstImage?.url || '');
      }
      if (product.image) return product.image;
      if (product.thumbnail) return product.thumbnail;
      // Return null to trigger placeholder in UI
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
    shipping: {
      type: product.shipping?.type ||
        ((product.price?.current || product.pricing?.selling || 0) >
          (product.deliveryInfo?.freeShippingThreshold || 500) ? 'free' : 'paid'),
      cost: product.shipping?.cost ||
        ((product.price?.current || product.pricing?.selling || 0) >
          (product.deliveryInfo?.freeShippingThreshold || 500) ? 0 : 40),
      estimatedDays: deliveryTime,
      freeShippingEligible: (product.price?.current || product.pricing?.selling || 0) >
        (product.deliveryInfo?.freeShippingThreshold || 500),
    },
    rating: product.rating ? {
      value: product.rating.value || product.rating.average || 0,
      count: product.rating.count || 0,
    } : (product.ratings ? {
      value: product.ratings.average || 0,
      count: product.ratings.count || 0,
    } : undefined),
    deliveryTime,
    isNew: product.isNew || product.isNewArrival || false,
    isFeatured: product.isFeatured || product.isRecommended || false,
    isUnderDollarShipping: (product.shipping?.cost || 40) <= 50,
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
const mapBackendCategories = (categories: any[]): HomeDeliveryCategory[] => {
  // Icon mapping based on category name
  const getIconForCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // Fashion & Beauty
    if (lowerName.includes('fashion') || lowerName.includes('beauty') || lowerName.includes('clothing') || lowerName.includes('apparel')) {
      return 'shirt-outline';
    }
    
    // Food & Dining
    if (lowerName.includes('food') || lowerName.includes('dining') || lowerName.includes('restaurant') || lowerName.includes('kitchen') || lowerName.includes('grocery')) {
      return 'restaurant-outline';
    }
    
    // Entertainment
    if (lowerName.includes('entertainment') || lowerName.includes('movie') || lowerName.includes('music') || lowerName.includes('game')) {
      return 'play-circle-outline';
    }
    
    // Electronics
    if (lowerName.includes('electronic') || lowerName.includes('tech') || lowerName.includes('phone') || lowerName.includes('computer')) {
      return 'phone-portrait-outline';
    }
    
    // Books
    if (lowerName.includes('book') || lowerName.includes('education') || lowerName.includes('learning')) {
      return 'book-outline';
    }
    
    // Sports
    if (lowerName.includes('sport') || lowerName.includes('fitness') || lowerName.includes('gym')) {
      return 'basketball-outline';
    }
    
    // Home & Garden
    if (lowerName.includes('home') || lowerName.includes('garden') || lowerName.includes('furniture')) {
      return 'home-outline';
    }
    
    // Health & Beauty
    if (lowerName.includes('health') || lowerName.includes('medical') || lowerName.includes('pharmacy')) {
      return 'medical-outline';
    }
    
    // Automotive
    if (lowerName.includes('auto') || lowerName.includes('car') || lowerName.includes('vehicle')) {
      return 'car-outline';
    }
    
    // Default fallback
    return 'cube-outline';
  };

  const mapped = categories.map(cat => {
    const icon = cat.icon || getIconForCategory(cat.name);
    const backendId = cat._id || cat.id;

    return {
      id: cat.slug || cat._id || cat.id, // Use slug for frontend ID
      name: cat.name,
      icon: icon,
      productCount: cat.productCount || 0,
      isActive: false,
      backendId: backendId, // Store MongoDB ObjectID for API calls
    };
  });

  // If no categories from backend, add default categories (without backendId)
  if (mapped.length === 0) {
    const defaultCategories = [
      {
        id: 'fashion-beauty',
        name: 'Fashion & Beauty',
        icon: 'shirt-outline',
        productCount: 0,
        isActive: false,
        backendId: undefined, // No backend ID for default categories
      },
      {
        id: 'food-dining',
        name: 'Food & Dining',
        icon: 'restaurant-outline',
        productCount: 0,
        isActive: false,
        backendId: undefined,
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        icon: 'play-circle-outline',
        productCount: 0,
        isActive: false,
        backendId: undefined,
      },
      {
        id: 'grocery-essentials',
        name: 'Grocery & Essentials',
        icon: 'basket-outline',
        productCount: 0,
        isActive: false,
        backendId: undefined,
      },
    ];
    
    return [
      {
        id: 'all',
        name: 'All',
        icon: 'apps',
        productCount: 0,
        isActive: true,
        backendId: undefined,
      },
      ...defaultCategories,
    ];
  }

  // Add "All" category at the beginning
  return [
    {
      id: 'all',
      name: 'All',
      icon: 'apps',
      productCount: categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0),
      isActive: true,
      backendId: undefined, // "All" category doesn't have a backend ID
    },
    ...mapped,
  ];
};

// Initial state
const initialState: HomeDeliveryPageState = {
  categories: [],
  products: [],
  filteredProducts: [],
  sections: [],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  filters: {
    shipping: [],
    ratings: [],
    deliveryTime: [],
    priceRange: { min: 0, max: Infinity },
    brands: [],
    availability: [],
  },
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
  showSearchBar: false,
};

export function useHomeDeliveryPage(): UseHomeDeliveryPageReturn {
  const router = useRouter();
  const [state, setState] = useState<HomeDeliveryPageState>(initialState);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch categories and products in parallel
      const [categoriesResponse, productsResponse] = await Promise.all([
        categoriesApi.getCategories(),
        productsApi.getProducts({ page: 1, limit: 20 }),
      ]);

      // Map categories from backend

      const backendCategories = categoriesResponse.success && categoriesResponse.data
        ? (Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [])
        : [];
      const categories = mapBackendCategories(backendCategories);

      // Map products - handle both data structures: data[] or data.products[]
      const rawProducts = productsResponse.success && productsResponse.data
        ? (Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data.products || [])
        : [];

      const products = rawProducts.map(mapBackendProductToHomeDelivery);

      // Create sections from products
      const featuredProducts = products.filter(p => p.isFeatured);
      const newProducts = products.filter(p => p.isNew);

      const sections = [
        {
          id: 'featured',
          title: 'Featured Products',
          subtitle: 'Handpicked for you',
          products: featuredProducts.slice(0, 10),
          showViewAll: true,
          maxProducts: 10,
        },
        {
          id: 'new-arrivals',
          title: 'New Arrivals',
          subtitle: 'Latest additions',
          products: newProducts.slice(0, 10),
          showViewAll: true,
          maxProducts: 10,
        },
      ];

      const hasMore = (productsResponse.data?.pagination?.pages || 1) > 1;

      setState(prev => ({
        ...prev,
        products,
        filteredProducts: products,
        categories,
        sections,
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
            'fashion-beauty': 'fashion & beauty',
            'food-dining': 'food & dining',
            'entertainment': 'entertainment',
            'grocery-essentials': 'grocery & essentials',
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

  // Helper function to get products by category
  const getProductsByCategory = useCallback((categoryId: string) => {
    return state.products.filter(product => product.categoryId === categoryId);
  }, [state.products]);

  // Debounced API search (300ms delay for faster response)
  const debouncedApiSearch = useDebouncedCallback(
    async (query: string, activeCategory: string, categories: HomeDeliveryCategory[]) => {
      if (!query.trim() || query.trim().length < 2) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Find the actual category ID (MongoDB ObjectID) if a category is selected
        let categoryId: string | undefined = undefined;
        if (activeCategory !== 'all') {
          const selectedCategory = categories.find(cat => cat.id === activeCategory);

          // Only include category if we have a valid MongoDB ObjectID (24 hex characters)
          if (selectedCategory?.backendId && /^[0-9a-fA-F]{24}$/.test(selectedCategory.backendId)) {
            categoryId = selectedCategory.backendId;

          } else {

          }
        }

        const searchQuery = {
          q: query,
          ...(categoryId && { category: categoryId }), // Only include category if defined
          page: 1,
          limit: 20,
        };

        const response = await productsApi.searchProducts(searchQuery);

        if (response.success && response.data?.products) {
          const products = response.data.products.map(mapBackendProductToHomeDelivery);
          
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
        // Keep showing current products on error, just clear loading
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
      debouncedApiSearch(query, state.activeCategory, state.categories);
    } else if (query.trim().length === 0) {
      // Clear loading state when search is empty
      setState(prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, [debouncedApiSearch, state.activeCategory, state.categories]);

  const setSortBy = useCallback((sortBy: HomeDeliveryPageState['sortBy']) => {
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
          case 'delivery_time':
            // Sort by delivery time (Under 30min first)
            const timeOrder = { 'Under 30min': 0, '1-2 days': 1, '2-3 days': 2, '3-5 days': 3 };
            const aTime = timeOrder[a.deliveryTime as keyof typeof timeOrder] ?? 999;
            const bTime = timeOrder[b.deliveryTime as keyof typeof timeOrder] ?? 999;
            return aTime - bTime;
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

  const setFilters = useCallback((filters: HomeDeliveryFilters) => {
    setState(prev => ({ ...prev, filters }));
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
        const products = rawProducts.map(mapBackendProductToHomeDelivery);
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
        const newProducts = rawProducts.map(mapBackendProductToHomeDelivery);
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
        const products = response.data.products.map(mapBackendProductToHomeDelivery);

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

  const applyFilters = useCallback(async (filters: HomeDeliveryFilters) => {

    setState(prev => ({ ...prev, loading: true, filters }));

    try {
      // Apply filters to existing products
      let filteredProducts = state.products;
      
      // Shipping filter
      if (filters.shipping.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          filters.shipping.includes(product.shipping.type)
        );
      }
      
      // Price range filter
      if (filters.priceRange.min > 0 || filters.priceRange.max < Infinity) {
        filteredProducts = filteredProducts.filter(product => 
          product.price.current >= filters.priceRange.min && 
          product.price.current <= filters.priceRange.max
        );
      }
      
      // Ratings filter
      if (filters.ratings.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.rating && filters.ratings.some(rating => product.rating!.value >= rating)
        );
      }
      
      // Delivery time filter
      if (filters.deliveryTime.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          filters.deliveryTime.includes(product.deliveryTime)
        );
      }
      
      // Brand filter
      if (filters.brands.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.brand && filters.brands.includes(product.brand)
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
      filters: initialState.filters,
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

  const handleProductPress = useCallback((product: HomeDeliveryProduct) => {
    // Navigate to ProductPage (comprehensive product page)
    router.push({
      pathname: '/product-page',
      params: {
        cardId: product.id,
        cardType: 'product',
        cardData: JSON.stringify(product)
      }
    } as any);
  }, [router]);

  const handleSortChange = useCallback((sortBy: HomeDeliveryPageState['sortBy']) => {
    setSortBy(sortBy);
  }, [setSortBy]);

  const handleFilterChange = useCallback((filters: HomeDeliveryFilters) => {
    applyFilters(filters);
  }, [applyFilters]);

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

  return {
    state,
    actions: {
      setActiveCategory,
      setSearchQuery,
      setSortBy,
      setFilters,
      loadProducts,
      loadMoreProducts,
      searchProducts: searchProductsAction,
      refreshProducts,
      applyFilters,
      resetFilters,
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
    },
  };
}
