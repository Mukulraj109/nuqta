/**
 * WhyGoodDealSection Component
 *
 * Displays deal insights:
 * - Product buying patterns
 * - Savings information
 * - Price change warnings
 *
 * Based on reference design from ProductPage redesign
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

interface DealInsight {
  icon: string;
  iconColor: string;
  text: string;
}

interface WhyGoodDealSectionProps {
  /** Savings amount */
  savingsAmount?: number;
  /** Currency symbol */
  currency?: string;
  /** Custom insights (optional) */
  insights?: DealInsight[];
  /** Custom style */
  style?: any;
}

export const WhyGoodDealSection: React.FC<WhyGoodDealSectionProps> = ({
  savingsAmount = 300,
  currency,
  insights,
  style,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = currency || getCurrencySymbol();
  // Default insights if not provided
  const defaultInsights: DealInsight[] = [
    {
      icon: 'bulb',
      iconColor: '#F59E0B',
      text: `This product is usually bought on weekends — locking now saves ${currencySymbol}${savingsAmount}`,
    },
    {
      icon: 'flame',
      iconColor: '#EF4444',
      text: 'High demand item — price may change later',
    },
  ];

  const displayInsights = insights || defaultInsights;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="thumbs-up" size={22} color="#7C3AED" />
        </View>
        <Text style={styles.headerTitle}>Why this is a good deal</Text>
      </View>

      {/* Insights List */}
      <View style={styles.insightsList}>
        {displayInsights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: `${insight.iconColor}15` }]}>
              <Ionicons
                name={insight.icon as any}
                size={16}
                color={insight.iconColor}
              />
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // Insights List
  insightsList: {
    gap: 14,
  },

  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default React.memo(WhyGoodDealSection);
