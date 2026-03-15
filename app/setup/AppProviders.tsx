/**
 * Full provider tree for the app.
 * Composes all eager and deferred context providers in the correct nesting order.
 */
import React, { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import analytics from '@/services/analytics/AnalyticsService';

import { ThemeProvider as NuqtaThemeProvider, useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
// OfflineQueueProvider is now deferred via DeferredOfflineQueue
import { ToastProvider } from '@/contexts/ToastContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { RegionProvider } from '@/contexts/RegionContext';
// CartProvider is now deferred via DeferredCart
import { HomeTabProvider } from '@/contexts/HomeTabContext';
import { RewardPopupProvider } from '@/contexts/RewardPopupContext';
import ToastManager from '@/components/common/ToastManager';
import { CrossPlatformAlertProvider } from '@/components/common/CrossPlatformAlert';
import LocationRegionSync from '@/components/common/LocationRegionSync';
import OfflineBanner from '@/components/common/OfflineBanner';
import { SharedSkeletonProvider } from '@/components/homepage/SharedSkeletonContext';

import {
  DeferredSocket,
  DeferredNotification,
  DeferredSecurity,
  DeferredWallet,
  DeferredGamification,
  DeferredWishlist,
  DeferredProfile,
  DeferredGreeting,
  DeferredOffers,
  DeferredAppPreferences,
  DeferredSubscription,
  DeferredCategory,
  DeferredRecommendation,
  DeferredCart,
  DeferredOfflineQueue,
} from './DeferredProviders';

const RewardPopupManager = React.lazy(() => import('@/components/gamification/RewardPopupManager'));
const BottomNavigation = React.lazy(() => import('@/components/navigation/BottomNavigation'));

interface AppProvidersProps {
  onErrorBoundaryError: (error: Error, errorInfo: React.ErrorInfo) => void;
  onQueueSyncComplete: (result: any) => void;
  onQueueSyncError: (error: Error) => void;
}

export default function AppProviders({
  onErrorBoundaryError,
  onQueueSyncComplete,
  onQueueSyncError,
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary onError={onErrorBoundaryError}>
      <NuqtaThemeProvider>
      <CrossPlatformAlertProvider>
        <ToastProvider>
            <AppProvider>
              <AuthProvider>
                <DeferredOfflineQueue
                  autoSync={true}
                  onSyncComplete={onQueueSyncComplete}
                  onSyncError={onQueueSyncError}
                >
                <DeferredWallet>
                  <DeferredSubscription>
                    <DeferredGamification>
                      <DeferredSocket>
                      <RegionProvider>
                        <LocationProvider>
                          <LocationRegionSync />
                          <DeferredGreeting>
                            <DeferredCart>
                              <DeferredOffers>
                                <DeferredCategory>
                                  <DeferredProfile>
                                    <DeferredWishlist>
                                      <DeferredNotification>
                                        <DeferredSecurity>
                                          <DeferredAppPreferences>
                                            <DeferredRecommendation>
                                              <HomeTabProvider>
                                                <RewardPopupProvider>
                                                  <SharedSkeletonProvider>
                                                  <ThemedNavigation />
                                                  </SharedSkeletonProvider>
                                                </RewardPopupProvider>
                                              </HomeTabProvider>
                                            </DeferredRecommendation>
                                          </DeferredAppPreferences>
                                        </DeferredSecurity>
                                      </DeferredNotification>
                                    </DeferredWishlist>
                                  </DeferredProfile>
                                </DeferredCategory>
                              </DeferredOffers>
                            </DeferredCart>
                          </DeferredGreeting>
                        </LocationProvider>
                      </RegionProvider>
                    </DeferredSocket>
                    </DeferredGamification>
                  </DeferredSubscription>
                </DeferredWallet>
                </DeferredOfflineQueue>
              </AuthProvider>
            </AppProvider>
        </ToastProvider>
      </CrossPlatformAlertProvider>
      </NuqtaThemeProvider>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}

/**
 * Auto screen tracker — fires analytics.trackScreen() on every route change.
 */
const ScreenTrackerInner = React.memo(function ScreenTrackerInner() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const lastTrackTime = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (
      pathname &&
      pathname !== prevPathRef.current &&
      now - lastTrackTime.current > 1000
    ) {
      prevPathRef.current = pathname;
      lastTrackTime.current = now;
      analytics.trackScreen(pathname, { route: pathname });
    }
  }, [pathname]);

  return null;
});

function ThemedNavigation() {
  const { isDark } = useTheme();

  // Initialize analytics once (fire-and-forget)
  useEffect(() => {
    analytics.initialize().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ScreenTrackerInner />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ToastManager />
      <OfflineBanner />
      <React.Suspense fallback={null}>
        <RewardPopupManager />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <BottomNavigation />
      </React.Suspense>
    </ThemeProvider>
  );
}
