/**
 * Configuration Index
 * Central export for all configuration files
 */

// Environment configuration
export { 
  default as ENV,
  APP_CONFIG,
  API_CONFIG,
  ENDPOINTS,
  AUTH_CONFIG,
  EXTERNAL_SERVICES,
  FEATURE_FLAGS,
  MEDIA_CONFIG,
  DEV_CONFIG,
  BUSINESS_CONFIG,
  LOCATION_CONFIG,
  UI_CONFIG,
  CACHE_CONFIG,
  isDevelopment,
  isProduction,
  getApiUrl
} from './env';

// API client configuration
export { 
  default as apiClient,
  apiMethods,
  buildEndpoint,
  API_ENDPOINTS
} from './api';

// Export specific configurations for easy access
export const Config = {
  // Environment
  ENV,
  
  // API
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api',
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  
  // Auth
  JWT_STORAGE_KEY: process.env.EXPO_PUBLIC_JWT_STORAGE_KEY || 'rez_app_token',
  
  // Features
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  MOCK_API: process.env.EXPO_PUBLIC_MOCK_API === 'true',
  
  // External Services
  // DEPRECATED for geocoding — geocoding now uses backend proxy. Kept for native MapView rendering.
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // Business
  SUPPORT_EMAIL: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@rezapp.com',
} as const;