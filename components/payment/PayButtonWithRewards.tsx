/**
 * Pay Button With Rewards
 *
 * Premium pay button showing amount and rewards preview
 * Nuqta design palette
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { RewardsPreview } from '@/types/storePayment.types';
import { useRegion } from '@/contexts/RegionContext';

interface PayButtonWithRewardsProps {
  amountToPay: number;
  rewardsPreview?: RewardsPreview;
  isProcessing?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export const PayButtonWithRewards: React.FC<PayButtonWithRewardsProps> = ({
  amountToPay,
  rewardsPreview,
  isProcessing = false,
  disabled = false,
  onPress,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const isFreePayment = amountToPay === 0;
  const hasRewards = rewardsPreview && (rewardsPreview.cashback > 0 || rewardsPreview.coinsToEarn > 0);

  return (
    <View style={styles.container}>
      {/* Rewards Preview Banner */}
      {hasRewards && (
        <LinearGradient
          colors={[COLORS.nuqta.lavender, COLORS.nuqta.linen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rewardsPreview}
        >
          <View style={styles.rewardsIconWrapper}>
            <Ionicons name="gift" size={14} color={COLORS.nuqta.mustard} />
          </View>
          <Text style={styles.rewardsText}>
            You'll earn{' '}
            {rewardsPreview.cashback > 0 && (
              <Text style={styles.rewardsHighlight}>{currencySymbol}{rewardsPreview.cashback} cashback</Text>
            )}
            {rewardsPreview.cashback > 0 && rewardsPreview.coinsToEarn > 0 && ' + '}
            {rewardsPreview.coinsToEarn > 0 && (
              <Text style={styles.rewardsHighlight}>{rewardsPreview.coinsToEarn} coins</Text>
            )}
            {' '}after payment
          </Text>
        </LinearGradient>
      )}

      {/* Pay Button Row */}
      <View style={styles.buttonRow}>
        {/* Amount Info */}
        <View style={styles.amountInfo}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{currencySymbol}{amountToPay.toFixed(0)}</Text>
        </View>

        {/* Pay Button */}
        <Pressable
          style={styles.buttonWrapper}
          onPress={onPress}
          disabled={isProcessing || disabled}
         
        >
          <LinearGradient
            colors={
              isProcessing || disabled
                ? [COLORS.neutral[400], COLORS.neutral[500]]
                : isFreePayment
                ? [COLORS.nuqta.nileBlue, '#234b68']
                : [COLORS.nuqta.mustard, COLORS.nuqta.peach]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={[
                  styles.buttonText,
                  !isFreePayment && { color: COLORS.nuqta.nileBlue }
                ]}>
                  {isFreePayment ? 'Confirm Payment' : `Pay ${currencySymbol}${amountToPay.toFixed(0)}`}
                </Text>
                {!isFreePayment && hasRewards && (
                  <View style={styles.earnBadge}>
                    <Text style={styles.earnText}>& Earn Rewards</Text>
                  </View>
                )}
                <View style={[
                  styles.arrowWrapper,
                  !isFreePayment && { backgroundColor: 'rgba(26, 58, 82, 0.15)' }
                ]}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={isFreePayment ? '#FFFFFF' : COLORS.nuqta.nileBlue}
                  />
                </View>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={12} color={COLORS.nuqta.mustard} />
        <Text style={styles.securityText}>
          Secured by 256-bit encryption
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.nuqta.linen,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.nileBlue,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  rewardsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  rewardsIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.nuqta.nileBlue,
  },
  rewardsHighlight: {
    fontWeight: '700',
    color: COLORS.nuqta.nileBlue,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  amountInfo: {
    alignItems: 'flex-start',
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  amountValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '800',
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.mustard,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  earnBadge: {
    backgroundColor: 'rgba(26, 58, 82, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  earnText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '600',
  },
  arrowWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: 4,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.text.tertiary,
  },
});

export default PayButtonWithRewards;
