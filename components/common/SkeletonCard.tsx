import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  variant?: 'rectangle' | 'circle' | 'rounded';
}

/**
 * Base Skeleton Component with Shimmer Animation
 *
 * Provides a reusable skeleton loader with customizable shape and size
 * Includes smooth shimmer animation for better perceived performance
 */
function SkeletonCard({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  variant = 'rectangle',
}: SkeletonCardProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous loop animation for shimmer effect
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  // Calculate final dimensions based on variant
  const finalBorderRadius =
    variant === 'circle' ? height / 2 :
    variant === 'rounded' ? borderRadius :
    0;
  const finalWidth = variant === 'circle' ? height : width;

  return (
    <View
      style={[
        {
          width: finalWidth,
          height,
          borderRadius: finalBorderRadius,
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['#E5E7EB', '#F9FAFB', '#E5E7EB']}
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

const styles = StyleSheet.create({
  // No additional styles needed for base component
});

export default React.memo(SkeletonCard);
