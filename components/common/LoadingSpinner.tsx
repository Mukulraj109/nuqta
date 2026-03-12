// Loading Spinner Component
// Reusable loading indicator for the profile system

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'large',
  color = '#8B5CF6',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;
  
  return (
    <View
      style={containerStyle}
      accessibilityLabel={message || "Loading"}
      accessibilityRole="progressbar"
      accessible={true}
    >
      <ActivityIndicator
        size={size}
        color={color}
        style={styles.spinner}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
      {message && (
        <ThemedText style={styles.message}>
          {message}
        </ThemedText>
      )}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});