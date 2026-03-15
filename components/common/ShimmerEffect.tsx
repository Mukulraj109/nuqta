// Shimmer loading effect component
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

interface ShimmerEffectProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  shimmerColors?: string[];
  duration?: number;
}

function ShimmerEffect({
  width = '100%',
  height = 20,
  style,
  shimmerColors = [colors.gray[200], colors.gray[100], colors.gray[200]],
  duration = 1500,
}: ShimmerEffectProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
      animatedValue.setValue(0);
    };
  }, [animatedValue, duration]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <View
      style={[styles.container, { width: width as any, height: height as any }, style]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
    >
      <View style={[styles.shimmerContainer, { width: width as any, height: height as any }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'relative',
  },
  shimmer: {
    width: '30%',
    height: '100%',
    backgroundColor: colors.background.primary,
    opacity: 0.7,
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 8,
  },
});

export default React.memo(ShimmerEffect);
