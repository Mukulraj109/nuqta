/**
 * Screen Tracking Hook
 *
 * Automatically tracks screen views using React Navigation
 */

import { useEffect, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { analytics } from '@/services/analytics/AnalyticsService';

export const useScreenTracking = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const screenStartTime = useRef<number>(Date.now());
  const currentScreen = useRef<string>(route.name);

  useEffect(() => {
    // Track screen view
    const screenName = route.name;
    const params = route.params || {};

    analytics.trackScreen(screenName, {
      params,
      previous_screen: currentScreen.current,
    });

    screenStartTime.current = Date.now();
    currentScreen.current = screenName;

    // Track screen exit on unmount
    return () => {
      const timeSpent = Date.now() - screenStartTime.current;

      analytics.trackEvent('screen_exited', {
        screen_name: screenName,
        time_spent: timeSpent,
        time_spent_seconds: Math.floor(timeSpent / 1000),
      });
    };
  }, [route.name, route.params]);

  return {
    screenName: route.name,
    params: route.params,
  };
};

export default useScreenTracking;
