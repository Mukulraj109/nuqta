import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export interface ReportToastProps {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

/**
 * ReportToast Component
 *
 * Displays a toast notification for report submission feedback
 * - Success: Green toast with checkmark icon
 * - Error: Red toast with error icon
 * - Auto-dismisses after 3 seconds
 * - Slides in from top with fade animation
 * - Can be manually dismissed by tapping close button
 *
 * @example
 * <ReportToast
 *   visible={toastVisible}
 *   type="success"
 *   message="Thank you for your report. We'll review it shortly."
 *   onDismiss={() => setToastVisible(false)}
 * />
 */
function ReportToast({
  visible,
  type,
  message,
  onDismiss,
}: ReportToastProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset animation values when not visible
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getIconName = () => {
    return type === 'success' ? 'checkmark-circle' : 'close-circle';
  };

  const getBackgroundColor = () => {
    return type === 'success' ? colors.success : colors.error;
  };

  const getIconColor = () => {
    return colors.text.white;
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Report ${type}: ${message}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Ionicons
          name={getIconName()}
          size={24}
          color={getIconColor()}
          style={styles.icon}
          accessible={false}
        />
        <Text
          style={styles.message}
          numberOfLines={2}
          accessible={true}
          accessibilityRole="text"
        >
          {message}
        </Text>
        <Pressable
          onPress={dismiss}
          style={styles.closeButton}
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
          accessibilityHint="Double tap to close this report notification"
        >
          <Ionicons name="close" size={20} color={colors.background.primary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: colors.background.primary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default React.memo(ReportToast);
