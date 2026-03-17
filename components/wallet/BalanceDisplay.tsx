/**
 * BalanceDisplay - Total balance with hide/reveal toggle + CoinChip row
 * Replaces the old amountCard section of WalletScreen
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { CoinChip } from './CoinChip';
import { WalletData, CoinType } from '@/types/wallet';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';

const BALANCE_HIDDEN_KEY = '@wallet_balance_hidden';

interface BalanceDisplayProps {
  walletData: WalletData;
  onCoinPress?: (type: CoinType) => void;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = React.memo(({ walletData, onCoinPress }) => {
  const [isHidden, setIsHidden] = useState(false);
  const countAnim = useRef(new Animated.Value(0)).current;

  // Load persisted hide state
  useEffect(() => {
    AsyncStorage.getItem(BALANCE_HIDDEN_KEY).then(val => {
      if (val === 'true') setIsHidden(true);
    }).catch(() => {});
  }, []);

  // Count-up animation on mount
  useEffect(() => {
    if (!isHidden) {
      countAnim.setValue(0);
      const anim = Animated.timing(countAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      anim.start();
      return () => { anim.stop(); };
    }
  }, [isHidden, walletData.totalBalance]);

  const toggleHidden = async () => {
    const newVal = !isHidden;
    setIsHidden(newVal);
    await AsyncStorage.setItem(BALANCE_HIDDEN_KEY, String(newVal));
  };

  const totalBalance = Number(walletData.totalBalance) || 0;

  // Animated ticker state
  const [animatedBalance, setAnimatedBalance] = useState(0);

  useEffect(() => {
    if (isHidden) return;
    const listenerId = countAnim.addListener(({ value }) => {
      const interpolated = value * totalBalance;
      setAnimatedBalance(Math.round(interpolated));
    });
    return () => {
      countAnim.removeListener(listenerId);
    };
  }, [isHidden, totalBalance, countAnim]);

  // Get coin amounts
  const nuqtaCoin = walletData.coins?.find(c => c.type === 'rez' || c.type === 'nuqta');
  const promoCoin = walletData.coins?.find(c => c.type === 'promo');
  const brandedTotal = Number(walletData.brandedCoinsTotal) || 0;

  const displayBalance = isHidden ? '****' : `${BRAND.CURRENCY_CODE} ${Number.isFinite(animatedBalance) ? animatedBalance.toLocaleString() : '0'}`;

  return (
    <View style={styles.container}>
      <View style={styles.balanceRow}>
        <Animated.Text style={styles.balanceText}>
          {displayBalance}
        </Animated.Text>
        <Pressable
          onPress={toggleHidden}
          style={styles.eyeButton}
          accessibilityLabel={isHidden ? 'Show balance' : 'Hide balance'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isHidden ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={Colors.text.tertiary}
          />
        </Pressable>
      </View>
      <ThemedText style={styles.subtitle}>Total Wallet Balance</ThemedText>

      {/* Coin Chips Row */}
      <View style={styles.chipRow}>
        <CoinChip
          type="rez"
          amount={isHidden ? 0 : (nuqtaCoin?.amount || 0)}
          onPress={() => onCoinPress?.('rez')}
          compact
        />
        <CoinChip
          type="promo"
          amount={isHidden ? 0 : (promoCoin?.amount || 0)}
          onPress={() => onCoinPress?.('promo')}
          compact
        />
        {brandedTotal > 0 && (
          <CoinChip
            type="branded"
            amount={isHidden ? 0 : brandedTotal}
            onPress={() => onCoinPress?.('branded')}
            compact
          />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    alignSelf: 'center',
    marginVertical: 10,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '88%',
    ...Shadows.medium,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    color: Colors.nileBlue,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  eyeButton: {
    padding: 4,
  },
  subtitle: {
    color: Colors.text.tertiary,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export default BalanceDisplay;
