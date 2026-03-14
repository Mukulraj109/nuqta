import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ProductsErrorStateProps {
  message?: string;
  onRetry: () => void;
}

function ProductsErrorState({
  message = 'Unable to load products',
  onRetry,
}: ProductsErrorStateProps) {
  return (
    <View style={styles.container}>
      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>

      {/* Error Message */}
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>

      {/* Retry Button */}
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
       
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(ProductsErrorState);
