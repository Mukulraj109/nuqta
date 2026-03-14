import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

const SectionErrorBanner: React.FC<SectionErrorBannerProps> = ({
  message = 'Failed to load this section',
  onRetry,
  compact = false,
}) => {
  if (compact) {
    return (
      <Pressable
        style={styles.compactContainer}
        onPress={onRetry}
       
        disabled={!onRetry}
      >
        <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
        <Text style={styles.compactText}>{message}</Text>
        {onRetry && (
          <Text style={styles.compactRetry}>Tap to retry</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={24} color="#9CA3AF" />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={14} color="#F59E0B" />
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  compactText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
  },
  compactRetry: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default React.memo(SectionErrorBanner);
