import {
  SearchResults,
  StoreResult,
  ProductItem,
  AvailableFilters,
  SearchFilters,
  FILTER_CATEGORIES,
  GENDER_FILTERS
} from '@/types/store-search';
import { BRAND } from '@/constants/brand';

// Mock product data
const createMockProduct = (
  id: string,
  name: string,
  price: number,
  originalPrice?: number,
  imageUrl?: string,
  hasRezPay: boolean = true,
  category: string = 'fashion'
): ProductItem => ({
  productId: id,
  name,
  price,
  originalPrice,
  discountPercentage: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined,
  imageUrl: imageUrl || `https://picsum.photos/300/400?random=${id}`,
  imageAlt: name,
  hasRezPay,
  inStock: true,
  category,
  rating: 4.0 + Math.random(),
  reviewCount: Math.floor(Math.random() * 200) + 10,
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['White', 'Black', 'Blue'],
  tags: ['trending', 'bestseller'],
});

// Mock store data
const createMockStore = (
  id: string,
  name: string,
  rating: number,
  distance: number,
  location: string,
  products: ProductItem[]
): StoreResult => ({
  storeId: id,
  storeName: name,
  rating,
  reviewCount: Math.floor(Math.random() * 1000) + 100,
  distance,
  location,
  isOpen: Math.random() > 0.3,
  hasOnlineDelivery: Math.random() > 0.2,
  hasFreeShipping: Math.random() > 0.5,
  estimatedDelivery: '2-3 days',
  products,
  totalProductsFound: products.length + Math.floor(Math.random() * 20),
});

// Mock products for different stores
const relianceTrendsProducts = [
  createMockProduct('rt-001', 'Little Big Comfort Tee', 2199, 2999, undefined, true),
  createMockProduct('rt-002', 'Little Big Comfort Tee', 2199, 2999, undefined, true),
  createMockProduct('rt-003', 'Casual Cotton Shirt', 1899, 2499, undefined, true),
  createMockProduct('rt-004', 'Premium Formal Shirt', 2799, 3499, undefined, true),
];

const amazonProducts = [
  createMockProduct('az-001', 'Cotton Comfort Shirt', 1599, 2199, undefined, true),
  createMockProduct('az-002', 'Trendy Casual Wear', 1799, 2399, undefined, true),
  createMockProduct('az-003', 'Business Formal Shirt', 2299, 2999, undefined, false),
  createMockProduct('az-004', 'Weekend Casual Tee', 899, 1299, undefined, true),
];

const myntraProducts = [
  createMockProduct('my-001', 'Designer White Shirt', 2499, 3299, undefined, true),
  createMockProduct('my-002', 'Classic Comfort Fit', 1999, 2799, undefined, true),
  createMockProduct('my-003', 'Trendy Polo Shirt', 1599, 2199, undefined, false),
  createMockProduct('my-004', 'Premium Cotton Tee', 1299, 1799, undefined, true),
];

const flipkartProducts = [
  createMockProduct('fk-001', 'Everyday Comfort Shirt', 1399, 1999, undefined, true),
  createMockProduct('fk-002', 'Smart Casual Wear', 1799, 2399, undefined, true),
  createMockProduct('fk-003', 'Office Formal Shirt', 2199, 2899, undefined, false),
  createMockProduct('fk-004', 'Weekend Special Tee', 999, 1499, undefined, true),
];

// Mock stores
export const mockStores = [
  createMockStore('store-001', 'Reliance Trends', 4.2, 0.7, 'BTM', relianceTrendsProducts),
  createMockStore('store-002', 'Amazon', 4.2, 1.2, 'Online', amazonProducts),
  createMockStore('store-003', 'Myntra', 4.1, 1.5, 'Koramangala', myntraProducts),
  createMockStore('store-004', 'Flipkart', 4.0, 2.1, 'Electronic City', flipkartProducts),
];

// Available filters
export const mockAvailableFilters: AvailableFilters = {
  categories: [
    { id: 'fashion', label: 'Fashion', value: 'fashion', count: 45, icon: 'shirt-outline' },
    { id: 'electronics', label: 'Electronics', value: 'electronics', count: 23, icon: 'phone-portrait-outline' },
    { id: 'home', label: 'Home & Living', value: 'home', count: 12, icon: 'home-outline' },
    { id: 'beauty', label: 'Beauty', value: 'beauty', count: 8, icon: 'flower-outline' },
  ],
  genders: [
    { id: 'men', label: 'Men', value: 'men', count: 35, icon: 'male-outline' },
    { id: 'women', label: 'Women', value: 'women', count: 28, icon: 'female-outline' },
    { id: 'unisex', label: 'Unisex', value: 'unisex', count: 15, icon: 'people-outline' },
    { id: 'kids', label: 'Kids', value: 'kids', count: 10, icon: 'child-outline' },
  ],
  priceRanges: [
    { id: 'under-500', label: 'Under ₹500', min: 0, max: 500 },
    { id: '500-1000', label: '₹500 - ₹1000', min: 500, max: 1000 },
    { id: '1000-2000', label: '₹1000 - ₹2000', min: 1000, max: 2000 },
    { id: '2000-plus', label: 'Above ₹2000', min: 2000, max: 999999 },
  ],
  paymentMethods: [
    { id: 'rez-pay', label: BRAND.PAY_NAME, value: 'rez-pay', count: 67, icon: 'wallet-outline' },
    { id: 'cod', label: 'Cash on Delivery', value: 'cod', count: 45, icon: 'cash-outline' },
    { id: 'emi', label: 'EMI Available', value: 'emi', count: 32, icon: 'card-outline' },
  ],
};

// Default search filters
export const defaultSearchFilters: SearchFilters = {
  categories: [],
  gender: [],
  hasRezPay: false,
  priceRange: undefined,
  distance: undefined,
  storeStatus: [],
};

// Mock search function
export const mockSearchStores = async (
  query: string,
  filters: SearchFilters = defaultSearchFilters,
  page: number = 1
): Promise<SearchResults> => {
  // Simulate API delay (reduced for better UX)
  await new Promise(resolve => setTimeout(resolve, 300));

  // Filter stores based on query and filters
  let filteredStores = mockStores;

  // Apply text search - if no query, show all stores
  if (query.trim()) {
    filteredStores = filteredStores.map(store => ({
      ...store,
      products: store.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      ),
    })).filter(store => store.products.length > 0);
  } else {
    // Show all stores when no search query
    filteredStores = mockStores;
  }

  // Apply category filter
  if (filters.categories.length > 0) {
    filteredStores = filteredStores.map(store => ({
      ...store,
      products: store.products.filter(product =>
        filters.categories.includes(product.category)
      ),
    })).filter(store => store.products.length > 0);
  }

  // Apply Rez Pay filter
  if (filters.hasRezPay) {
    filteredStores = filteredStores.map(store => ({
      ...store,
      products: store.products.filter(product => product.hasRezPay),
    })).filter(store => store.products.length > 0);
  }

  // Calculate total results
  const totalProducts = filteredStores.reduce((sum, store) => sum + store.products.length, 0);

  return {
    query,
    totalResults: totalProducts,
    totalStores: filteredStores.length,
    stores: filteredStores,
    filters: mockAvailableFilters,
    pagination: {
      page,
      pageSize: 20,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
    suggestions: query ? [
      `${query} for men`,
      `${query} for women`,
      `${query} under ₹1000`,
      `branded ${query}`,
    ] : undefined,
  };
};

// Mock recent searches
export const mockRecentSearches = [
  'white shirt',
  'black t-shirt',
  'jeans',
  'sneakers',
  'formal wear',
];

// Mock trending searches
export const mockTrendingSearches = [
  'summer collection',
  'ethnic wear',
  'sports shoes',
  'winter jackets',
  'accessories',
];

// Utility functions
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)} Km`;
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

export const calculateDiscount = (originalPrice: number, currentPrice: number): number => {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

export const getStoreStatusText = (store: StoreResult): string => {
  if (!store.isOpen && store.hasOnlineDelivery) {
    return 'Online available';
  }
  if (store.isOpen) {
    return 'Open';
  }
  return 'Closed';
};

export const getStoreStatusColor = (store: StoreResult): string => {
  if (store.isOpen) {
    return '#10B981'; // Green
  }
  if (store.hasOnlineDelivery) {
    return '#3B82F6'; // Blue
  }
  return '#6B7280'; // Gray
};

// Export default mock data
export default {
  mockStores,
  mockAvailableFilters,
  defaultSearchFilters,
  mockSearchStores,
  mockRecentSearches,
  mockTrendingSearches,
  formatDistance,
  formatPrice,
  calculateDiscount,
  getStoreStatusText,
  getStoreStatusColor,
};