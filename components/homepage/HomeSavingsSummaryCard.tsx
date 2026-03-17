/**
 * HomeSavingsSummaryCard — Home page savings anchor card.
 *
 * Displayed at the top of the Near-U feed to anchor the user on savings.
 * LinearGradient linen-to-lavender, prominent month savings, unlock CTA.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

interface HomeSavingsSummaryCardProps {
  totalSaved: number;
  thisMonthSaved: number;
  nearbyStoreCount?: number;
  unlockAmount?: number;
  currencySymbol: string;
  onPress: () => void;
}

const HomeSavingsSummaryCard: React.FC<HomeSavingsSummaryCardProps> = ({
  totalSaved,
  thisMonthSaved,
  nearbyStoreCount,
  unlockAmount,
  currencySymbol,
  onPress,
}) => {
  const isEmptyState = thisMonthSaved === 0 && totalSaved === 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.wrapper}>
        <LinearGradient
          colors={['#faf1e0', '#dfebf7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {isEmptyState ? (
            /* Empty / first-time state */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="wallet-outline" size={28} color={colors.nuqta.nileBlue} />
              </View>
              <Text style={styles.emptyTitle}>Start saving today!</Text>
              <Text style={styles.emptySubtitle}>
                Shop at nearby stores and earn cashback on every purchase.
              </Text>
            </View>
          ) : (
            /* Savings state */
            <>
              <Text style={styles.label}>You saved this month</Text>
              <Text style={styles.amount}>
                {currencySymbol}{thisMonthSaved.toLocaleString()}
              </Text>

              {unlockAmount != null && unlockAmount > 0 && (
                <View style={styles.unlockRow}>
                  <Text style={styles.unlockText}>
                    Unlock {currencySymbol}{unlockAmount.toLocaleString()} more
                    {nearbyStoreCount ? ` at ${nearbyStoreCount} nearby stores` : ''} →
                  </Text>
                </View>
              )}
            </>
          )}
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.nuqta.nileBlue,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 3px 10px rgba(26, 58, 82, 0.1)',
      } as any,
    }),
  },
  gradient: {
    padding: 16,
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.92,
  },

  // Savings state
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 6,
  },
  unlockRow: {
    marginTop: 2,
  },
  unlockText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(26, 58, 82, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default React.memo(HomeSavingsSummaryCard);
