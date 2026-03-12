import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '@/components/common/CrossPlatformAlert';
import { useRegion } from '@/contexts/RegionContext';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/DesignTokens';

interface LockedItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image?: string;
    store?: string;
    variant?: {
      type?: string;
      value?: string;
    };
    lockedAt: Date;
    expiresAt: Date;
    notes?: string;
    productId?: string;
    // Paid lock fields
    lockFee?: number;
    lockFeePercentage?: number;
    lockDuration?: number;
    paymentMethod?: 'wallet' | 'upi';
    lockPaymentStatus?: 'pending' | 'paid' | 'refunded' | 'forfeited' | 'applied';
    isPaidLock?: boolean;
  };
  onMoveToCart: (id: string, productId: string) => void;
  onUnlock: (id: string, productId: string) => void;
  showAnimation?: boolean;
}

function LockedItem({
  item,
  onMoveToCart,
  onUnlock,
  showAnimation = true,
}: LockedItemProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 360;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isUrgent: false,
    isCritical: false,
  });

  // Calculate time remaining with live updates
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const expiresAt = new Date(item.expiresAt);
      const remaining = expiresAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false, isCritical: false });
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      const isUrgent = remaining < 24 * 60 * 60 * 1000; // Less than 24 hours
      const isCritical = remaining < 60 * 60 * 1000; // Less than 1 hour

      setTimeLeft({ hours, minutes, seconds, isExpired: false, isUrgent, isCritical });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [item.expiresAt]);

  // Pulse animation for urgent timer
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (timeLeft.isCritical && !timeLeft.isExpired) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
      pulseAnim.setValue(1);
    };
  }, [timeLeft.isCritical, timeLeft.isExpired]);

  const { hours: hoursRemaining, minutes: minutesRemaining, seconds: secondsRemaining, isExpired } = timeLeft;

  const handleUnlock = () => {
    if (showAnimation) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onUnlock(item.id, item.productId || item.id);
      });
    } else {
      onUnlock(item.id, item.productId || item.id);
    }
  };

  const handleMoveToCart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onMoveToCart(item.id, item.productId || item.id);
    });
  };

  // Get timer color based on urgency
  const getTimerColor = () => {
    if (isExpired) return { bg: '#FEE2E2', text: '#DC2626', icon: '#EF4444' };
    if (timeLeft.isCritical) return { bg: '#FEE2E2', text: '#DC2626', icon: '#EF4444' };
    if (timeLeft.isUrgent) return { bg: '#FEF3C7', text: '#D97706', icon: '#F59E0B' };
    return { bg: '#faf1e0', text: '#1a3a52', icon: '#ffcd57' };
  };

  const timerColors = getTimerColor();

  // Format time display
  const formatTime = () => {
    if (isExpired) return 'Lock Expired';
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m ${secondsRemaining}s`;
    }
    return `${minutesRemaining}m ${secondsRemaining}s`;
  };

  // Handle cancel lock with confirmation
  const handleCancelLock = () => {
    const message = item.isPaidLock
      ? `Your lock deposit of ${currencySymbol}${item.lockFee} will be refunded to your ${item.paymentMethod === 'wallet' ? 'Wallet' : 'account'}. Continue?`
      : 'Are you sure you want to cancel this lock?';

    showAlert(
      'Cancel Lock',
      message,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleUnlock() },
      ],
      'warning'
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
          marginHorizontal: isSmallScreen ? 12 : 16,
        },
        isExpired && styles.expiredContainer,
      ]}
    >
      {/* Price Locked Header Banner */}
      <LinearGradient
        colors={isExpired ? ['#EF4444', '#DC2626'] : [COLORS.nuqta.mustard, COLORS.nuqta.peach]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerBanner}
      >
        <View style={styles.headerBannerContent}>
          <View style={styles.lockIconWrapper}>
            <Ionicons name="lock-closed" size={14} color={isExpired ? '#fff' : COLORS.nuqta.nileBlue} />
          </View>
          <ThemedText style={[styles.headerBannerText, !isExpired && { color: COLORS.nuqta.nileBlue }]}>
            {isExpired ? 'LOCK EXPIRED' : 'PRICE LOCKED'}
          </ThemedText>
          {item.isPaidLock && !isExpired && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.nuqta.nileBlue} />
              <ThemedText style={styles.paidBadgeText}>PAID</ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.itemContainer}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <CachedImage
              source={item.image}
              style={styles.productImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
          {/* Quantity Badge on Image */}
          <View style={styles.quantityOverlay}>
            <ThemedText style={styles.quantityOverlayText}>×{item.quantity}</ThemedText>
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.productName} numberOfLines={2}>
              {item.name}
            </ThemedText>
          </View>

          {item.store && (
            <ThemedText style={styles.storeName} numberOfLines={1}>
              {item.store}
            </ThemedText>
          )}

          {/* Variant */}
          {item.variant && item.variant.type && (
            <View style={styles.variantContainer}>
              <ThemedText style={styles.variantText}>
                {item.variant.type}: {item.variant.value}
              </ThemedText>
            </View>
          )}

          {/* Price Row - Show remaining price for paid locks */}
          <View style={styles.priceRow}>
            {item.isPaidLock && item.lockFee ? (
              <>
                <ThemedText style={styles.price}>
                  {currencySymbol}{((item.price * item.quantity) - item.lockFee).toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.originalPrice}>
                  {currencySymbol}{(item.price * item.quantity).toLocaleString()}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={styles.price}>{currencySymbol}{(item.price * item.quantity).toLocaleString()}</ThemedText>
                {item.originalPrice && item.originalPrice > item.price && (
                  <ThemedText style={styles.originalPrice}>
                    {currencySymbol}{(item.originalPrice * item.quantity).toLocaleString()}
                  </ThemedText>
                )}
              </>
            )}
          </View>

          {/* Paid Lock Deposit Info */}
          {item.isPaidLock && item.lockFee && (
            <View style={styles.depositContainer}>
              <Ionicons name="checkmark-circle" size={14} color="#1a3a52" />
              <ThemedText style={styles.depositText}>
                {currencySymbol}{item.lockFee} already paid ({item.lockFeePercentage}% deposit)
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Timer Section */}
      <Animated.View
        style={[
          styles.timerSection,
          { backgroundColor: timerColors.bg },
          timeLeft.isCritical && { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <View style={styles.timerContent}>
          <Ionicons name="time" size={18} color={timerColors.icon} />
          <View style={styles.timerTextContainer}>
            <ThemedText style={[styles.timerLabel, { color: timerColors.text }]}>
              {isExpired ? 'Expired' : 'Time Remaining'}
            </ThemedText>
            <ThemedText style={[styles.timerValue, { color: timerColors.text }]}>
              {formatTime()}
            </ThemedText>
          </View>
        </View>
        {!isExpired && item.isPaidLock && (
          <View style={styles.securedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#1a3a52" />
            <ThemedText style={styles.securedText}>Price Secured</ThemedText>
          </View>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isExpired ? (
          <>
            <Pressable
              onPress={handleCancelLock}
              style={styles.cancelButton}
             
            >
              <Ionicons name="close" size={18} color="#6B7280" />
              <ThemedText style={styles.cancelButtonText}>Cancel Lock</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleMoveToCart}
              style={styles.purchaseButtonWrapper}
             
            >
              <LinearGradient
                colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.purchaseButton}
              >
                <Ionicons name="cart" size={18} color={COLORS.nuqta.nileBlue} />
                <ThemedText style={styles.purchaseButtonText}>
                  {item.isPaidLock ? 'Complete Purchase' : 'Move to Cart'}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleCancelLock}
            style={styles.removeExpiredButton}
           
          >
            <Ionicons name="trash" size={18} color="#DC2626" />
            <ThemedText style={styles.removeExpiredText}>Remove Expired Lock</ThemedText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export default React.memo(LockedItem);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  expiredContainer: {
    opacity: 0.7,
  },
  headerBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  paidBadgeText: {
    color: COLORS.nuqta.nileBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 14,
    paddingTop: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 14,
  },
  productImage: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  quantityOverlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameRow: {
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  storeName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  variantContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  variantText: {
    fontSize: 11,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  depositContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#faf1e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  depositText: {
    fontSize: 12,
    color: '#1a3a52',
    fontWeight: '600',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 10,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerTextContainer: {
    gap: 2,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.nuqta.linen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.nuqta.peach,
  },
  securedText: {
    fontSize: 11,
    color: '#1a3a52',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    flex: 0.4,
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  purchaseButtonWrapper: {
    flex: 0.6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  purchaseButtonText: {
    color: COLORS.nuqta.nileBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  removeExpiredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    flex: 1,
  },
  removeExpiredText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
});
