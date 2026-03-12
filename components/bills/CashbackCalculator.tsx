// Cashback Calculator
// Shows detailed cashback calculation breakdown

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CashbackCalculation } from '@/types/billVerification.types';
import { useRegion } from '@/contexts/RegionContext';

interface CashbackCalculatorProps {
  calculation: CashbackCalculation;
}

export default function CashbackCalculator({ calculation }: CashbackCalculatorProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="gift" size={24} color="#4CAF50" />
        <Text style={styles.headerTitle}>Cashback Breakdown</Text>
      </View>

      {/* Total Cashback */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>You'll Earn</Text>
        <Text style={styles.totalAmount}>{currencySymbol}{calculation.finalCashback.toFixed(2)}</Text>
        <Text style={styles.totalRate}>{calculation.finalCashbackRate}% Cashback</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>Calculation Details</Text>

        {/* Base Amount */}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Bill Amount</Text>
          <Text style={styles.breakdownValue}>{currencySymbol}{calculation.baseAmount.toFixed(2)}</Text>
        </View>

        {/* Base Cashback */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabelContainer}>
            <Text style={styles.breakdownLabel}>Base Cashback</Text>
            <Text style={styles.breakdownSubtext}>{calculation.baseCashbackRate}%</Text>
          </View>
          <Text style={styles.breakdownValue}>{currencySymbol}{calculation.baseCashback.toFixed(2)}</Text>
        </View>

        {/* Bonuses */}
        {calculation.bonuses.map((bonus, index) => (
          <View key={index} style={styles.breakdownRow}>
            <View style={styles.breakdownLabelContainer}>
              <View style={styles.bonusLabelRow}>
                <Ionicons name="add-circle" size={16} color="#4CAF50" />
                <Text style={styles.breakdownLabel}>{bonus.label}</Text>
              </View>
              <Text style={styles.breakdownSubtext}>{bonus.description}</Text>
            </View>
            <Text style={[styles.breakdownValue, styles.bonusValue]}>
              +{currencySymbol}{bonus.amount.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Total Bonus */}
        {calculation.totalBonus > 0 && (
          <View style={[styles.breakdownRow, styles.totalBonusRow]}>
            <Text style={styles.totalBonusLabel}>Total Bonus</Text>
            <Text style={styles.totalBonusValue}>+{currencySymbol}{calculation.totalBonus.toFixed(2)}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Final Cashback */}
        <View style={[styles.breakdownRow, styles.finalRow]}>
          <Text style={styles.finalLabel}>Total Cashback</Text>
          <Text style={styles.finalValue}>{currencySymbol}{calculation.finalCashback.toFixed(2)}</Text>
        </View>
      </View>

      {/* Cap Warning */}
      {calculation.appliedCap && (
        <View style={styles.capWarning}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <View style={styles.capWarningText}>
            <Text style={styles.capWarningTitle}>Limit Applied</Text>
            <Text style={styles.capWarningMessage}>{calculation.appliedCap.reason}</Text>
          </View>
        </View>
      )}

      {/* Caps Info */}
      {(calculation.caps.dailyLimit || calculation.caps.monthlyLimit) && (
        <View style={styles.capsInfo}>
          <Text style={styles.capsTitle}>Cashback Limits</Text>
          {calculation.caps.dailyLimit && (
            <View style={styles.capRow}>
              <Text style={styles.capLabel}>Daily Limit</Text>
              <Text style={styles.capValue}>{currencySymbol}{calculation.caps.dailyLimit}</Text>
            </View>
          )}
          {calculation.caps.monthlyLimit && (
            <View style={styles.capRow}>
              <Text style={styles.capLabel}>Monthly Limit</Text>
              <Text style={styles.capValue}>{currencySymbol}{calculation.caps.monthlyLimit}</Text>
            </View>
          )}
        </View>
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="time-outline" size={16} color="#2196F3" />
        <Text style={styles.infoText}>
          Cashback will be credited within 24-48 hours after bill approval
        </Text>
      </View>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  totalRate: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  breakdownLabelContainer: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bonusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bonusValue: {
    color: '#4CAF50',
  },
  totalBonusRow: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  totalBonusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  totalBonusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  finalRow: {
    paddingTop: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  capWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF4E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  capWarningText: {
    flex: 1,
  },
  capWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 2,
  },
  capWarningMessage: {
    fontSize: 12,
    color: '#FF9800',
  },
  capsInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  capsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  capRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  capLabel: {
    fontSize: 12,
    color: '#666',
  },
  capValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#2196F3',
    lineHeight: 16,
  },
});
