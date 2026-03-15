/**
 * Savings Summary Card
 *
 * "You saved today" card showing breakdown of all savings
 * Premium design with Nuqta color palette
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { SavingsSummary } from '@/types/storePayment.types';
import { useRegion } from '@/contexts/RegionContext';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';

interface SavingsSummaryCardProps {
  savings: SavingsSummary;
  showCelebration?: boolean;
}

export const SavingsSummaryCard: React.FC<SavingsSummaryCardProps> = ({
  savings,
  showCelebration = true,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  if (savings.totalSaved === 0) {
    return null;
  }

  const savingsBreakdown = [
    {
      label: 'Coins Used',
      value: savings.coinsUsed,
      icon: 'diamond',
      gradient: [COLORS.nuqta.mustard, COLORS.nuqta.peach],
    },
    {
      label: 'Bank/UPI Offers',
      value: savings.bankOffers,
      icon: 'card',
      gradient: [COLORS.nuqta.lavender, COLORS.nuqta.nileBlue],
    },
    {
      label: 'Loyalty Benefit',
      value: savings.loyaltyBenefit,
      icon: 'star',
      gradient: [COLORS.nuqta.peach, COLORS.nuqta.mustard],
    },
  ].filter(item => item.value > 0);

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={[COLORS.nuqta.lavender, COLORS.nuqta.linen, colors.background.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {showCelebration && (
              <Text style={styles.emoji}>🎉</Text>
            )}
            <Text style={styles.title}>You Saved Today!</Text>
          </View>
          {showCelebration && savings.totalSaved >= 100 && (
            <LinearGradient
              colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.amazingBadge}
            >
              <Ionicons name="sparkles" size={12} color={COLORS.nuqta.nileBlue} />
              <Text style={styles.amazingText}>Amazing!</Text>
            </LinearGradient>
          )}
        </View>

        {/* Total Saved - Prominent Display */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <LinearGradient
            colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.totalAmountWrapper}
          >
            <Text style={styles.totalAmount}>{currencySymbol}{savings.totalSaved}</Text>
          </LinearGradient>
        </View>

        {/* Breakdown */}
        {savingsBreakdown.length > 0 && (
          <View style={styles.breakdownContainer}>
            {savingsBreakdown.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <LinearGradient
                  colors={item.gradient as [string, string]}
                  style={styles.breakdownIcon}
                >
                  <Ionicons name={item.icon as any} size={14} color={colors.background.primary} />
                </LinearGradient>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValue}>{currencySymbol}{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footer}>
          <View style={styles.footerIconWrapper}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.nuqta.mustard} />
          </View>
          <Text style={styles.footerText}>
            {`Smart savings automatically applied by ${BRAND.APP_NAME}`}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  container: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.nuqta.peach,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 205, 87, 0.15)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 181, 0.2)',
    bottom: 20,
    left: -20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '700',
  },
  amazingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  amazingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '700',
  },
  totalContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.nuqta.peach,
    marginBottom: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.nuqta.mustard,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmountWrapper: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.nuqta.nileBlue,
    letterSpacing: -1,
  },
  breakdownContainer: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  breakdownLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.nuqta.nileBlue,
    flex: 1,
  },
  breakdownValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.nuqta.linen,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  footerIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.nuqta.nileBlue,
    flex: 1,
  },
});

export default React.memo(SavingsSummaryCard);
