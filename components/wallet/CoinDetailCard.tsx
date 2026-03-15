/**
 * CoinDetailCard - Compact coin card (replaces WalletBalanceCard's large format)
 * Shows coin amount, icon, expiry/usage info, chevron for detail navigation
 */
import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { CoinBalance, COIN_TYPES, CoinType } from '@/types/wallet';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';

import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';
const nuqtaCoinImage = BRAND.COIN_IMAGE;

interface CoinDetailCardProps {
  coin: CoinBalance;
  onPress?: (coin: CoinBalance) => void;
}

export const CoinDetailCard: React.FC<CoinDetailCardProps> = React.memo(({ coin, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const coinInfo = COIN_TYPES[coin.type] || COIN_TYPES.rez;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // Determine info line
  const getInfoText = (): string => {
    if (coin.type === 'rez' || coin.type === 'nuqta') return 'Never expires';
    if (coin.type === 'promo') {
      if (coin.expiryCountdown) return coin.expiryCountdown;
      if (coin.expiryDate) {
        const parsed = new Date(coin.expiryDate).getTime();
        if (Number.isFinite(parsed)) {
          const days = Math.ceil((parsed - Date.now()) / 86400000);
          return days > 0 ? `Expires in ${days} days` : 'Expired';
        }
      }
      return 'Max 20% per bill';
    }
    if (coin.type === 'branded') {
      return coin.brandedDetails?.merchantName
        ? `From ${coin.brandedDetails.merchantName}`
        : coin.description || 'From stores';
    }
    return coin.description;
  };

  const expiryMs = coin.expiryDate ? new Date(coin.expiryDate).getTime() : NaN;
  const isExpiringSoon = coin.type === 'promo' && Number.isFinite(expiryMs) &&
    Math.ceil((expiryMs - Date.now()) / 86400000) <= 7;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.card, { borderColor: coinInfo.color + '20' }]}
        onPress={() => onPress?.(coin)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
        accessibilityLabel={`${coinInfo.name}: ${coin.amount} coins`}
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: coinInfo.backgroundColor }]}>
          {coin.type === 'rez' || coin.type === 'nuqta' ? (
            <CachedImage source={nuqtaCoinImage} style={styles.coinImage} contentFit="contain" transition={200} />
          ) : (
            <Ionicons
              name={coin.type === 'branded' ? 'storefront' : 'flash'}
              size={20}
              color={coinInfo.color}
            />
          )}
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.name}>{coinInfo.name}</ThemedText>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amount, { color: coinInfo.amountColor }]}>
              {Number.isFinite(coin.amount) ? coin.amount.toLocaleString() : '0'} {BRAND.CURRENCY_CODE}
            </ThemedText>
          </View>
          <ThemedText style={[styles.info, isExpiringSoon && styles.infoWarning]}>
            {getInfoText()}
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coinImage: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  info: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '500',
    marginTop: 1,
  },
  infoWarning: {
    color: colors.warningScale[700],
    fontWeight: '600',
  },
});

export default CoinDetailCard;
