import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, usePathname, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from '@/components/onboarding/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken, getUser } from '@/utils/authStorage';

export default function AppEntry() {
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();

  // Safe auth context access with fallback
  let authState;
  try {
    const { state } = useAuth();
    authState = state;
  } catch (error) {
    // If AuthProvider is not ready yet, use default state
    authState = { isLoading: true, isAuthenticated: false, user: null };
  }

  const [isChecking, setIsChecking] = useState(true);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRestoreRetryCountRef = useRef(0);
  const lastRedirectRef = useRef<{ path: string; at: number } | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const safeReplace = useCallback((targetPath: string) => {
    const now = Date.now();
    const last = lastRedirectRef.current;

    // Avoid rapid repeated redirects to the same route.
    if (last && last.path === targetPath && now - last.at < 1500) {
      return;
    }

    lastRedirectRef.current = { path: targetPath, at: now };
    router.replace(targetPath as any);
  }, [router]);

  const checkAppState = useCallback(async () => {
    try {
      setIsChecking(true);

      // Check authentication first
      if (authState.isAuthenticated && authState.user) {
        authRestoreRetryCountRef.current = 0;

        // User is authenticated, check onboarding status
        const onboardingCompletedFlag = await AsyncStorage.getItem('onboarding_completed');
        const isOnboarded = authState.user.isOnboarded || onboardingCompletedFlag === 'true';

        if (isOnboarded) {
          safeReplace('/(tabs)/');
        } else if (!pathname.includes('/onboarding/')) {
          safeReplace('/onboarding/location-permission');
        }

        setIsChecking(false);
        return;
      }

      // If we reach here, user is not authenticated.
      // Check storage briefly to avoid racing with AuthContext restoration.
      const [storedToken, storedUser] = await Promise.all([
        getAuthToken(),
        getUser(),
      ]);

      if (storedToken && storedUser && authRestoreRetryCountRef.current < 8) {
        authRestoreRetryCountRef.current += 1;
        clearPendingTimer();
        pendingTimerRef.current = setTimeout(() => {
          checkAppState();
        }, 400);
        return;
      }

      authRestoreRetryCountRef.current = 0;

      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      if (onboardingCompleted === 'true') {
        safeReplace('/sign-in');
      } else {
        safeReplace('/onboarding/splash');
      }

      setIsChecking(false);
    } catch (_error) {
      safeReplace('/onboarding/splash');
      setIsChecking(false);
    }
  }, [authState.isAuthenticated, authState.user, clearPendingTimer, pathname, safeReplace]);

  useEffect(() => {
    clearPendingTimer();

    // Wait for router to be ready before any navigation
    if (!rootNavigationState?.key) return;

    // IMPORTANT: Only run redirect logic if we're actually on the root "/" path
    // On web, page refreshes on other routes should stay on those routes
    // This prevents redirect loops when refreshing on /(tabs)/ or other pages
    const isRootPath = pathname === '/' || pathname === '';

    if (!isRootPath) {
      // User is on a specific page, don't redirect - let them stay there
      setIsChecking(false);
      return;
    }

    // Wait for auth context to initialize and react to auth changes
    if (!authState.isLoading) {
      // Check app state immediately to prevent navigation race conditions
      checkAppState();
    }
    return () => {
      clearPendingTimer();
    };
  }, [authState.isLoading, authState.isAuthenticated, authState.user, checkAppState, clearPendingTimer, pathname, rootNavigationState?.key]);

  // Only show loading screen on root path - other pages handle their own loading
  const isRootPath = pathname === '/' || pathname === '';

  if (isChecking && isRootPath) {
    return (
      <View style={styles.container}>
        <LoadingScreen duration={1000} />
      </View>
    );
  }

  // Not on root path or done checking - render nothing (let the actual page render)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
