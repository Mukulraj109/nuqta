import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { triggerImpact, triggerNotification } from "@/utils/haptics";
import { ThemedText } from '@/components/ThemedText';
import {
  Colors,
  Spacing,
  Shadows,
  BorderRadius,
  Typography,
  IconSize,
  Timing,
  Gradients,
} from '@/constants/DesignSystem';

interface VisitStoreButtonProps {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function VisitStoreButton({
  title = "Visit store",
  onPress,
  disabled = false,
  loading = false
}: VisitStoreButtonProps) {
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 360;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || loading) return;

    // Haptic feedback
    triggerImpact('Medium');

    // Add press animation (disabled on iOS to prevent conflicts)
    if (Platform.OS === 'ios') {
      // Quick scale without animation
      scaleAnim.setValue(0.96);
      setTimeout(() => scaleAnim.setValue(1), 50);
    } else {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: Timing.fast,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: Timing.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onPress?.();
  };

  const getGradientColors = (): [string, string, ...string[]] => {
    if (disabled) return [Colors.gray[300], Colors.gray[400]];
    if (loading) return [Colors.primary[400], Colors.primary[600]];
    return Gradients.purplePrimary as [string, string, ...string[]];
  };

  return (
    <View style={[
      styles.container,
      Platform.OS === 'ios' && styles.iosContainer
    ]}>
      <Animated.View style={[
        styles.buttonWrapper,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Pressable
          onPress={handlePress}
          disabled={disabled || loading}
         
          style={styles.button}
          accessibilityLabel={loading ? "Loading" : title}
          accessibilityRole="button"
          accessibilityHint={loading ? "Please wait while loading" : "Visit the physical store location"}
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
        >
          <LinearGradient
            colors={getGradientColors()}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.buttonContent}>
              {/* Store Icon */}
              {!loading && (
                <Ionicons
                  name="storefront"
                  size={isSmallScreen ? IconSize.md : IconSize.lg}
                  color={Colors.text.white}
                  style={styles.storeIcon}
                />
              )}

              {/* Loading Spinner */}
              {loading && (
                <Animated.View style={styles.loadingSpinner}>
                  <Ionicons
                    name="refresh"
                    size={isSmallScreen ? IconSize.md : IconSize.lg}
                    color={Colors.text.white}
                  />
                </Animated.View>
              )}

              {/* Button Text */}
              <ThemedText style={[
                styles.buttonText,
                { fontSize: isSmallScreen ? 16 : 18 }
              ]}>
                {loading ? "Loading..." : title}
              </ThemedText>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
);
}

const styles = StyleSheet.create({
  // Modern Container with Safe Area
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    ...Shadows.medium,
  },
  iosContainer: {
    paddingBottom: 34, // Extra padding for iOS home indicator
  },
  buttonWrapper: {
    width: '100%',
  },

  // Modern Button with Purple Shadow
  button: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.purpleMedium,
  },
  gradientButton: {
    paddingHorizontal: Spacing['2xl'] - 8,
    paddingVertical: Spacing.base,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIcon: {
    marginRight: Spacing.md,
  },
  loadingSpinner: {
    marginRight: Spacing.md,
  },

  // Modern Typography
  buttonText: {
    color: Colors.text.white,
    ...Typography.h4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});