import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

/**
 * Shared Skeleton Animation Context
 *
 * Provides a SINGLE Animated.Value for ALL skeleton shimmer effects across the app.
 * Instead of each SkeletonLoader running its own animation (20+ simultaneous animations),
 * every skeleton interpolates from this shared value (1 animation total).
 *
 * This drastically reduces the "Excessive pending callbacks" warning on Android.
 */

const SharedSkeletonContext = createContext<Animated.Value | null>(null);

export function SharedSkeletonProvider({ children }: { children: React.ReactNode }) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Static opacity on iOS to prevent conflicts with Pressable
    if (Platform.OS === 'ios') {
      shimmerValue.setValue(0.5);
      return;
    }

    let stopped = false;

    const runShimmer = () => {
      if (stopped) return;
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start((finished) => {
        if (finished && !stopped) {
          runShimmer();
        }
      });
    };

    runShimmer();

    return () => {
      stopped = true;
      shimmerValue.stopAnimation();
    };
  }, [shimmerValue]);

  return (
    <SharedSkeletonContext.Provider value={shimmerValue}>
      {children}
    </SharedSkeletonContext.Provider>
  );
}

/**
 * Hook to get the shared shimmer animation value.
 * Returns an Animated.Value cycling 0→1→0 (1s each direction).
 * Falls back to a local animation if used outside provider.
 */
export function useSharedShimmer(): Animated.Value {
  const shared = useContext(SharedSkeletonContext);
  // If no provider, create a standalone value (fallback for tests/storybook)
  const fallback = useRef<Animated.Value | null>(null);
  if (shared) return shared;

  if (!fallback.current) {
    fallback.current = new Animated.Value(0.5); // static fallback
  }
  return fallback.current;
}

export default SharedSkeletonContext;
