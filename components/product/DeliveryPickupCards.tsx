/**
 * DeliveryPickupCards Component
 *
 * Two side-by-side cards comparing:
 * - Delivery: 60-min delivery, Live tracking, Easy cancellation
 * - Pickup: Reserved at store, Skip waiting, Faster checkout
 *
 * Based on reference design from ProductPage redesign
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DeliveryPickupCardsProps {
  /** Custom style */
  style?: any;
}

// Delivery features
const DELIVERY_FEATURES = [
  '60-min delivery',
  'Live tracking',
  'Easy cancellation',
];

// Pickup features
const PICKUP_FEATURES = [
  'Reserved at store',
  'Skip waiting',
  'Faster checkout',
];

export const DeliveryPickupCards: React.FC<DeliveryPickupCardsProps> = ({
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Delivery & Pickup</Text>

      <View style={styles.cardsRow}>
        {/* Delivery Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#F3E8FF', '#E9D5FF']}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="bicycle" size={26} color="#A855F7" />
            </View>
          </LinearGradient>

          <Text style={styles.cardTitle}>Delivery</Text>

          <View style={styles.featuresList}>
            {DELIVERY_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark" size={14} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pickup Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#CCFBF1', '#A7F3D0']}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="storefront" size={26} color="#14B8A6" />
            </View>
          </LinearGradient>

          <Text style={styles.cardTitle}>Pickup</Text>

          <View style={styles.featuresList}>
            {PICKUP_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark" size={14} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
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
    marginHorizontal: 16,
    marginVertical: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  cardGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  featuresList: {
    gap: 8,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  featureText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
});

export default React.memo(DeliveryPickupCards);
