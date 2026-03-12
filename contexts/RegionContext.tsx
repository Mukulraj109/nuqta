/**
 * Region Context
 * Manages user's region selection and provides region-aware functionality
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { setRegionGetter } from '@/services/apiClient';
import { setEventsApiRegionGetter } from '@/services/eventsApi';
import { setEventReviewApiRegionGetter } from '@/services/eventReviewApi';
import { setCategoryCurrencyGetter } from '@/contexts/CategoryContext';
// Lazy-loaded: homepageDataService imports 9+ API services + cacheService + pako
// Only the setter function is imported synchronously (no heavy deps)
let _setHomepageCurrencyGetter: any = null;
const initHomepageSetter = import('@/services/homepageDataService').then(m => {
  _setHomepageCurrencyGetter = m.setHomepageCurrencyGetter;
  return m;
});
const getHomepageDataService = async () => (await initHomepageSetter).default;

// Region types
export type RegionId = 'bangalore' | 'dubai' | 'china';

export interface RegionConfig {
  id: RegionId;
  name: string;
  displayName: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  countryCode: string;
  defaultCoordinates: {
    longitude: number;
    latitude: number;
  };
}

// State interface
interface RegionState {
  currentRegion: RegionId;
  regionConfig: RegionConfig | null;
  availableRegions: RegionConfig[];
  isLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Action types
type RegionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DETECTING'; payload: boolean }
  | { type: 'SET_REGION'; payload: { region: RegionId; config: RegionConfig } }
  | { type: 'SET_AVAILABLE_REGIONS'; payload: RegionConfig[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Constants
const REGION_STORAGE_KEY = 'user_region';
const DEFAULT_REGION: RegionId = 'dubai';

// Default configs (fallback if API fails)
const DEFAULT_CONFIGS: Record<RegionId, RegionConfig> = {
  bangalore: {
    id: 'bangalore',
    name: 'Bangalore',
    displayName: 'Bangalore, India',
    currency: 'INR',
    currencySymbol: '\u20B9',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    countryCode: 'IN',
    defaultCoordinates: { latitude: 12.9716, longitude: 77.5946 }
  },
  dubai: {
    id: 'dubai',
    name: 'Dubai',
    displayName: 'Dubai, UAE',
    currency: 'AED',
    currencySymbol: '\u062F.\u0625',
    locale: 'en-AE',
    timezone: 'Asia/Dubai',
    countryCode: 'AE',
    defaultCoordinates: { latitude: 25.2048, longitude: 55.2708 }
  },
  china: {
    id: 'china',
    name: 'China',
    displayName: 'China',
    currency: 'CNY',
    currencySymbol: '\u00A5',
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
    countryCode: 'CN',
    defaultCoordinates: { latitude: 31.2304, longitude: 121.4737 }
  }
};

// Initial state
const initialState: RegionState = {
  currentRegion: DEFAULT_REGION,
  regionConfig: DEFAULT_CONFIGS[DEFAULT_REGION],
  availableRegions: Object.values(DEFAULT_CONFIGS),
  isLoading: true,
  isDetecting: false,
  error: null,
  isInitialized: false
};

// Reducer
function regionReducer(state: RegionState, action: RegionAction): RegionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_DETECTING':
      return { ...state, isDetecting: action.payload };

    case 'SET_REGION':
      return {
        ...state,
        currentRegion: action.payload.region,
        regionConfig: action.payload.config,
        isLoading: false,
        isDetecting: false,
        error: null
      };

    case 'SET_AVAILABLE_REGIONS':
      return { ...state, availableRegions: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isDetecting: false
      };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// Context interface
interface RegionContextType {
  state: RegionState;
  setRegion: (regionId: RegionId, skipCartClear?: boolean) => Promise<void>;
  detectRegion: () => Promise<RegionId>;
  getRegionHeader: () => Record<string, string>;
  clearError: () => void;
  formatPrice: (amount: number) => string;
  getCurrency: () => string;
  getCurrencySymbol: () => string;
  getLocale: () => string;
}

// Create context
const RegionContext = createContext<RegionContextType | undefined>(undefined);

// Global region reference for API client
let currentRegionGlobal: RegionId = DEFAULT_REGION;

// Getter for API client to use
export function getCurrentRegion(): RegionId {
  return currentRegionGlobal;
}

// Cart clear callback (set by CartContext)
let onRegionChangeCallback: (() => Promise<void>) | null = null;

export function setOnRegionChangeCallback(callback: (() => Promise<void>) | null) {
  onRegionChangeCallback = callback;
}

// Provider component
interface RegionProviderProps {
  children: ReactNode;
}

export function RegionProvider({ children }: RegionProviderProps) {
  const [state, dispatch] = useReducer(regionReducer, initialState);

  // Initialize region on mount
  useEffect(() => {
    initializeRegion();
  }, []);

  // Update global reference and API client when region changes
  useEffect(() => {
    currentRegionGlobal = state.currentRegion;
    // Update API client with new region
    apiClient.setRegion(state.currentRegion);
  }, [state.currentRegion]);

  // Set up region getter for API client and events API on mount
  useEffect(() => {
    const regionGetter = () => state.currentRegion;
    const currencySymbolGetter = () => state.regionConfig?.currencySymbol || DEFAULT_CONFIGS[DEFAULT_REGION].currencySymbol;

    setRegionGetter(regionGetter);
    setEventsApiRegionGetter(regionGetter);
    setEventReviewApiRegionGetter(regionGetter);
    setCategoryCurrencyGetter(currencySymbolGetter);
    // Deferred: set homepage currency getter once module loads
    if (_setHomepageCurrencyGetter) {
      _setHomepageCurrencyGetter(currencySymbolGetter);
    } else {
      initHomepageSetter.then(() => _setHomepageCurrencyGetter?.(currencySymbolGetter));
    }

    return () => {
      setRegionGetter(null);
      setEventsApiRegionGetter(null);
      setEventReviewApiRegionGetter(null);
      setCategoryCurrencyGetter(null);
      if (_setHomepageCurrencyGetter) _setHomepageCurrencyGetter(null);
    };
  }, [state.currentRegion, state.regionConfig]);

  const initializeRegion = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Read stored region — localStorage first on web (sync, instant)
      let stored: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        stored = window.localStorage.getItem(REGION_STORAGE_KEY);
      }
      if (!stored) {
        stored = await AsyncStorage.getItem(REGION_STORAGE_KEY);
      }
      const regionId: RegionId = (stored && isValidRegion(stored)) ? stored : DEFAULT_REGION;

      const config = DEFAULT_CONFIGS[regionId];
      dispatch({
        type: 'SET_REGION',
        payload: { region: regionId, config }
      });

      // Only write to storage if it wasn't already set
      if (!stored) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(REGION_STORAGE_KEY, regionId);
        }
        AsyncStorage.setItem(REGION_STORAGE_KEY, regionId).catch(() => {});
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });

      // Fetch fresh config from server (cached — skips if fetched recently)
      fetchRegionConfigFromServer(regionId);

    } catch (error) {
      // Fallback to default
      dispatch({
        type: 'SET_REGION',
        payload: {
          region: DEFAULT_REGION,
          config: DEFAULT_CONFIGS[DEFAULT_REGION]
        }
      });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  };

  // Cache timestamps to avoid redundant API calls on every refresh
  const regionConfigFetchedAt = React.useRef<Record<string, number>>({});
  const availableRegionsFetchedAt = React.useRef(0);
  const REGION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const fetchRegionConfigFromServer = async (regionId: RegionId) => {
    const now = Date.now();
    if (now - (regionConfigFetchedAt.current[regionId] || 0) < REGION_CACHE_TTL) return;
    try {
      const response = await apiClient.get(`/location/region/${regionId}`);
      if (response.success && response.data?.region) {
        regionConfigFetchedAt.current[regionId] = now;
        const serverConfig = response.data.region as RegionConfig;
        dispatch({
          type: 'SET_REGION',
          payload: { region: regionId, config: serverConfig }
        });
      }
    } catch (error) {
      // silently handle
    }
  };

  const fetchAvailableRegions = async () => {
    const now = Date.now();
    if (now - availableRegionsFetchedAt.current < REGION_CACHE_TTL) return;
    try {
      const response = await apiClient.get('/location/regions');
      if (response.success && response.data?.regions) {
        availableRegionsFetchedAt.current = now;
        dispatch({
          type: 'SET_AVAILABLE_REGIONS',
          payload: response.data.regions
        });
      }
    } catch (error) {
      // silently handle
    }
  };

  const detectRegionInternal = async (): Promise<RegionId> => {
    try {
      dispatch({ type: 'SET_DETECTING', payload: true });

      const response = await apiClient.get('/location/region/detect');

      if (response.success && response.data?.region) {
        const { region, config } = response.data;
        dispatch({
          type: 'SET_REGION',
          payload: { region, config }
        });
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(REGION_STORAGE_KEY, region);
        }
        await AsyncStorage.setItem(REGION_STORAGE_KEY, region);
        return region;
      }

      throw new Error('Invalid response from region detection');
    } catch (error) {
      // Fallback to default
      dispatch({
        type: 'SET_REGION',
        payload: {
          region: DEFAULT_REGION,
          config: DEFAULT_CONFIGS[DEFAULT_REGION]
        }
      });
      return DEFAULT_REGION;
    } finally {
      dispatch({ type: 'SET_DETECTING', payload: false });
    }
  };

  const detectRegion = useCallback(async (): Promise<RegionId> => {
    return detectRegionInternal();
  }, []);

  const setRegion = useCallback(async (regionId: RegionId, skipCartClear = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Get config for new region
      const config = DEFAULT_CONFIGS[regionId] || null;

      if (!config) {
        throw new Error('Invalid region');
      }

      // Clear cart when switching regions (different currencies)
      if (!skipCartClear && state.currentRegion !== regionId && onRegionChangeCallback) {
        try {
          await onRegionChangeCallback();
        } catch (error) {
          // silently handle
        }
      }

      // Clear homepage cache when switching regions (data is region-specific)
      if (state.currentRegion !== regionId) {
        try {
          await (await getHomepageDataService()).clearCache();
        } catch (error) {
          // silently handle
        }

        // Cancel all in-flight requests to prevent stale data
        try {
          apiClient.cancelAllRequests();
        } catch (error) {
          // silently handle
        }
      }

      // Update apiClient FIRST before state change
      // This ensures the new region is used when homepage refetches
      apiClient.setRegion(regionId);

      // Update state and storage
      dispatch({
        type: 'SET_REGION',
        payload: { region: regionId, config }
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(REGION_STORAGE_KEY, regionId);
      }
      await AsyncStorage.setItem(REGION_STORAGE_KEY, regionId);

      // Fetch fresh config from server
      fetchRegionConfigFromServer(regionId);

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to set region' });
    }
  }, [state.currentRegion]);

  const getRegionHeader = useCallback((): Record<string, string> => {
    return { 'X-Rez-Region': state.currentRegion };
  }, [state.currentRegion]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const formatPrice = useCallback((amount: number): string => {
    const config = state.regionConfig || DEFAULT_CONFIGS[DEFAULT_REGION];

    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${config.currencySymbol}${amount.toFixed(2)}`;
    }
  }, [state.regionConfig]);

  const getCurrency = useCallback((): string => {
    return state.regionConfig?.currency || DEFAULT_CONFIGS[DEFAULT_REGION].currency;
  }, [state.regionConfig]);

  const getCurrencySymbol = useCallback((): string => {
    return state.regionConfig?.currencySymbol || DEFAULT_CONFIGS[DEFAULT_REGION].currencySymbol;
  }, [state.regionConfig]);

  const getLocale = useCallback((): string => {
    return state.regionConfig?.locale || DEFAULT_CONFIGS[DEFAULT_REGION].locale;
  }, [state.regionConfig]);

  // Fetch available regions on mount
  useEffect(() => {
    fetchAvailableRegions();
  }, []);

  const value: RegionContextType = useMemo(() => ({
    state,
    setRegion,
    detectRegion,
    getRegionHeader,
    clearError,
    formatPrice,
    getCurrency,
    getCurrencySymbol,
    getLocale
  }), [
    state,
    setRegion,
    detectRegion,
    getRegionHeader,
    clearError,
    formatPrice,
    getCurrency,
    getCurrencySymbol,
    getLocale,
  ]);

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
}

// Hook to use region context
export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

// Hook for just the current region (safe version - returns default if outside provider)
export function useCurrentRegion(): RegionId {
  const context = useContext(RegionContext);
  // Return default region if called outside provider (e.g., during initial render)
  if (!context) {
    return DEFAULT_REGION;
  }
  return context.state.currentRegion;
}

// Hook for region config
export function useRegionConfig(): RegionConfig | null {
  const { state } = useRegion();
  return state.regionConfig;
}

// Hook for currency formatting
export function useRegionCurrency() {
  const { formatPrice, getCurrency, getCurrencySymbol } = useRegion();
  return { formatPrice, currency: getCurrency(), currencySymbol: getCurrencySymbol() };
}

// Utility function
function isValidRegion(region: string): region is RegionId {
  return ['bangalore', 'dubai', 'china'].includes(region);
}

export default RegionContext;
