import { useCallback } from 'react';
import { storeSearchService } from '@/services/storeSearchService';
import { useLocation } from '@/contexts/LocationContext';

interface AnalyticsEventData {
  searchQuery?: string;
  category?: string;
  source?: string;
  location?: {
    coordinates: [number, number];
    address?: string;
  };
  metadata?: any;
}

export const useAnalytics = () => {
  const { state } = useLocation();
  const { currentLocation } = state;

  const trackEvent = useCallback(async (
    storeId: string,
    eventType: 'view' | 'search' | 'favorite' | 'unfavorite' | 'compare' | 'review' | 'click' | 'share',
    eventData?: AnalyticsEventData
  ) => {
    try {
      // Add location data if available
      const enrichedEventData = {
        ...eventData,
        location: currentLocation ? {
          coordinates: [currentLocation.coordinates.longitude, currentLocation.coordinates.latitude] as [number, number],
          address: currentLocation.address
        } : undefined
      };

      await storeSearchService.trackEvent({
        storeId,
        eventType,
        eventData: enrichedEventData
      });
    } catch (error) {
      // Don't throw error to avoid breaking user experience
    }
  }, [currentLocation]);

  const trackStoreView = useCallback((storeId: string, source: string = 'unknown') => {
    trackEvent(storeId, 'view', { source });
  }, [trackEvent]);

  const trackStoreSearch = useCallback((searchQuery: string, category?: string) => {
    // For search events, we don't have a specific store ID
    // We'll track this as a general search event
    trackEvent('', 'search', { searchQuery, category, source: 'search' });
  }, [trackEvent]);

  const trackStoreFavorite = useCallback((storeId: string, isFavorited: boolean) => {
    trackEvent(storeId, isFavorited ? 'favorite' : 'unfavorite', { source: 'favorites' });
  }, [trackEvent]);

  const trackStoreCompare = useCallback((storeId: string, action: 'add' | 'remove') => {
    trackEvent(storeId, 'compare', { 
      source: 'comparison',
      metadata: { action }
    });
  }, [trackEvent]);

  const trackStoreReview = useCallback((storeId: string, action: 'view' | 'create' | 'helpful') => {
    trackEvent(storeId, 'review', { 
      source: 'reviews',
      metadata: { action }
    });
  }, [trackEvent]);

  const trackStoreClick = useCallback((storeId: string, source: string, metadata?: any) => {
    trackEvent(storeId, 'click', { source, metadata });
  }, [trackEvent]);

  const trackStoreShare = useCallback((storeId: string, platform: string) => {
    trackEvent(storeId, 'share', { 
      source: 'share',
      metadata: { platform }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackStoreView,
    trackStoreSearch,
    trackStoreFavorite,
    trackStoreCompare,
    trackStoreReview,
    trackStoreClick,
    trackStoreShare
  };
};

export default useAnalytics;
