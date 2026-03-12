import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A simple animated skeleton shimmer component.
 * Pulses opacity from 0.3 to 0.7 on a light gray background.
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * A card-sized skeleton placeholder.
 * Full width, 80px height, 12px border radius.
 */
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <SkeletonBox width="100%" height={80} borderRadius={12} style={style} />
);

/**
 * A game grid item skeleton placeholder.
 * Half width (handled by parent), 120px height.
 */
export const SkeletonGameCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <SkeletonBox width="100%" height={120} borderRadius={16} style={style} />
);

/**
 * A creator card skeleton placeholder.
 * 100px width, 120px height.
 */
export const SkeletonCreatorCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <SkeletonBox width={100} height={120} borderRadius={12} style={style} />
);
