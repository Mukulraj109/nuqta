import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface SectionLoaderProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * SectionLoader - Reusable loading fallback for lazy-loaded sections
 *
 * Provides a consistent loading experience across all lazy-loaded components.
 * Can be customized with different sizes and colors.
 */
export default function SectionLoader({
  text = 'Loading...',
  size = 'large',
  color = '#6366F1'
}: SectionLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <ThemedText style={styles.text}>{text}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
