// Trial Stat Card Component
// Small stat card for displaying usage statistics with optional trend

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface TrialStatCardProps {
  icon: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  style?: ViewStyle;
}

export default function TrialStatCard({
  icon,
  label,
  value,
  change,
  changeLabel = 'vs last period',
  style,
}: TrialStatCardProps) {
  const isPositiveChange = change && change > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={24} color="#8B5CF6" />
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <View style={styles.valueRow}>
          <ThemedText style={styles.value}>{value}</ThemedText>
          {change !== undefined && (
            <View
              style={[
                styles.changeBadge,
                isPositiveChange ? styles.changePositive : styles.changeNegative,
              ]}
            >
              <Ionicons
                name={isPositiveChange ? 'arrow-up-outline' : 'arrow-down-outline'}
                size={12}
                color={isPositiveChange ? '#10B981' : '#EF4444'}
              />
              <ThemedText
                style={[
                  styles.changeText,
                  isPositiveChange ? styles.changeTextPositive : styles.changeTextNegative,
                ]}
              >
                {Math.abs(change)}%
              </ThemedText>
            </View>
          )}
        </View>
        {change !== undefined && (
          <ThemedText style={styles.changeLabel}>{changeLabel}</ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  changePositive: {
    backgroundColor: '#DCFCE7',
  },
  changeNegative: {
    backgroundColor: '#FEE2E2',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeTextPositive: {
    color: '#10B981',
  },
  changeTextNegative: {
    color: '#EF4444',
  },
  changeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
