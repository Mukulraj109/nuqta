// Feature Comparison Table Component
// Side-by-side comparison of features between subscription tiers

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { SubscriptionTier } from '@/types/subscription.types';

interface Feature {
  name: string;
  free: boolean;
  premium: boolean;
  vip: boolean;
}

interface FeatureComparisonTableProps {
  currentTier?: SubscriptionTier;
  newTier?: SubscriptionTier;
  compact?: boolean;
}

const FEATURES: Feature[] = [
  { name: 'Cashback Rate', free: false, premium: false, vip: false }, // Custom render
  { name: 'Free Delivery', free: false, premium: true, vip: true },
  { name: 'Priority Support', free: false, premium: true, vip: true },
  { name: 'Exclusive Deals', free: false, premium: true, vip: true },
  { name: 'Unlimited Wishlists', free: false, premium: true, vip: true },
  { name: 'Early Flash Sales', free: false, premium: true, vip: true },
  { name: 'Personal Shopper', free: false, premium: false, vip: true },
  { name: 'Premium Events', free: false, premium: false, vip: true },
  { name: 'Concierge Service', free: false, premium: false, vip: true },
];

function FeatureComparisonTable({
  currentTier,
  newTier,
  compact = false,
}: FeatureComparisonTableProps) {
  // Staggered row entrance animation
  const rowAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = rowAnims.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    );
    Animated.stagger(50, animations).start();
  }, []);

  const renderCheckIcon = (hasFeature: boolean, tier?: SubscriptionTier) => {
    const isHighlighted = tier === newTier;
    return (
      <View style={[styles.iconCell, isHighlighted && styles.iconCellHighlighted]}>
        <Ionicons
          name={hasFeature ? 'checkmark-circle' : 'close-circle-outline'}
          size={20}
          color={hasFeature ? '#10B981' : '#D1D5DB'}
        />
      </View>
    );
  };

  const renderCashbackRow = () => (
    <View style={styles.row}>
      <View style={styles.featureCell}>
        <ThemedText style={styles.featureName}>Cashback Rate</ThemedText>
      </View>
      <View style={[styles.valueCell, currentTier === 'free' && styles.valueCellHighlighted]}>
        <ThemedText style={styles.cashbackValue}>1x</ThemedText>
      </View>
      <View style={[styles.valueCell, currentTier === 'premium' && styles.valueCellHighlighted]}>
        <ThemedText style={styles.cashbackValue}>2x</ThemedText>
      </View>
      <View style={[styles.valueCell, currentTier === 'vip' && styles.valueCellHighlighted]}>
        <ThemedText style={styles.cashbackValue}>3x</ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {!compact && <ThemedText style={styles.title}>Feature Comparison</ThemedText>}

      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.featureCell}>
            <ThemedText style={styles.headerText}>Feature</ThemedText>
          </View>
          <View style={[styles.headerCell, currentTier === 'free' && styles.headerCellHighlighted]}>
            <ThemedText style={styles.headerText}>Free</ThemedText>
          </View>
          <View style={[styles.headerCell, currentTier === 'premium' && styles.headerCellHighlighted]}>
            <ThemedText style={styles.headerText}>Premium</ThemedText>
          </View>
          <View style={[styles.headerCell, currentTier === 'vip' && styles.headerCellHighlighted]}>
            <ThemedText style={styles.headerText}>VIP</ThemedText>
          </View>
        </View>

        {/* Cashback Row */}
        <Animated.View style={{ opacity: rowAnims[0], transform: [{ translateY: rowAnims[0].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          {renderCashbackRow()}
        </Animated.View>

        {/* Feature Rows with staggered entrance */}
        {FEATURES.slice(1).map((feature, index) => (
          <Animated.View
            key={feature.name}
            style={{
              opacity: rowAnims[index + 1],
              transform: [{ translateY: rowAnims[index + 1].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <View style={styles.row}>
              <View style={styles.featureCell}>
                <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
              </View>
              {renderCheckIcon(feature.free, 'free')}
              {renderCheckIcon(feature.premium, 'premium')}
              {renderCheckIcon(feature.vip, 'vip')}
            </View>
          </Animated.View>
        ))}
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
    marginBottom: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  featureCell: {
    flex: 2,
    padding: 12,
    justifyContent: 'center',
  },
  headerCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCellHighlighted: {
    backgroundColor: '#8B5CF620',
  },
  valueCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueCellHighlighted: {
    backgroundColor: '#8B5CF610',
  },
  iconCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCellHighlighted: {
    backgroundColor: '#8B5CF610',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
  },
  featureName: {
    fontSize: 14,
    color: '#374151',
  },
  cashbackValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default React.memo(FeatureComparisonTable);
