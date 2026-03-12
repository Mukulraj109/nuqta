import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoyaltyFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  iconBgColor: string;
  iconColor: string;
}

const loyaltyFeatures: LoyaltyFeature[] = [
  {
    icon: 'trophy-outline',
    text: 'Visit-based rewards',
    iconBgColor: '#EDE9FE',
    iconColor: '#8B5CF6',
  },
  {
    icon: 'layers-outline',
    text: 'Tier benefits',
    iconBgColor: '#DBEAFE',
    iconColor: '#3B82F6',
  },
  {
    icon: 'gift-outline',
    text: 'Exclusive offers',
    iconBgColor: '#D1FAE5',
    iconColor: '#059669',
  },
];

interface Example {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const examples: Example[] = [
  { icon: 'checkmark-circle', text: 'Free service on 5th visit' },
  { icon: 'checkmark-circle', text: 'Higher cashback for Gold users' },
  { icon: 'checkmark-circle', text: 'Birthday / special rewards' },
];

const LoyaltySection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="ribbon" size={28} color="#6366F1" />
        </View>
        <Text style={styles.sectionTitle}>Loyalty that actually matters</Text>
      </View>

      {/* Features Card */}
      <View style={styles.featuresCard}>
        <Text style={styles.cardSubtitle}>Each brand on ReZ has:</Text>

        <View style={styles.featuresContainer}>
          {loyaltyFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.iconContainer, { backgroundColor: feature.iconBgColor }]}>
                <Ionicons name={feature.icon} size={18} color={feature.iconColor} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Examples Card */}
      <View style={styles.examplesCard}>
        <Text style={styles.examplesTitle}>Examples:</Text>

        <View style={styles.examplesContainer}>
          {examples.map((example, index) => (
            <View key={index} style={styles.exampleRow}>
              <Ionicons name={example.icon} size={18} color="#059669" />
              <Text style={styles.exampleText}>{example.text}</Text>
            </View>
          ))}
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            No punch cards. Everything is tracked automatically.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
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
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 14,
  },
  featuresContainer: {
    gap: 12,
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
    fontWeight: '500',
  },
  examplesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 14,
  },
  examplesContainer: {
    gap: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exampleText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  quoteContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quoteText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default LoyaltySection;
