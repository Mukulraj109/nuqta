/**
 * CoinLoader — Branded spinning coin loading indicator
 * Drop-in replacement for ActivityIndicator with brand identity.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';

interface CoinLoaderProps {
  size?: number;
  message?: string;
}

function CoinLoader({ size = 48, message }: CoinLoaderProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <CachedImage
          source={BRAND.COIN_IMAGE}
          style={[styles.localAssetContainer, { width: size, height: size }]}
          contentFit="contain"
        />
      </Animated.View>
      {message ? (
        <Animated.Text style={styles.message}>{message}</Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  localAssetContainer: {
    backgroundColor: 'transparent',
  },
  message: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default React.memo(CoinLoader);
