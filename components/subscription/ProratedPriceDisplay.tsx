// Prorated Price Display Component
// Shows breakdown of prorated pricing for upgrades

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

interface ProratedPriceDisplayProps {
  originalPrice: number;
  creditFromCurrentPlan: number;
  finalAmount: number;
  currentTier: string;
  newTier: string;
  daysRemaining: number;
}

function ProratedPriceDisplay({
  originalPrice,
  creditFromCurrentPlan,
  finalAmount,
  currentTier,
  newTier,
  daysRemaining,
}: ProratedPriceDisplayProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Pricing Breakdown</ThemedText>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
        <ThemedText style={styles.infoText}>
          You have {daysRemaining} days remaining on your {currentTier} plan
        </ThemedText>
      </View>

      <View style={styles.breakdownContainer}>
        {/* Original Price */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>{newTier} Plan (1 month)</ThemedText>
          </View>
          <ThemedText style={styles.value}>{currencySymbol}{originalPrice}</ThemedText>
        </View>

        {/* Credit */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>Credit from {currentTier} Plan</ThemedText>
            <ThemedText style={styles.sublabel}>
              ({daysRemaining} days remaining)
            </ThemedText>
          </View>
          <ThemedText style={[styles.value, styles.creditValue]}>-{currencySymbol}{creditFromCurrentPlan}</ThemedText>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total */}
        <View style={[styles.row, styles.totalRow]}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.totalLabel}>Amount Due Today</ThemedText>
            <ThemedText style={styles.sublabel}>
              Covers remaining {daysRemaining} days
            </ThemedText>
          </View>
          <ThemedText style={styles.totalValue}>{currencySymbol}{finalAmount}</ThemedText>
        </View>
      </View>

      <View style={styles.noteContainer}>
        <ThemedText style={styles.noteText}>
          Your next full billing cycle starts after {daysRemaining} days
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
  },
  breakdownContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  sublabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  creditValue: {
    color: '#ffcd57',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  noteContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
});

export default React.memo(ProratedPriceDisplay);
