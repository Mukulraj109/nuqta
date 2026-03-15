import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { colors } from '@/constants/theme';

function StoreProductCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create shimmer animation
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, { opacity: shimmerOpacity }]} />

      {/* Info Skeleton */}
      <View style={styles.infoContainer}>
        {/* Title Skeleton */}
        <Animated.View style={[styles.titleSkeleton, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.titleSkeletonShort, { opacity: shimmerOpacity }]} />

        {/* Rating Skeleton */}
        <Animated.View style={[styles.ratingSkeleton, { opacity: shimmerOpacity }]} />

        {/* Price Skeleton */}
        <Animated.View style={[styles.priceSkeleton, { opacity: shimmerOpacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageSkeleton: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray[200],
  },
  infoContainer: {
    padding: 12,
  },
  titleSkeleton: {
    height: 16,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginBottom: 6,
  },
  titleSkeletonShort: {
    height: 16,
    width: '70%',
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  ratingSkeleton: {
    height: 14,
    width: '40%',
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  priceSkeleton: {
    height: 18,
    width: '50%',
    backgroundColor: colors.gray[200],
    borderRadius: 4,
  },
});

export default React.memo(StoreProductCardSkeleton);
