/**
 * Analytics View Component
 *
 * Tracks when component becomes visible using Intersection Observer
 */

import React, { useRef, useEffect, ReactNode } from 'react';
import { View, ViewProps } from 'react-native';
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics';

interface AnalyticsViewProps extends ViewProps {
  children: ReactNode;
  eventName: string;
  eventProperties?: Record<string, any>;
  trackOnMount?: boolean;
  trackOnView?: boolean;
  viewThreshold?: number; // Percentage visible to trigger tracking (0-1)
  viewDuration?: number; // Milliseconds visible before tracking
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  children,
  eventName,
  eventProperties = {},
  trackOnMount = false,
  trackOnView = true,
  viewThreshold = 0.5,
  viewDuration = 1000,
  ...viewProps
}) => {
  const { trackEvent } = useComprehensiveAnalytics();
  const hasTracked = useRef(false);
  const viewTimer = useRef<NodeJS.Timeout | null>(null);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (trackOnMount && !hasTracked.current) {
      trackEvent(eventName, {
        ...eventProperties,
        trigger: 'mount',
      });
      hasTracked.current = true;
    }
  }, [trackOnMount, eventName, eventProperties, trackEvent]);

  // Note: React Native doesn't have IntersectionObserver
  // For actual visibility tracking, you would need to use:
  // 1. react-native-intersection-observer
  // 2. @react-native-community/viewability-helper
  // 3. FlatList's onViewableItemsChanged
  // For now, we'll track on mount if trackOnView is true

  useEffect(() => {
    if (trackOnView && !trackOnMount && !hasTracked.current) {
      viewTimer.current = setTimeout(() => {
        trackEvent(eventName, {
          ...eventProperties,
          trigger: 'view',
        });
        hasTracked.current = true;
      }, viewDuration);
    }

    return () => {
      if (viewTimer.current) {
        clearTimeout(viewTimer.current);
      }
    };
  }, [trackOnView, trackOnMount, viewDuration, eventName, eventProperties, trackEvent]);

  return (
    <View ref={viewRef} {...viewProps}>
      {children}
    </View>
  );
};

export default AnalyticsView;
