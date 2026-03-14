/**
 * Wallet Payment Option
 *
 * Third-party wallet payment option (Paytm, Amazon Pay, Mobikwik)
 * Premium Nuqta design palette
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/DesignTokens';
import { ExternalWallet } from '@/types/storePayment.types';
import { useRegion } from '@/contexts/RegionContext';

interface WalletPaymentOptionProps {
  wallet: ExternalWallet;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const WalletPaymentOption: React.FC<WalletPaymentOptionProps> = ({
  wallet,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  return (
    <Pressable
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        disabled && styles.containerDisabled,
      ]}
      onPress={onSelect}
      disabled={disabled}
     
    >
      {/* Selected State Gradient Border Effect */}
      {isSelected && (
        <LinearGradient
          colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selectedGradientBorder}
        />
      )}

      <View style={[styles.iconContainer, { backgroundColor: wallet.color + '20' }]}>
        <Ionicons name={wallet.icon as any} size={20} color={wallet.color} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.walletName, disabled && styles.textDisabled]}>
          {wallet.name}
        </Text>
        {wallet.isLinked ? (
          <View style={styles.linkedRow}>
            <View style={styles.linkedBadge}>
              <Ionicons name="checkmark-circle" size={10} color={COLORS.nuqta.mustard} />
              <Text style={styles.linkedText}>
                {wallet.linkedPhone || wallet.linkedEmail || 'Linked'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.linkText}>Tap to link</Text>
        )}
      </View>

      {wallet.balance !== undefined && wallet.isLinked && (
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balance, { color: wallet.color }]}>
            {currencySymbol}{wallet.balance}
          </Text>
        </View>
      )}

      {isSelected ? (
        <LinearGradient
          colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach]}
          style={styles.checkmarkWrapper}
        >
          <Ionicons name="checkmark" size={14} color={COLORS.nuqta.nileBlue} />
        </LinearGradient>
      ) : wallet.isLinked ? (
        <View style={styles.radioOuter}>
          <View style={styles.radioInner} />
        </View>
      ) : (
        <View style={styles.addIconWrapper}>
          <Ionicons name="add" size={16} color={COLORS.nuqta.mustard} />
        </View>
      )}

      {!wallet.isLinked && (
        <LinearGradient
          colors={[COLORS.nuqta.lavender, COLORS.nuqta.linen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.comingSoonBadge}
        >
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.nuqta.linen,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerSelected: {
    borderColor: COLORS.nuqta.mustard,
    backgroundColor: COLORS.nuqta.linen,
  },
  selectedGradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContainer: {
    flex: 1,
  },
  walletName: {
    ...TYPOGRAPHY.button,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '600',
  },
  textDisabled: {
    color: COLORS.text.tertiary,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 87, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    gap: 3,
  },
  linkedText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '500',
  },
  linkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.nuqta.mustard,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  balanceLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balance: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
  },
  checkmarkWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.nuqta.peach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.nuqta.linen,
  },
  addIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.nuqta.peach,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.nuqta.nileBlue,
  },
});

export default React.memo(WalletPaymentOption);
