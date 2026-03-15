/**
 * AccessibleButton Component
 *
 * Fully accessible button component with:
 * - Screen reader support
 * - Minimum touch target size (44x44)
 * - Proper ARIA labels and hints
 * - Loading states
 * - Disabled states
 * - Haptic feedback
 *
 * Follows WCAG 2.1 AA guidelines
 */

import React from 'react';
import {
  Pressable,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import {
  A11yRole,
  MIN_TOUCH_TARGET_SIZE,
  generateA11yLabel,
  announceForAccessibility,
} from '@/utils/accessibilityUtils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface AccessibleButtonProps {
  /**
   * Button text label
   */
  label: string;

  /**
   * Action to perform on press
   */
  onPress: () => void | Promise<void>;

  /**
   * Button variant style
   */
  variant?: ButtonVariant;

  /**
   * Button size
   */
  size?: ButtonSize;

  /**
   * Whether button is disabled
   */
  disabled?: boolean;

  /**
   * Whether button is in loading state
   */
  loading?: boolean;

  /**
   * Icon to show before label
   */
  icon?: keyof typeof Ionicons.glyphMap;

  /**
   * Icon to show after label
   */
  iconRight?: keyof typeof Ionicons.glyphMap;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Accessibility hint (what happens when pressed)
   */
  accessibilityHint?: string;

  /**
   * Message to announce on press (for screen readers)
   */
  announceOnPress?: string;

  /**
   * Custom container style
   */
  style?: ViewStyle;

  /**
   * Custom text style
   */
  textStyle?: TextStyle;

  /**
   * Test ID for testing
   */
  testID?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  accessibilityHint,
  announceOnPress,
  style,
  textStyle,
  testID,
}) => {
  /**
   * Handle button press with accessibility announcement
   */
  const handlePress = async () => {
    if (disabled || loading) return;

    // Haptic feedback on iOS/Android
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const { HapticFeedback } = require('expo-haptics');
      HapticFeedback?.impactAsync?.(HapticFeedback?.ImpactFeedbackStyle?.Light);
    }

    // Announce action for screen readers
    if (announceOnPress) {
      announceForAccessibility(announceOnPress);
    }

    // Execute onPress
    await onPress();
  };

  /**
   * Get button container styles
   */
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[`${variant}Button`],
      ...styles[`${size}Button`],
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    if (loading) {
      baseStyle.opacity = 0.7;
    }

    return baseStyle;
  };

  /**
   * Get text styles
   */
  const getTextStyle = (): TextStyle => {
    return {
      ...styles[`${variant}Text`],
      ...styles[`${size}Text`],
    };
  };

  /**
   * Get icon size based on button size
   */
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  /**
   * Get icon color based on variant
   */
  const getIconColor = (): string => {
    const colorMap: Record<ButtonVariant, string> = {
      primary: colors.text.white,
      secondary: colors.text.white,
      outline: '#9333EA',
      ghost: '#9333EA',
      danger: colors.text.white,
    };

    return colorMap[variant];
  };

  /**
   * Generate accessibility label
   */
  const a11yLabel = generateA11yLabel({
    label,
    hint: accessibilityHint,
    role: A11yRole.BUTTON,
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
     
      // Accessibility props
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      // Test ID
      testID={testID}
    >
      <View style={styles.content}>
        {/* Loading indicator */}
        {loading && (
          <ActivityIndicator
            size="small"
            color={getIconColor()}
            style={styles.loadingIndicator}
          />
        )}

        {/* Left icon */}
        {!loading && icon && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getIconColor()}
            style={styles.iconLeft}
          />
        )}

        {/* Button label */}
        <ThemedText style={[getTextStyle(), textStyle]}>{label}</ThemedText>

        {/* Right icon */}
        {!loading && iconRight && (
          <Ionicons
            name={iconRight}
            size={getIconSize()}
            color={getIconColor()}
            style={styles.iconRight}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minWidth: MIN_TOUCH_TARGET_SIZE,
    minHeight: MIN_TOUCH_TARGET_SIZE,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Variant styles
  primaryButton: {
    backgroundColor: '#9333EA',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Text variant styles
  primaryText: {
    color: colors.text.white,
    fontWeight: '600',
  },
  secondaryText: {
    color: colors.text.white,
    fontWeight: '600',
  },
  outlineText: {
    color: '#9333EA',
    fontWeight: '600',
  },
  ghostText: {
    color: '#9333EA',
    fontWeight: '600',
  },
  dangerText: {
    color: colors.text.white,
    fontWeight: '600',
  },

  // Size styles
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  // Text size styles
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Icon styles
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default React.memo(AccessibleButton);
