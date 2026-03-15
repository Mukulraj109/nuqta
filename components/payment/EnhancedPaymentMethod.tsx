/**
 * Enhanced Payment Method
 * 
 * Payment method card with offers, badges, and provider icons
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/DesignTokens';
import { EnhancedPaymentMethod as EnhancedPaymentMethodType, PaymentBadgeType } from '@/types/storePayment.types';
import { colors } from '@/constants/theme';

interface EnhancedPaymentMethodProps {
  method: EnhancedPaymentMethodType;
  isSelected: boolean;
  onSelect: () => void;
}

const BADGE_STYLES: Record<PaymentBadgeType, { bg: string; text: string; label: string }> = {
  best: { bg: COLORS.success[500], text: colors.background.primary, label: 'Best' },
  popular: { bg: COLORS.primary[500], text: colors.background.primary, label: 'Popular' },
  new: { bg: COLORS.secondary[500], text: colors.background.primary, label: 'New' },
};

export const EnhancedPaymentMethodCard: React.FC<EnhancedPaymentMethodProps> = ({
  method,
  isSelected,
  onSelect,
}) => {
  const hasOffers = method.offers && method.offers.length > 0;

  return (
    <Pressable
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}
     
    >
      <View style={styles.mainRow}>
        {/* Icon */}
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Ionicons
            name={method.icon as any}
            size={24}
            color={isSelected ? COLORS.primary[500] : COLORS.neutral[500]}
          />
        </View>

        {/* Method Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.methodName}>{method.name}</Text>
            {method.badge && (
              <View style={[styles.badge, { backgroundColor: BADGE_STYLES[method.badge].bg }]}>
                <Text style={[styles.badgeText, { color: BADGE_STYLES[method.badge].text }]}>
                  {BADGE_STYLES[method.badge].label}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.methodDesc}>{method.description}</Text>
        </View>

        {/* Selection Indicator */}
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary[500]} />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color={COLORS.neutral[300]} />
        )}
      </View>

      {/* Offers Section */}
      {hasOffers && (
        <View style={styles.offersContainer}>
          {method.offers.slice(0, 2).map((offer, index) => (
            <View key={index} style={styles.offerRow}>
              <View style={styles.offerIcon}>
                <Ionicons
                  name={
                    offer.type === 'cashback' ? 'cash-outline' :
                    offer.type === 'discount' ? 'pricetag-outline' :
                    offer.type === 'emi' ? 'calendar-outline' :
                    'gift-outline'
                  }
                  size={12}
                  color={COLORS.success[500]}
                />
              </View>
              <Text style={styles.offerText} numberOfLines={1}>
                {offer.title}
              </Text>
              {offer.banks && offer.banks.length > 0 && (
                <Text style={styles.offerBanks}>
                  {offer.banks.slice(0, 2).join(', ')}
                </Text>
              )}
            </View>
          ))}
          {method.offers.length > 2 && (
            <Text style={styles.moreOffers}>
              +{method.offers.length - 2} more offers
            </Text>
          )}
        </View>
      )}

      {/* Providers */}
      {method.providers && method.providers.length > 0 && method.type === 'pay_later' && (
        <View style={styles.providersContainer}>
          <Text style={styles.providersLabel}>Pay with:</Text>
          <View style={styles.providersList}>
            {method.providers.map((provider, index) => (
              <View key={index} style={styles.providerChip}>
                <Text style={styles.providerText}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  containerSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary[100],
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  methodName: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.primary,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  methodDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  offersContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: SPACING.xs,
  },
  offerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success[700],
    flex: 1,
  },
  offerBanks: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.text.tertiary,
  },
  moreOffers: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary[500],
    marginTop: 4,
  },
  providersContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  providersLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  providersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  providerChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.neutral[100],
    borderRadius: BORDER_RADIUS.full,
  },
  providerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});

export default React.memo(EnhancedPaymentMethodCard);
