import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LockFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  highlight?: string;
  iconBgColor: string;
  iconColor: string;
}

const lockFeatures: LockFeature[] = [
  {
    icon: 'pricetag-outline',
    text: 'Pay ',
    highlight: 'only 10%',
    iconBgColor: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    icon: 'time-outline',
    text: 'Lock the price for a few hours',
    iconBgColor: '#FFEDD5',
    iconColor: '#EA580C',
  },
  {
    icon: 'car-outline',
    text: 'Visit store or get delivery later',
    iconBgColor: '#FEE2E2',
    iconColor: '#DC2626',
  },
];

interface CategoryChip {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const categoryChips: CategoryChip[] = [
  { icon: 'tv-outline', label: 'Electronics' },
  { icon: 'shirt-outline', label: 'Fashion' },
  { icon: 'diamond-outline', label: 'High-value' },
];

const ProductLockSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={28} color="#F97316" />
        </View>
        <Text style={styles.sectionTitle}>Lock products before you decide</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardSubtitle}>If you like a product:</Text>

        <View style={styles.featuresContainer}>
          {lockFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.iconContainer, { backgroundColor: feature.iconBgColor }]}>
                <Ionicons name={feature.icon} size={18} color={feature.iconColor} />
              </View>
              <Text style={styles.featureText}>
                {feature.text}
                {feature.highlight && (
                  <Text style={styles.highlightText}>{feature.highlight}</Text>
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Category Chips */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsLabel}>Great for:</Text>
          <View style={styles.chipsContainer}>
            {categoryChips.map((chip, index) => (
              <View key={index} style={styles.chip}>
                <Ionicons name={chip.icon} size={16} color="#6B7280" />
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Platform.select({
      ios: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 16,
    fontWeight: '500',
  },
  featuresContainer: {
    gap: 14,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  highlightText: {
    fontWeight: '700',
    color: '#D97706',
  },
  chipsSection: {
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    paddingTop: 16,
  },
  chipsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});

export default ProductLockSection;
