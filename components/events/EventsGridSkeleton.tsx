/**
 * EventsGridSkeleton Component
 * Loading skeleton for events grid
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 0.75;

interface EventsGridSkeletonProps {
  count?: number;
}

const SkeletonCard: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, shimmerStyle]} />

      {/* Content Skeleton */}
      <View style={styles.content}>
        {/* Title Lines */}
        <Animated.View style={[styles.titleLine1, shimmerStyle]} />
        <Animated.View style={[styles.titleLine2, shimmerStyle]} />

        {/* Date Line */}
        <Animated.View style={[styles.dateLine, shimmerStyle]} />

        {/* Price */}
        <Animated.View style={[styles.priceLine, shimmerStyle]} />
      </View>
    </View>
  );
};

const EventsGridSkeleton: React.FC<EventsGridSkeletonProps> = ({ count = 6 }) => {
  const cards = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container}>
      {cards.map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  imageSkeleton: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 10,
  },
  titleLine1: {
    height: 14,
    width: '90%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  titleLine2: {
    height: 14,
    width: '60%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  dateLine: {
    height: 12,
    width: '70%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  priceLine: {
    height: 16,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});

export default memo(EventsGridSkeleton);
