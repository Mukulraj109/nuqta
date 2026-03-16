import { useState, useEffect, useCallback } from 'react';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useIsAuthenticated } from '@/stores/selectors';
import {
  LocationCoordinates,
  UserLocation,
  LocationHistoryEntry,
  AddressSearchResult,
  LocationAddress,
} from '@/types/location.types';

/**
 * Hook for managing location permission
 */
export function useLocationPermission() {
  const { state, requestLocationPermission } = useLocationContext();
  
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const granted = await requestLocationPermission();
      return granted;
    } finally {
      setIsRequesting(false);
    }
  }, [requestLocationPermission]);

  return {
    permissionStatus: state.permissionStatus,
    isLocationEnabled: state.isLocationEnabled,
    isRequesting,
    requestPermission,
  };
}

/**
 * Hook for getting and updating current location
 */
export function useCurrentLocation() {
  const { state, getCurrentLocation, updateLocation, setManualLocation } = useLocationContext();
  const isAuthenticated = useIsAuthenticated();

  const [isUpdating, setIsUpdating] = useState(false);

  const refreshLocation = useCallback(async () => {
    setIsUpdating(true);
    try {
      const location = await getCurrentLocation();
      return location;
    } finally {
      setIsUpdating(false);
    }
  }, [getCurrentLocation]);

  const updateUserLocation = useCallback(async (
    coordinates: LocationCoordinates,
    address?: string,
    source: 'manual' | 'gps' | 'ip' = 'manual',
    extraData?: { city?: string; state?: string; pincode?: string }
  ) => {
    setIsUpdating(true);
    try {
      if (isAuthenticated) {
        // For authenticated users, update on server
        await updateLocation(coordinates, address, source, extraData);
      } else {
        // For unauthenticated users, use local-only storage
        const userLocation: UserLocation = {
          coordinates,
          address: {
            address: address || '',
            city: extraData?.city || extractCityFromAddress(address),
            state: extraData?.state || '',
            country: 'India',
            pincode: extraData?.pincode || '',
            formattedAddress: address || '',
          },
          lastUpdated: new Date(),
          source,
        };
        await setManualLocation(userLocation);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [updateLocation, setManualLocation, isAuthenticated]);

  return {
    currentLocation: state.currentLocation,
    isLoading: state.isLoading || isUpdating,
    error: state.error,
    refreshLocation,
    updateLocation: updateUserLocation,
  };
}

/**
 * Helper function to extract city name from formatted address
 */
function extractCityFromAddress(address?: string): string {
  if (!address) return '';
  // Try to extract city from comma-separated address
  // Usually format is "Street, Area, City, State, Country"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    // Return the third-to-last part (usually city)
    return parts[parts.length - 3] || parts[0];
  }
  return parts[0] || '';
}

/**
 * Hook for location history
 */
export function useLocationHistory() {
  const { state, getLocationHistory, clearLocationHistory } = useLocationContext();
  const isAuthenticated = useIsAuthenticated();
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      return [];
    }

    setIsLoadingHistory(true);
    try {
      const history = await getLocationHistory();
      return history;
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getLocationHistory, isAuthenticated]);

  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await clearLocationHistory();
    } catch (_error) {
      // silently handle
    }
  }, [clearLocationHistory, isAuthenticated]);

  // Load history on mount
  useEffect(() => {
    if (isAuthenticated && state.locationHistory.length === 0) {
      loadHistory();
    }
  }, [isAuthenticated, loadHistory, state.locationHistory.length]);

  return {
    locationHistory: state.locationHistory,
    isLoading: isLoadingHistory,
    error: state.error,
    loadHistory,
    clearHistory,
  };
}

/**
 * Hook for address search and geocoding
 */
export function useAddressSearch() {
  const { searchAddresses, reverseGeocode, validateAddress } = useLocationContext();
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }

    setIsSearching(true);
    try {
      const results = await searchAddresses(query);
      setSearchResults(results);
      return results;
    } finally {
      setIsSearching(false);
    }
  }, [searchAddresses]);

  const geocode = useCallback(async (coordinates: LocationCoordinates) => {
    try {
      const address = await reverseGeocode(coordinates);
      return address;
    } catch (error) {
      throw error;
    }
  }, [reverseGeocode]);

  const validate = useCallback(async (address: string) => {
    setIsValidating(true);
    try {
      const isValid = await validateAddress(address);
      return isValid;
    } finally {
      setIsValidating(false);
    }
  }, [validateAddress]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    searchResults,
    isSearching,
    isValidating,
    search,
    geocode,
    validate,
    clearResults,
  };
}

/**
 * Hook for location-based features
 */
export function useLocationFeatures() {
  const { state } = useLocationContext();
  const isAuthenticated = useIsAuthenticated();
  
  const [nearbyStores, setNearbyStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  const getNearbyStores = useCallback(async (radius: number = 5, limit: number = 20) => {
    if (!state.currentLocation || !isAuthenticated) {
      return [];
    }

    setIsLoadingStores(true);
    try {
      // This would call the backend API for nearby stores
      // For now, return empty array
      setNearbyStores([]);
      return [];
    } catch (error) {
      return [];
    } finally {
      setIsLoadingStores(false);
    }
  }, [state.currentLocation, isAuthenticated]);

  const isLocationAvailable = state.currentLocation !== null;
  const locationCity = state.currentLocation?.address.city || 'Unknown';
  const locationState = state.currentLocation?.address.state || 'Unknown';

  return {
    isLocationAvailable,
    locationCity,
    locationState,
    nearbyStores,
    isLoadingStores,
    getNearbyStores,
  };
}

/**
 * Hook for location initialization
 */
export function useLocationInit() {
  const { state, requestLocationPermission, getCurrentLocation } = useLocationContext();
  const isAuthenticated = useIsAuthenticated();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStep, setInitStep] = useState<'permission' | 'location' | 'complete'>('permission');

  const initializeLocation = useCallback(async () => {
    if (!isAuthenticated) {
      return false;
    }

    setIsInitializing(true);
    setInitStep('permission');

    try {
      // Step 1: Check/request permission
      if (state.permissionStatus !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) {
          return false;
        }
      }

      setInitStep('location');

      // Step 2: Get current location
      if (!state.currentLocation) {
        await getCurrentLocation();
      }

      setInitStep('complete');
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [
    isAuthenticated,
    state.permissionStatus,
    state.currentLocation,
    requestLocationPermission,
    getCurrentLocation,
  ]);

  const isLocationReady = state.currentLocation !== null && state.permissionStatus === 'granted';

  return {
    isInitializing,
    initStep,
    isLocationReady,
    initializeLocation,
  };
}
