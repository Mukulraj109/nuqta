/**
 * SkeletonLoader - Base skeleton component with purple-tinted shimmer animation
 *
 * Features:
 * - Smooth shimmer gradient animation (1.5s loop)
 * - Purple theme (#7C3AED) to match app branding
 * - Light/dark mode support
 * - Optimized with useNativeDriver
 * - Accessible (hidden from screen readers)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  variant?: 'rect' | 'circle' | 'text';
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  variant = 'rect',
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    // Cleanup: stop animation on unmount to prevent memory leak
    return () => {
      shimmerLoop.stop();
    };
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const finalBorderRadius = variant === 'circle' ? height / 2 : borderRadius;
  const finalWidth = variant === 'circle' ? height : width;

  // Theme-aware colors
  const backgroundColor = colorScheme === 'dark' ? '#374151' : '#E5E7EB';
  const shimmerColors = colorScheme === 'dark'
    ? ['#374151', '#4B5563', '#374151']
    : ['#E5E7EB', '#F3F4F6', '#EDE9FE', '#F3F4F6', '#E5E7EB'];

  return (
    <View
      style={[
        {
          width: finalWidth,
          height,
          borderRadius: finalBorderRadius,
          backgroundColor,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            width: 300,
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({});
