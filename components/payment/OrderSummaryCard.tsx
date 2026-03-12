/**
 * Order Summary Card
 * 
 * Displays bill breakdown with smart savings info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { useRegion } from '@/contexts/RegionContext';

interface OrderSummaryCardProps {
  billAmount: number;
  taxesAndFees?: number;
  discountAmount?: number;
  coinsApplied?: number;
  showSmartSavingsHint?: boolean;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  billAmount,
  taxesAndFees = 0,
  discountAmount = 0,
  coinsApplied = 0,
  showSmartSavingsHint = true,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const orderTotal = billAmount + taxesAndFees;
  const totalSavings = discountAmount + coinsApplied;
  const amountToPay = Math.max(0, orderTotal - totalSavings);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Order Summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Bill Amount</Text>
        <Text style={styles.value}>{currencySymbol}{billAmount.toFixed(2)}</Text>
      </View>

      {taxesAndFees > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Taxes & Fees</Text>
          <Text style={styles.value}>{currencySymbol}{taxesAndFees.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Order Total</Text>
        <Text style={styles.totalValue}>{currencySymbol}{orderTotal.toFixed(2)}</Text>
      </View>

      {showSmartSavingsHint && totalSavings === 0 && (
        <View style={styles.hintBanner}>
          <Ionicons name="sparkles" size={16} color={COLORS.info[500]} />
          <Text style={styles.hintText}>
            Smart savings will be applied below
          </Text>
        </View>
      )}

      {totalSavings > 0 && (
        <View style={styles.savingsBanner}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success[500]} />
          <Text style={styles.savingsText}>
            You're saving {currencySymbol}{totalSavings.toFixed(2)} on this order!
          </Text>
        </View>
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
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  value: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info[50],
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.info[700],
    flex: 1,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success[50],
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  savingsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success[700],
    flex: 1,
    fontWeight: '600',
  },
});

export default OrderSummaryCard;
