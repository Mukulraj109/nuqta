// API Configuration for REZ App
// This file centralizes all API configuration

// Import file size limits from centralized constants
// Note: Using require for compatibility with .js file
const { FILE_SIZE_LIMITS } = require('../utils/fileUploadConstants');

const isDevelopment = process.env.NODE_ENV === 'development';

// Backend API configuration
const API_CONFIG = {
  // Base URL for backend API
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api',

  // WebSocket URL for real-time features
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'ws://localhost:5001',

  // API timeout in milliseconds
  TIMEOUT: 30000,

  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Version': '1.0.0',
    'X-Platform': 'mobile'
  },

  // Rate limiting (client-side)
  RATE_LIMIT: {
    MAX_REQUESTS_PER_SECOND: 10,
    BURST_LIMIT: 20
  },

  // Endpoints configuration
  ENDPOINTS: {
    // Authentication (backend serves at /api/user/auth)
    AUTH: {
      SEND_OTP: '/user/auth/send-otp',
      VERIFY_OTP: '/user/auth/verify-otp',
      REFRESH_TOKEN: '/user/auth/refresh',
      LOGOUT: '/user/auth/logout'
    },

    // User (backend serves at /api/user/profile and /api/addresses)
    USER: {
      PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/profile',
      DELETE_ACCOUNT: '/user/profile/delete',
      ADDRESSES: '/addresses',
      PREFERENCES: '/user-settings'
    },

    // Products
    PRODUCTS: {
      LIST: '/products',
      SEARCH: '/products/search',
      DETAILS: '/products/:id',
      FEATURED: '/products/featured',
      BY_CATEGORY: '/products/category/:categoryId',
      REVIEWS: '/products/:id/reviews'
    },

    // Categories
    CATEGORIES: {
      LIST: '/categories',
      DETAILS: '/categories/:id',
      PRODUCTS: '/categories/:id/products'
    },

    // Cart
    CART: {
      GET: '/cart',
      ADD: '/cart/add',
      UPDATE: '/cart/update',
      REMOVE: '/cart/remove',
      CLEAR: '/cart/clear',
      SYNC: '/cart/sync'
    },

    // Orders
    ORDERS: {
      CREATE: '/orders',
      LIST: '/orders',
      DETAILS: '/orders/:id',
      CANCEL: '/orders/:id/cancel',
      TRACK: '/orders/:id/track',
      REORDER: '/orders/:id/reorder'
    },

    // Payments (backend serves at /api/payment)
    PAYMENTS: {
      INITIATE: '/payment/initiate',
      VERIFY: '/payment/verify',
      METHODS: '/payment-methods',
      REFUND: '/payment/refund'
    },

    // Stores
    STORES: {
      LIST: '/stores',
      DETAILS: '/stores/:id',
      NEARBY: '/stores/nearby',
      SEARCH: '/stores/search',
      REVIEWS: '/stores/:id/reviews'
    },

    // Wishlist
    WISHLIST: {
      GET: '/wishlist',
      ADD: '/wishlist/add',
      REMOVE: '/wishlist/remove',
      SHARE: '/wishlist/share'
    },

    // Vouchers
    VOUCHERS: {
      LIST: '/vouchers',
      VALIDATE: '/vouchers/validate',
      APPLY: '/vouchers/apply',
      MY_VOUCHERS: '/vouchers/my'
    },

    // Loyalty
    LOYALTY: {
      POINTS: '/loyalty/points',
      TRANSACTIONS: '/loyalty/transactions',
      REDEEM: '/loyalty/redeem',
      REWARDS: '/loyalty/rewards'
    },

    // Social
    SOCIAL: {
      FOLLOW: '/social/follow',
      UNFOLLOW: '/social/unfollow',
      FOLLOWERS: '/social/followers',
      FOLLOWING: '/social/following',
      FEED: '/social/feed',
      POST: '/social/post'
    },

    // Group Buying
    GROUP_BUYING: {
      LIST: '/group-buying',
      CREATE: '/group-buying/create',
      JOIN: '/group-buying/join',
      DETAILS: '/group-buying/:id',
      LEAVE: '/group-buying/:id/leave'
    },

    // Messages
    MESSAGES: {
      CONVERSATIONS: '/messages/conversations',
      SEND: '/messages/send',
      HISTORY: '/messages/:conversationId',
      MARK_READ: '/messages/mark-read'
    },

    // Support
    SUPPORT: {
      TICKETS: '/support/tickets',
      CREATE_TICKET: '/support/tickets/create',
      MESSAGES: '/support/tickets/:id/messages',
      FAQ: '/support/faq'
    },

    // Wallet
    WALLET: {
      BALANCE: '/wallet/balance',
      TRANSACTIONS: '/wallet/transactions',
      ADD_MONEY: '/wallet/add-money',
      TRANSFER: '/wallet/transfer'
    },

    // Notifications
    NOTIFICATIONS: {
      LIST: '/notifications',
      MARK_READ: '/notifications/mark-read',
      SETTINGS: '/notifications/settings',
      REGISTER_TOKEN: '/notifications/register-token'
    },

    // Earnings
    EARNINGS: {
      SUMMARY: '/earnings/summary',
      PROJECTS: '/earning-projects',
      HISTORY: '/earnings/history',
      WITHDRAW: '/earnings/withdraw'
    },

    // Bills
    BILLS: {
      UPLOAD: '/bills/upload',
      LIST: '/bills',
      VERIFY: '/bills/verify',
      CASHBACK: '/bills/cashback'
    },

    // Referrals (backend serves at /api/referral)
    REFERRALS: {
      INFO: '/referral/info',
      STATS: '/referral/stats',
      INVITE: '/referral/invite',
      REWARDS: '/referral/rewards'
    }
  },

  // File upload configuration
  UPLOAD: {
    MAX_FILE_SIZE: FILE_SIZE_LIMITS.MAX_DOCUMENT_SIZE, // 10MB - for documents and general uploads
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    IMAGE_QUALITY: 0.8,
    MAX_DIMENSIONS: {
      WIDTH: 2048,
      HEIGHT: 2048
    }
  }
};

// Helper functions
const ApiHelpers = {
  // Build full URL
  buildUrl: (endpoint, params = {}) => {
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;

    // Replace path parameters
    Object.keys(params).forEach(key => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, params[key]);
        delete params[key];
      }
    });

    // Add query parameters
    const queryParams = new URLSearchParams(params).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }

    return url;
  },

  // Get auth header
  getAuthHeader: (token) => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data?.message || 'Server error',
        data: error.response.data
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 0,
        message: 'Network error - Please check your connection',
        data: null
      };
    } else {
      // Error in request setup
      return {
        status: -1,
        message: error.message || 'Request failed',
        data: null
      };
    }
  },

  // Retry logic
  retryRequest: async (fn, retries = API_CONFIG.RETRY_ATTEMPTS) => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && error.code === 'ECONNABORTED') {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        return ApiHelpers.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }
};

// Export configuration
export { API_CONFIG, ApiHelpers };
export default API_CONFIG;