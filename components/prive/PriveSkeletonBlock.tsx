/**
 * Shared shimmer skeleton placeholder for Privé screens
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { PRIVE_COLORS } from './priveTheme';

interface PriveSkeletonBlockProps {
  width: number | string;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export const PriveSkeletonBlock = React.memo(({ width, height, style, borderRadius = 8 }: PriveSkeletonBlockProps) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: PRIVE_COLORS.transparent.white08,
          opacity,
        },
        style,
      ]}
    />
  );
});
