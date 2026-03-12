/**
 * ErrorState Component
 *
 * Enhanced error display component with design tokens integration.
 * Provides a consistent UX for error handling across the app.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';

interface ErrorStateProps {
  /**
   * Error object or error message string
   */
  error: Error | string;

  /**
   * Callback function when retry button is pressed
   */
  onRetry?: () => void;

  /**
   * Optional custom title (defaults to "Oops! Something went wrong")
   */
  title?: string;

  /**
   * Optional custom styles
   */
  style?: any;
}

/**
 * ErrorState displays error information with an optional retry action
 *
 * @example
 * <ErrorState
 *   error={error}
 *   onRetry={() => refetchData()}
 *   title="Failed to Load Store"
 * />
 */
export default function ErrorState({
  error,
  onRetry,
  title = 'Oops! Something went wrong',
  style,
}: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${title}. ${errorMessage}`}
      accessibilityLiveRegion="polite"
    >
      <Text
        style={styles.icon}
        accessible={false}
        aria-hidden={true}
      >
        ⚠️
      </Text>

      <Text
        style={styles.title}
        accessible={true}
        accessibilityRole="header"
      >
        {title}
      </Text>

      <Text
        style={styles.message}
        accessible={true}
        accessibilityRole="text"
      >
        {errorMessage}
      </Text>

      {onRetry && (
        <Pressable
          style={styles.button}
          onPress={onRetry}
         
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Try Again"
          accessibilityHint="Double tap to retry the failed action"
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.background.secondary,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.error[500],
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    maxWidth: 320,
  },
  button: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.error[500],
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
  },
});
