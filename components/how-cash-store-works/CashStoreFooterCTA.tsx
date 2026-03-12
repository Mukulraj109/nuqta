/**
 * CashStoreFooterCTA Component
 *
 * Footer call-to-action for the How Cash Store Works page
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRegion } from '@/contexts/RegionContext';

const CashStoreFooterCTA: React.FC = () => {
  const router = useRouter();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const handleStartShopping = () => {
    router.replace('/(tabs)');
  };

  const handleViewBrands = () => {
    // Navigate to all brands/stores page if it exists
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffcd57', '#1a3a52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.coinIcon}>
            <Ionicons name="sparkles" size={32} color="#FFC857" />
          </View>

          <Text style={styles.title}>Ready to Start Earning?</Text>
          <Text style={styles.subtitle}>
            Join thousands of smart shoppers saving money on every purchase
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currencySymbol}2Cr+</Text>
              <Text style={styles.statLabel}>Cashback Given</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1000+</Text>
              <Text style={styles.statLabel}>Brands</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>50K+</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaButtons}>
            <Pressable
              style={styles.primaryButton}
              onPress={handleStartShopping}
             
            >
              <Ionicons name="cart" size={20} color="#1a3a52" />
              <Text style={styles.primaryButtonText}>Start Shopping</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleViewBrands}
             
            >
              <Text style={styles.secondaryButtonText}>View All Brands</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Bottom Padding for safe area */}
      <View style={styles.bottomPadding} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  coinIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  ctaButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a52',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 16,
  },
});

export default memo(CashStoreFooterCTA);
