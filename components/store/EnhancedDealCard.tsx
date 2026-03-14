import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { DealCardProps, Deal } from '@/types/deals';
import { calculateDealDiscount } from '@/utils/deal-validation';
import DealCountdownTimer from './DealCountdownTimer';
import { useCountdown, useIsExpiringSoon } from '@/hooks/useCountdown';
import { useRegion } from '@/contexts/RegionContext';

/**
 * Enhanced Deal Card with Countdown Timer and Expiring Soon Badge
 *
 * Features:
 * - Dynamic countdown timer on each card
 * - "Expiring Soon" badge if < 24 hours
 * - Expired deals grayed out with "Expired" badge
 * - Pulse animation for deals expiring soon
 * - Disable expired deals (cannot add to cart)
 */
function EnhancedDealCard({
  deal,
  onAdd,
  onRemove,
  isAdded,
  onMoreDetails
}: DealCardProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [billPreview] = useState<number>(deal.minimumBill);
  const [showPreview, setShowPreview] = useState(false);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown hook
  const countdown = useCountdown(deal.validUntil);
  const isExpiringSoon = useIsExpiringSoon(deal.validUntil, 24);

  // Calculate screen dimensions for responsive design
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const styles = useMemo(() => createStyles(screenWidth), [screenWidth]);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update screen width on orientation change with debouncing
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        setScreenWidth(window.width);
      }, 100);
    });

    return () => {
      subscription?.remove();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Initialize card animation
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  // Pulse animation for expiring soon deals
  useEffect(() => {
    if (isExpiringSoon && !countdown.isExpired) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [isExpiringSoon, countdown.isExpired, pulseAnim]);

  // Handle card press with animation
  const handleCardPress = () => {
    if (countdown.isExpired) return; // Prevent interaction with expired deals

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onMoreDetails(deal.id);
  };

  // Handle add/remove deal
  const handleToggleDeal = () => {
    if (countdown.isExpired) return; // Prevent adding expired deals

    if (isAdded) {
      onRemove(deal.id);
    } else {
      onAdd(deal.id);
    }
  };

  // Calculate discount amount
  const discountResult = useMemo(() =>
    calculateDealDiscount(deal, billPreview),
    [deal, billPreview]
  );

  // Get deal type icon
  const getDealIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (deal.category) {
      case 'instant-discount': return 'flash';
      case 'cashback': return 'wallet';
      case 'buy-one-get-one': return 'gift';
      case 'seasonal': return 'calendar';
      case 'first-time': return 'star';
      case 'loyalty': return 'trophy';
      case 'clearance': return 'pricetag';
      default: return 'ticket';
    }
  };

  // Get badge info based on deal state
  const getBadgeInfo = (): { text: string; color: string; bgColor: string } | null => {
    if (countdown.isExpired) {
      return { text: 'Expired', color: '#6B7280', bgColor: '#F3F4F6' };
    }
    if (isExpiringSoon && countdown.totalSeconds <= 3600) { // < 1 hour
      return { text: 'Ending Soon!', color: '#DC2626', bgColor: '#FEE2E2' };
    }
    if (isExpiringSoon) { // < 24 hours
      return { text: 'Expiring Soon', color: '#D97706', bgColor: '#FEF3C7' };
    }
    if (deal.badge) {
      return {
        text: deal.badge.text,
        color: deal.badge.textColor,
        bgColor: deal.badge.backgroundColor,
      };
    }
    return null;
  };

  const badgeInfo = getBadgeInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: Animated.multiply(cardAnim, pulseAnim) }],
          opacity: countdown.isExpired ? 0.6 : 1,
        },
      ]}
    >
      <Pressable
       
        onPress={handleCardPress}
        disabled={countdown.isExpired}
        style={[
          styles.card,
          countdown.isExpired && styles.cardDisabled,
          isExpiringSoon && !countdown.isExpired && styles.cardUrgent,
        ]}
        accessibilityLabel={`${deal.title} deal card`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view deal details"
        accessibilityState={{ disabled: countdown.isExpired }}
      >
        {/* Badge */}
        {badgeInfo && (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeInfo.bgColor },
            ]}
          >
            <ThemedText
              style={[
                styles.badgeText,
                { color: badgeInfo.color },
              ]}
            >
              {badgeInfo.text}
            </ThemedText>
          </View>
        )}

        {/* Deal Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={getDealIcon()}
            size={28}
            color={countdown.isExpired ? '#9CA3AF' : '#7C3AED'}
          />
        </View>

        {/* Deal Content */}
        <View style={styles.content}>
          <ThemedText
            style={[
              styles.title,
              countdown.isExpired && styles.textDisabled,
            ]}
            numberOfLines={2}
          >
            {deal.title}
          </ThemedText>

          {deal.description && (
            <ThemedText
              style={[
                styles.description,
                countdown.isExpired && styles.textDisabled,
              ]}
              numberOfLines={1}
            >
              {deal.description}
            </ThemedText>
          )}

          {/* Discount Info */}
          <View style={styles.discountContainer}>
            <ThemedText
              style={[
                styles.discountValue,
                countdown.isExpired && styles.textDisabled,
              ]}
            >
              {deal.discountType === 'percentage'
                ? `${deal.discountValue}% OFF`
                : `${currencySymbol}${deal.discountValue} OFF`}
            </ThemedText>
            {deal.maxDiscount && (
              <ThemedText
                style={[
                  styles.maxDiscount,
                  countdown.isExpired && styles.textDisabled,
                ]}
              >
                Max: {currencySymbol}{deal.maxDiscount}
              </ThemedText>
            )}
          </View>

          {/* Minimum Bill */}
          <ThemedText
            style={[
              styles.minimumBill,
              countdown.isExpired && styles.textDisabled,
            ]}
          >
            Min. bill: {currencySymbol}{deal.minimumBill}
          </ThemedText>

          {/* Countdown Timer */}
          <View style={styles.countdownContainer}>
            <DealCountdownTimer
              expiryDate={deal.validUntil}
              size="small"
              showLabel={true}
              containerStyle={styles.countdownTimer}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={[
              styles.actionButton,
              isAdded && styles.actionButtonActive,
              countdown.isExpired && styles.actionButtonDisabled,
            ]}
            onPress={handleToggleDeal}
            disabled={countdown.isExpired}
            accessibilityLabel={isAdded ? 'Remove deal' : 'Add deal'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isAdded ? 'checkmark-circle' : 'add-circle-outline'}
              size={24}
              color={
                countdown.isExpired
                  ? '#9CA3AF'
                  : isAdded
                  ? '#10B981'
                  : '#7C3AED'
              }
            />
          </Pressable>

          <Pressable
            style={styles.moreButton}
            onPress={handleCardPress}
            disabled={countdown.isExpired}
            accessibilityLabel="View deal details"
            accessibilityRole="button"
          >
            <ThemedText
              style={[
                styles.moreButtonText,
                countdown.isExpired && styles.textDisabled,
              ]}
            >
              Details
            </ThemedText>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={countdown.isExpired ? '#9CA3AF' : '#7C3AED'}
            />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (screenWidth: number) => {
  const isSmallScreen = screenWidth < 375;
  const isTablet = screenWidth >= 768;

  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: isSmallScreen ? 12 : 16,
      padding: isSmallScreen ? 12 : 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cardDisabled: {
      backgroundColor: '#F9FAFB',
      borderColor: '#D1D5DB',
    },
    cardUrgent: {
      borderColor: '#F59E0B',
      borderWidth: 2,
    },
    badge: {
      position: 'absolute',
      top: 12,
      right: 12,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      zIndex: 10,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    iconContainer: {
      marginBottom: 12,
    },
    content: {
      gap: 8,
    },
    title: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '700',
      color: '#1F2937',
      lineHeight: isSmallScreen ? 22 : 24,
    },
    description: {
      fontSize: 13,
      color: '#6B7280',
      lineHeight: 18,
    },
    discountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    discountValue: {
      fontSize: 20,
      fontWeight: '800',
      color: '#7C3AED',
      letterSpacing: 0.3,
    },
    maxDiscount: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6B7280',
    },
    minimumBill: {
      fontSize: 13,
      fontWeight: '600',
      color: '#9CA3AF',
    },
    countdownContainer: {
      marginTop: 8,
    },
    countdownTimer: {
      alignSelf: 'flex-start',
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    actionButton: {
      padding: 8,
    },
    actionButtonActive: {
      backgroundColor: '#D1FAE5',
      borderRadius: 12,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    moreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
    },
    moreButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#7C3AED',
    },
    textDisabled: {
      color: '#9CA3AF',
    },
  });
};

export default React.memo(EnhancedDealCard);
