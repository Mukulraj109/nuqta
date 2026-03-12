import React, { useState, memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { WalletBalanceCardProps } from '@/types/wallet';

// Coin type color mapping for expiry indicators
const COIN_TYPE_COLORS: Record<string, { color: string; label: string }> = {
  rez: { color: '#16A34A', label: 'Never expires' },
  nuqta: { color: '#16A34A', label: 'Never expires' },
  promo: { color: '#D97706', label: '' }, // dynamic based on campaign
  branded: { color: '#2563EB', label: '' }, // dynamic per brand
};

/**
 * Check if a date is within N days from now
 */
const isExpiringSoon = (expiryDate: Date | undefined, withinDays: number = 7): boolean => {
  if (!expiryDate) return false;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= withinDays;
};

/**
 * Get human-readable expiry label
 */
const getExpiryLabel = (expiryDate: Date | undefined, coinType: string): string => {
  if (coinType === 'rez' || coinType === 'nuqta') return 'Never expires';
  if (!expiryDate) {
    if (coinType === 'promo') return 'Per campaign';
    if (coinType === 'branded') return 'Check store details';
    return '';
  }
  const expiry = new Date(expiryDate);
  return `Expires ${expiry.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const WalletBalanceCardComponent: React.FC<WalletBalanceCardProps> = ({
  coin,
  onPress,
  isLoading = false,
  showChevron = true,
  testID,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [spinAnim] = useState(new Animated.Value(0));
  const [imageError, setImageError] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  // Loading animation
  React.useEffect(() => {
    if (isLoading) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    }
  }, [isLoading, spinAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = useCallback(() => {
    if (onPress && !isLoading) {
      onPress(coin);
    }
  }, [onPress, coin, isLoading]);

  const renderIcon = () => {
    if (imageError) {
      // Icon based on coin type
      const iconName = coin.type === 'rez' ? 'diamond' : coin.type === 'promo' ? 'gift' : 'star';
      const iconColor = coin.color || '#ffcd57';
      return (
        <View style={[styles.iconWrap, { backgroundColor: coin.backgroundColor }]}>
          <Ionicons
            name={iconName}
            size={20}
            color={iconColor}
          />
        </View>
      );
    }

    return (
      <View style={[styles.iconWrap, { backgroundColor: coin.backgroundColor }]}>
        <CachedImage
          source={coin.iconPath}
          style={styles.icon}
          contentFit="contain"
          onError={() => setImageError(true)}
        />
      </View>
    );
  };

  const styles = createStyles(screenWidth);

  // Determine expiry state
  const expiringSoon = isExpiringSoon(coin.expiryDate, 7);
  const expiryLabel = getExpiryLabel(coin.expiryDate, coin.type);
  const coinTypeColor = COIN_TYPE_COLORS[coin.type]?.color || coin.color || '#ffcd57';

  // Check if this coin has a pending status (from restrictions or description hints)
  const isPending = coin.restrictions?.includes('pending') ||
    coin.description?.toLowerCase().includes('pending');

  const cardContent = (
    <Animated.View
      style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}
      testID={testID}
    >
      <View style={styles.row}>
        {renderIcon()}

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.label}>{coin.name}</Text>
            <View style={styles.badgeRow}>
              {/* Expiring Soon Warning Badge */}
              {expiringSoon && (
                <View style={styles.expiringSoonBadge}>
                  <Ionicons name="warning" size={10} color="#DC2626" />
                  <Text style={styles.expiringSoonText}>Expiring Soon</Text>
                </View>
              )}
              {/* Pending Badge */}
              {isPending && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="hourglass-outline" size={10} color="#D97706" />
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>
              )}
              {/* Active Badge */}
              {coin.isActive && !isPending && (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={10} color="#1dac52ff" />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.amount, { color: coin.color || '#B45309' }]}>{coin.formattedAmount}</Text>

          {coin.description && (
            <Text style={styles.desc} numberOfLines={2}>
              {coin.description}
            </Text>
          )}

          {/* Color-coded expiry indicator */}
          <View style={styles.expiryContainer}>
            <View style={[styles.coinTypeDot, { backgroundColor: coinTypeColor }]} />
            {expiringSoon ? (
              <>
                <Ionicons name="time-outline" size={12} color="#DC2626" />
                <Text style={[styles.expiryText, styles.expiryTextWarning]}>
                  {expiryLabel}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={styles.expiryText}>
                  {expiryLabel}
                </Text>
              </>
            )}
          </View>
        </View>

        {showChevron && (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Animated.View
            style={[
              styles.loadingIndicator,
              {
                transform: [
                  {
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
        disabled={isLoading}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

export const WalletBalanceCard = memo(WalletBalanceCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.coin.id === nextProps.coin.id &&
    prevProps.coin.amount === nextProps.coin.amount &&
    prevProps.coin.formattedAmount === nextProps.coin.formattedAmount &&
    prevProps.coin.isActive === nextProps.coin.isActive &&
    prevProps.coin.expiryDate === nextProps.coin.expiryDate &&
    prevProps.coin.type === nextProps.coin.type &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.showChevron === nextProps.showChevron &&
    prevProps.onPress === nextProps.onPress
  );
});

const createStyles = (screenWidth: number) => {
  const isTablet = screenWidth > 768;
  const isSmallScreen = screenWidth < 375;

  return StyleSheet.create({
    cardWrap: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      padding: isTablet ? 16 : isSmallScreen ? 10 : 12,
      marginBottom: isTablet ? 12 : 8,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: 'rgba(124, 58, 237, 0.08)',
      position: 'relative',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: isTablet ? 42 : isSmallScreen ? 34 : 38,
      height: isTablet ? 42 : isSmallScreen ? 34 : 38,
      borderRadius: isTablet ? 14 : 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isTablet ? 14 : 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    icon: {
      width: isTablet ? 24 : isSmallScreen ? 20 : 22,
      height: isTablet ? 24 : isSmallScreen ? 20 : 22,
    },
    contentContainer: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    label: {
      color: '#111827',
      fontWeight: '700',
      fontSize: isTablet ? 15 : isSmallScreen ? 13 : 14,
      letterSpacing: 0.2,
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 6,
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E8FDEB',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 8,
    },
    activeBadgeText: {
      color: '#16A34A',
      fontSize: 9,
      fontWeight: '600',
      marginLeft: 2,
    },
    expiringSoonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF2F2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    expiringSoonText: {
      color: '#DC2626',
      fontSize: 9,
      fontWeight: '700',
      marginLeft: 3,
    },
    pendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    pendingBadgeText: {
      color: '#D97706',
      fontSize: 9,
      fontWeight: '600',
      marginLeft: 3,
    },
    amount: {
      color: '#7C3AED',
      fontWeight: '800',
      fontSize: isTablet ? 17 : isSmallScreen ? 14 : 15,
      marginBottom: 2,
      letterSpacing: 0.3,
    },
    desc: {
      color: '#6B7280',
      fontSize: isTablet ? 13 : isSmallScreen ? 11 : 12,
      lineHeight: isTablet ? 17 : 16,
      fontWeight: '500',
    },
    expiryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    coinTypeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    expiryText: {
      color: '#6B7280',
      fontSize: 11,
      fontWeight: '500',
      marginLeft: 2,
    },
    expiryTextWarning: {
      color: '#DC2626',
      fontWeight: '600',
    },
    chevronContainer: {
      marginLeft: 6,
      padding: 2,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderTopColor: '#7C3AED',
    },
  });
};
