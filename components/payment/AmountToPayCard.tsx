/**
 * Amount To Pay Card
 * 
 * Displays final amount with crossed-out original price and savings info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { useRegion } from '@/contexts/RegionContext';
import { BRAND } from '@/constants/brand';

interface AmountToPayCardProps {
  originalAmount: number;
  amountToPay: number;
  coinsApplied: number;
  showOptimizedBadge?: boolean;
}

export const AmountToPayCard: React.FC<AmountToPayCardProps> = ({
  originalAmount,
  amountToPay,
  coinsApplied,
  showOptimizedBadge = true,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const hasSavings = originalAmount > amountToPay;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Amount to Pay</Text>
        {showOptimizedBadge && hasSavings && (
          <View style={styles.optimizedBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.primary[600]} />
            <Text style={styles.optimizedText}>Optimized</Text>
          </View>
        )}
      </View>

      <View style={styles.amountRow}>
        {hasSavings && (
          <Text style={styles.originalAmount}>{currencySymbol}{originalAmount.toFixed(0)}</Text>
        )}
        <Text style={styles.finalAmount}>{currencySymbol}{amountToPay.toFixed(0)}</Text>
      </View>

      {hasSavings && (
        <View style={styles.savingsInfo}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success[500]} />
          <Text style={styles.savingsText}>
            {`${BRAND.APP_NAME} applied maximum savings for you`}
          </Text>
        </View>
      )}

      {coinsApplied > 0 && (
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <CachedImage
              source={BRAND.COIN_IMAGE}
              style={styles.coinIcon}
              contentFit="contain"
              transition={200}
            />
            <Text style={styles.breakdownLabel}>Coins Used</Text>
            <Text style={styles.breakdownValue}>-{currencySymbol}{coinsApplied}</Text>
          </View>
        </View>
      )}

      {amountToPay === 0 && (
        <LinearGradient
          colors={[COLORS.success[500], COLORS.success[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.freePaymentBanner}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.freePaymentText}>
            Fully paid with coins! No additional payment needed.
          </Text>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  optimizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  optimizedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  originalAmount: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.tertiary,
    textDecorationLine: 'line-through',
  },
  finalAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary[600],
  },
  savingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  savingsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success[600],
  },
  breakdownRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  coinIcon: {
    width: 18,
    height: 18,
  },
  breakdownLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    flex: 1,
  },
  breakdownValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.success[600],
    fontWeight: '600',
  },
  freePaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  freePaymentText: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
  },
});

export default React.memo(AmountToPayCard);
