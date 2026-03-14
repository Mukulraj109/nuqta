// Pricing Toggle Component
// Segmented control for monthly/yearly billing with savings indicator

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRegion } from '@/contexts/RegionContext';

interface PricingToggleProps {
  billingCycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings?: number;
}

function PricingToggle({
  billingCycle,
  onChange,
  monthlyPrice,
  yearlyPrice,
  yearlySavings,
}: PricingToggleProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const savings = useMemo(() => {
    if (!yearlySavings) {
      const monthlyTotal = monthlyPrice * 12;
      return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
    }
    return yearlySavings;
  }, [monthlyPrice, yearlyPrice, yearlySavings]);

  const monthlyMonthlyPrice = monthlyPrice;
  const yearlyMonthlyPrice = Math.round(yearlyPrice / 12);

  return (
    <View style={styles.container}>
      {/* Billing Toggle */}
      <View
        style={styles.toggleContainer}
        accessible={false}
        accessibilityLabel="Billing cycle selection"
      >
        <Pressable
          style={[
            styles.toggleOption,
            billingCycle === 'monthly' && styles.toggleOptionActive,
          ]}
          onPress={() => onChange('monthly')}
         
          accessible={true}
          accessibilityRole="radio"
          accessibilityLabel={`Monthly billing, ${monthlyMonthlyPrice} rupees per month`}
          accessibilityHint="Double tap to select monthly billing"
          accessibilityState={{
            selected: billingCycle === 'monthly',
            checked: billingCycle === 'monthly',
          }}
        >
          <ThemedText
            style={[
              styles.toggleOptionText,
              billingCycle === 'monthly' && styles.toggleOptionTextActive,
            ]}
            accessible={false}
          >
            Monthly
          </ThemedText>
          <ThemedText
            style={[
              styles.togglePrice,
              billingCycle === 'monthly' && styles.togglePriceActive,
            ]}
            accessible={false}
          >
            {currencySymbol}{monthlyMonthlyPrice}
          </ThemedText>
        </Pressable>

        <View style={styles.toggleDivider} accessible={false} />

        <Pressable
          style={[
            styles.toggleOption,
            billingCycle === 'yearly' && styles.toggleOptionActive,
          ]}
          onPress={() => onChange('yearly')}
         
          accessible={true}
          accessibilityRole="radio"
          accessibilityLabel={`Yearly billing, ${yearlyMonthlyPrice} rupees per month, save ${savings} percent`}
          accessibilityHint="Double tap to select yearly billing and save money"
          accessibilityState={{
            selected: billingCycle === 'yearly',
            checked: billingCycle === 'yearly',
          }}
        >
          <View style={styles.yearlyLabelContainer}>
            <ThemedText
              style={[
                styles.toggleOptionText,
                billingCycle === 'yearly' && styles.toggleOptionTextActive,
              ]}
              accessible={false}
            >
              Yearly
            </ThemedText>
            <View style={styles.savingsBadge} accessible={false}>
              <ThemedText style={styles.savingsText}>Save {savings}%</ThemedText>
            </View>
          </View>
          <ThemedText
            style={[
              styles.togglePrice,
              billingCycle === 'yearly' && styles.togglePriceActive,
            ]}
            accessible={false}
          >
            {currencySymbol}{yearlyMonthlyPrice}/mo
          </ThemedText>
        </Pressable>
      </View>

      {/* Savings Calculation */}
      {billingCycle === 'yearly' && (
        <View
          style={styles.savingsInfo}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Yearly savings: Total annual cost is ${yearlyPrice} rupees. You save ${monthlyPrice * 12 - yearlyPrice} rupees per year.`}
        >
          <View style={styles.savingsRow}>
            <View style={styles.savingsColumn}>
              <ThemedText style={styles.savingsLabel}>Total Annual Cost</ThemedText>
              <ThemedText style={styles.savingsValue}>{currencySymbol}{yearlyPrice}</ThemedText>
            </View>
            <View style={styles.savingsDivider} accessible={false} />
            <View style={styles.savingsColumn}>
              <ThemedText style={styles.savingsLabel}>You Save</ThemedText>
              <View style={styles.savingsValueRow}>
                <Ionicons name="checkmark-circle" size={16} color="#ffcd57" />
                <ThemedText style={styles.savingsAmountValue}>
                  {currencySymbol}{monthlyPrice * 12 - yearlyPrice}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ROI Projection */}
      <View
        style={styles.roiContainer}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Projected return on investment: Based on average usage, plus 2400 rupees per year"
      >
        <View style={styles.roiHeader}>
          <Ionicons name="sparkles" size={16} color="#F59E0B" />
          <ThemedText style={styles.roiTitle}>Projected ROI</ThemedText>
        </View>
        <View style={styles.roiContent}>
          <View style={styles.roiItem}>
            <ThemedText style={styles.roiItemLabel}>Based on average usage</ThemedText>
            <ThemedText style={styles.roiItemValue}>+{currencySymbol}2,400/year</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  toggleContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleOptionTextActive: {
    color: '#111827',
  },
  togglePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
  },
  togglePriceActive: {
    color: '#111827',
  },
  toggleDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  yearlyLabelContainer: {
    alignItems: 'center',
  },
  savingsBadge: {
    marginTop: 6,
    backgroundColor: '#faf1e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffcd57',
  },
  savingsInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffcd57',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savingsColumn: {
    flex: 1,
  },
  savingsDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  savingsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  savingsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  savingsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffcd57',
  },
  roiContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  roiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  roiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  roiContent: {
    gap: 8,
  },
  roiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roiItemLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  roiItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
});

export default React.memo(PricingToggle);
