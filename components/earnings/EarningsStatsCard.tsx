// Earnings Statistics Card Component
// Displays key earnings statistics

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EarningsStatistics } from '@/services/earningsApi';
import { useRegion } from '@/contexts/RegionContext';

interface EarningsStatsCardProps {
  stats: EarningsStatistics;
}

const EarningsStatsCard: React.FC<EarningsStatsCardProps> = ({ stats }) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const statItems = [
    {
      icon: 'trending-up',
      label: 'Daily Avg',
      value: `${currencySymbol}${stats.dailyAverage.toFixed(2)}`,
      color: '#ffcd57',
    },
    {
      icon: 'calendar',
      label: 'Weekly Avg',
      value: `${currencySymbol}${stats.weeklyAverage.toFixed(2)}`,
      color: '#3B82F6',
    },
    {
      icon: 'calendar-outline',
      label: 'Monthly Avg',
      value: `${currencySymbol}${stats.monthlyAverage.toFixed(2)}`,
      color: '#8B5CF6',
    },
    {
      icon: 'receipt',
      label: 'Transactions',
      value: stats.transactionCount.toString(),
      color: '#F59E0B',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings Statistics</Text>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default React.memo(EarningsStatsCard);
