// Coin Earned Toast
// Slide-down toast notification for coin earning events

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface CoinEarnedToastProps {
  visible: boolean;
  amount: number;
  source: string; // "Daily Check-in", "Quiz Reward", etc.
  onDismiss: () => void;
}

// ============================================
// COMPONENT
// ============================================

const CoinEarnedToast: React.FC<CoinEarnedToastProps> = ({
  visible,
  amount,
  source,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const coinScale = useRef(new Animated.Value(0.5)).current;
  const coinRotate = useRef(new Animated.Value(0)).current;
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset values
      translateY.setValue(-120);
      opacity.setValue(0);
      coinScale.setValue(0.5);
      coinRotate.setValue(0);

      // Slide down + fade in
      const anim = Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(coinScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(coinRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
      anim.start();

      // Auto-dismiss after 3 seconds
      autoDismissTimer.current = setTimeout(() => {
        dismissToast();
      }, 3000);

      return () => {
        anim.stop();
        if (autoDismissTimer.current) {
          clearTimeout(autoDismissTimer.current);
        }
      };
    }
  }, [visible]);

  const dismissToast = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateY, opacity]);

  const handlePress = useCallback(() => {
    dismissToast();
  }, [dismissToast]);

  if (!visible && !opacity.__getValue()) return null;

  const spinInterpolation = coinRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable
        style={styles.toast}
        onPress={handlePress}
       
        accessibilityLabel={`Earned ${amount} coins from ${source}`}
        accessibilityRole="alert"
      >
        {/* Left accent */}
        <View style={styles.accentBar} />

        {/* Coin Icon */}
        <Animated.View
          style={[
            styles.coinIconContainer,
            {
              transform: [
                { scale: coinScale },
                { rotateY: spinInterpolation },
              ],
            },
          ]}
        >
          <Ionicons name="diamond" size={24} color={colors.brand.goldBright} />
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.amountRow}>
            <Text style={styles.plusSign}>+</Text>
            <Text style={styles.amountText}>{amount}</Text>
            <Text style={styles.coinsLabel}>coins</Text>
          </View>
          <Text style={styles.sourceText} numberOfLines={1}>
            {source}
          </Text>
        </View>

        {/* Dismiss indicator */}
        <View style={styles.dismissHint}>
          <Ionicons name="close" size={16} color={colors.neutral[400]} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.3)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.brand.goldBright,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  coinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.warningScale[200],
  },
  content: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  plusSign: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brand.greenDark,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.nileBlue,
  },
  coinsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
    marginLeft: 4,
  },
  sourceText: {
    fontSize: 12,
    color: colors.neutral[400],
    fontWeight: '500',
    marginTop: 1,
  },
  dismissHint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default React.memo(CoinEarnedToast);
