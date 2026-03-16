/**
 * App-level error boundary — catches unhandled errors at the Expo Router level.
 * Prevents white screen crashes; gives users a recovery path.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

export default function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={40} color="#EF4444" />
      </View>

      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        We hit an unexpected error. Please try again or restart the app.
      </Text>

      {__DEV__ && (
        <Text style={styles.debug}>{error.message}</Text>
      )}

      <Pressable style={styles.retryButton} onPress={retry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>

      <Pressable
        style={styles.homeButton}
        onPress={() => {
          try { router.replace('/'); } catch { retry(); }
        }}
      >
        <Text style={styles.homeText}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 300,
  },
  debug: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  homeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  homeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
});
