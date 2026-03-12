/**
 * PayWithRezSection Component
 *
 * Displays payment options with ReZ coins:
 * - Pay fully with Nuqta Coins
 * - Pay Coins + Cash
 * - Pay normally & earn later
 *
 * Based on reference design from ProductPage redesign
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '@/constants/brand';

interface PayWithRezSectionProps {
  /** Custom style */
  style?: any;
}

// Payment options
const PAYMENT_OPTIONS = [
  {
    id: 'full-coins',
    label: `Pay fully with ${BRAND.COIN_NAME}`,
    isAvailable: true,
  },
  {
    id: 'coins-cash',
    label: 'Pay Coins + Cash',
    isAvailable: true,
  },
  {
    id: 'earn-later',
    label: 'Pay normally & earn later',
    isAvailable: true,
  },
];

export const PayWithRezSection: React.FC<PayWithRezSectionProps> = ({
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <CachedImage
            source={BRAND.COIN_IMAGE}
            style={styles.coinImage}
            contentFit="contain"
          />
        </View>
        <Text style={styles.headerTitle}>Pay with {BRAND.APP_NAME}</Text>
      </View>

      {/* Payment Options */}
      <View style={styles.optionsList}>
        {PAYMENT_OPTIONS.map((option) => (
          <View key={option.id} style={styles.optionItem}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#ffcd57"
            />
            <Text style={styles.optionLabel}>{option.label}</Text>
          </View>
        ))}
      </View>

      {/* Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
        <Text style={styles.tipText}>
          Coins auto-apply for maximum savings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  coinImage: {
    width: 24,
    height: 24,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  // Options List
  optionsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 14,
    marginBottom: 14,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  optionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },

  tipText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
});

export default React.memo(PayWithRezSection);
