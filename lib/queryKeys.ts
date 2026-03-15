/**
 * Centralized query key factory for TanStack Query.
 *
 * Pattern: queryKeys.domain.scope(params)
 * Each key is an array for hierarchical invalidation:
 *   queryKeys.stores.all       → invalidates ALL store queries
 *   queryKeys.stores.list({})  → invalidates only store lists with those filters
 *   queryKeys.stores.detail(id) → invalidates one store
 */

export const queryKeys = {
  // Categories
  categories: {
    all: ['categories'] as const,
    list: (filters?: Record<string, any>) => ['categories', 'list', filters] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    bySlug: (slug: string) => ['categories', 'slug', slug] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    list: (filters?: Record<string, any>) => ['reviews', 'list', filters] as const,
    byStore: (storeId: string, filters?: Record<string, any>) => ['reviews', 'store', storeId, filters] as const,
    byProduct: (productId: string) => ['reviews', 'product', productId] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
  },

  // Leaderboard
  leaderboard: {
    all: ['leaderboard'] as const,
    list: (type?: string, filters?: Record<string, any>) => ['leaderboard', 'list', type, filters] as const,
    userRank: (userId?: string) => ['leaderboard', 'rank', userId] as const,
  },

  // Explore
  explore: {
    all: ['explore'] as const,
    stats: () => ['explore', 'stats'] as const,
    nearby: (lat: number, lon: number) => ['explore', 'nearby', lat, lon] as const,
    trending: (type?: string) => ['explore', 'trending', type] as const,
    deals: (filters?: Record<string, any>) => ['explore', 'deals', filters] as const,
    featured: () => ['explore', 'featured'] as const,
  },

  // Stores
  stores: {
    all: ['stores'] as const,
    list: (filters?: Record<string, any>) => ['stores', 'list', filters] as const,
    detail: (id: string) => ['stores', 'detail', id] as const,
    search: (query: string, filters?: Record<string, any>) => ['stores', 'search', query, filters] as const,
    nearby: (lat: number, lon: number, radius?: number) => ['stores', 'nearby', lat, lon, radius] as const,
    featured: () => ['stores', 'featured'] as const,
    menu: (storeId: string) => ['stores', 'menu', storeId] as const,
    reviews: (storeId: string, filters?: Record<string, any>) => ['stores', 'reviews', storeId, filters] as const,
    products: (storeId: string, filters?: Record<string, any>) => ['stores', 'products', storeId, filters] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, any>) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    search: (query: string, filters?: Record<string, any>) => ['products', 'search', query, filters] as const,
    byCategory: (categoryId: string) => ['products', 'category', categoryId] as const,
    byStore: (storeId: string) => ['products', 'store', storeId] as const,
    featured: () => ['products', 'featured'] as const,
    recommendations: () => ['products', 'recommendations'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, any>) => ['notifications', 'list', filters] as const,
    unreadCount: () => ['notifications', 'unread'] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    current: () => ['cart', 'current'] as const,
    count: () => ['cart', 'count'] as const,
  },

  // Gamification
  gamification: {
    all: ['gamification'] as const,
    checkIn: () => ['gamification', 'checkin'] as const,
    streak: () => ['gamification', 'streak'] as const,
    achievements: (filters?: Record<string, any>) => ['gamification', 'achievements', filters] as const,
    spinWheel: () => ['gamification', 'spin'] as const,
    challenges: () => ['gamification', 'challenges'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, any>) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    tracking: (id: string) => ['orders', 'tracking', id] as const,
    counts: () => ['orders', 'counts'] as const,
  },

  // Wallet
  wallet: {
    all: ['wallet'] as const,
    balance: () => ['wallet', 'balance'] as const,
    transactions: (filters?: Record<string, any>) => ['wallet', 'transactions', filters] as const,
    transactionDetail: (id: string) => ['wallet', 'transaction', id] as const,
    summary: (period?: string) => ['wallet', 'summary', period] as const,
    expiring: () => ['wallet', 'expiring'] as const,
  },

  // Prive
  prive: {
    all: ['prive'] as const,
    eligibility: () => ['prive', 'eligibility'] as const,
    tier: () => ['prive', 'tier'] as const,
    summary: () => ['prive', 'summary'] as const,
    offers: (filters?: Record<string, any>) => ['prive', 'offers', filters] as const,
    catalog: () => ['prive', 'catalog'] as const,
    habits: () => ['prive', 'habits'] as const,
  },

  // Subscription
  subscription: {
    all: ['subscription'] as const,
    plans: () => ['subscription', 'plans'] as const,
    current: () => ['subscription', 'current'] as const,
    benefits: (tier?: string) => ['subscription', 'benefits', tier] as const,
  },
};
