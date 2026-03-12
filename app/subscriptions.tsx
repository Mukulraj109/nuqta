/**
 * Subscriptions Page
 * Shows available subscription tiers and user's current subscription.
 * Wired to real backend: GET /api/subscriptions/tiers (public) and GET /api/subscriptions/current (auth).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegion } from '@/contexts/RegionContext';
import { useAuth } from '@/contexts/AuthContext';
import subscriptionApi from '@/services/subscriptionApi';
import type { SubscriptionTier, CurrentSubscription } from '@/services/subscriptionApi';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const isAuthenticated = authState.isAuthenticated;
  const authLoading = authState.isLoading;
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Always fetch tiers (public endpoint)
      const tiersData = await subscriptionApi.getAvailableTiers();
      setTiers(tiersData || []);

      // Fetch current subscription only if authenticated
      if (isAuthenticated && !authLoading) {
        try {
          const subData = await subscriptionApi.getCurrentSubscription();
          setCurrentSub(subData || null);
        } catch {
          // User may not have a subscription — that's fine
          setCurrentSub(null);
        }
      }
    } catch (err: any) {
      setError('Unable to load subscription plans. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [fetchData, authLoading]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const getSelectedPrice = () => {
    if (!selectedTier) return 0;
    return selectedCycle === 'yearly'
      ? selectedTier.pricing.yearly
      : selectedTier.pricing.monthly;
  };

  const handleSubscribe = () => {
    if (!selectedTier) return;
    router.push(
      `/payment?type=subscription&tier=${selectedTier.tier}&cycle=${selectedCycle}&amount=${getSelectedPrice()}` as any
    );
  };

  const getDaysRemaining = () => {
    if (!currentSub?.endDate) return 0;
    const diff = new Date(currentSub.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return Colors.text.secondary;
      case 'premium': return Colors.gold;
      case 'vip': return '#8B5CF6';
      default: return Colors.text.primary;
    }
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconCircle}>
            <Ionicons name="card-outline" size={36} color={Colors.gold} />
          </View>
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: Spacing.lg }} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />
        }
      >
        {/* Banner */}
        <View style={styles.banner}>
          <LinearGradient
            colors={['rgba(236, 72, 153, 0.15)', 'rgba(139, 92, 246, 0.15)']}
            style={styles.bannerGradient}
          >
            <Ionicons name="diamond-outline" size={32} color="#8B5CF6" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Unlock Premium Benefits</Text>
              <Text style={styles.bannerSubtitle}>
                Get more cashback, free delivery, and exclusive perks
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Error state */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.warning} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Current Subscription */}
        {currentSub && currentSub.status !== 'cancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Current Plan</Text>
            <View style={styles.activeCard}>
              <View style={[styles.activeIcon, { backgroundColor: getTierColor(currentSub.tier) + '20' }]}>
                <Ionicons
                  name={currentSub.tier === 'vip' ? 'diamond' : currentSub.tier === 'premium' ? 'star' : 'person'}
                  size={24}
                  color={getTierColor(currentSub.tier)}
                />
              </View>
              <View style={styles.activeInfo}>
                <Text style={styles.activePlatform}>
                  {currentSub.tier.charAt(0).toUpperCase() + currentSub.tier.slice(1)}
                </Text>
                <Text style={styles.activePlan}>
                  {currentSub.billingCycle} &middot; {currentSub.status}
                </Text>
              </View>
              <View style={styles.activeExpiry}>
                <Text style={styles.activeExpiryLabel}>Expires in</Text>
                <Text style={styles.activeExpiryValue}>
                  {getDaysRemaining()} days
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty state for no tiers */}
        {tiers.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="card-outline" size={36} color={Colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Plans Available</Text>
            <Text style={styles.emptyText}>
              Subscription plans are not available yet.{'\n'}Please check back later.
            </Text>
          </View>
        )}

        {/* Billing Cycle Toggle */}
        {tiers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Plan</Text>
            <View style={styles.cycleToggle}>
              <Pressable
                style={[styles.cycleButton, selectedCycle === 'monthly' && styles.cycleButtonActive]}
                onPress={() => setSelectedCycle('monthly')}
              >
                <Text style={[styles.cycleButtonText, selectedCycle === 'monthly' && styles.cycleButtonTextActive]}>
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                style={[styles.cycleButton, selectedCycle === 'yearly' && styles.cycleButtonActive]}
                onPress={() => setSelectedCycle('yearly')}
              >
                <Text style={[styles.cycleButtonText, selectedCycle === 'yearly' && styles.cycleButtonTextActive]}>
                  Yearly
                </Text>
                {tiers.some(t => t.pricing.yearlyDiscount > 0) && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>Save up to {Math.max(...tiers.map(t => t.pricing.yearlyDiscount))}%</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Plan Cards */}
        {tiers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.plansList}>
              {tiers.map((tier) => {
                const price = selectedCycle === 'yearly' ? tier.pricing.yearly : tier.pricing.monthly;
                const isSelected = selectedTier?.tier === tier.tier;
                const isCurrent = currentSub?.tier === tier.tier;
                return (
                  <Pressable
                    key={tier.tier}
                    style={[styles.planCard, isSelected && styles.planCardActive]}
                    onPress={() => setSelectedTier(tier)}
                  >
                    <View style={styles.planHeader}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                          <Text style={styles.planName}>{tier.name}</Text>
                          {isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planDuration}>/{selectedCycle === 'yearly' ? 'year' : 'month'}</Text>
                      </View>
                      <View style={styles.planPricing}>
                        <Text style={styles.planPrice}>
                          {currencySymbol}{price.toFixed(2)}
                        </Text>
                        {selectedCycle === 'yearly' && tier.pricing.yearlyDiscount > 0 && (
                          <View style={styles.planCashback}>
                            <Text style={styles.planCashbackText}>
                              {tier.pricing.yearlyDiscount}% off
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Features */}
                    {tier.features && tier.features.length > 0 && (
                      <View style={styles.featuresList}>
                        {tier.features.slice(0, 3).map((feature, idx) => (
                          <View key={idx} style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                        {tier.features.length > 3 && (
                          <Text style={styles.moreFeatures}>+{tier.features.length - 3} more benefits</Text>
                        )}
                      </View>
                    )}

                    {isSelected && (
                      <View style={styles.planSelected}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.gold} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Subscribe?</Text>
          <View style={styles.benefitsGrid}>
            {[
              { icon: 'cash-outline', title: 'More Cashback' },
              { icon: 'flash-outline', title: 'Priority Access' },
              { icon: 'shield-checkmark-outline', title: 'Exclusive Deals' },
              { icon: 'gift-outline', title: 'Bonus Coins' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <Ionicons name={benefit.icon as any} size={24} color={Colors.gold} />
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {selectedTier && (
        <View style={styles.bottomCta}>
          <View style={styles.summary}>
            <Text style={styles.summaryPlatform}>
              {selectedTier.name} &middot; {selectedCycle}
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryPrice}>
                {currencySymbol}{getSelectedPrice().toFixed(2)}
              </Text>
              {selectedCycle === 'yearly' && selectedTier.pricing.yearlyDiscount > 0 && (
                <Text style={styles.summarySavings}>
                  Save {selectedTier.pricing.yearlyDiscount}%
                </Text>
              )}
            </View>
          </View>
          <Pressable style={styles.buyButton} onPress={handleSubscribe}>
            <Text style={styles.buyButtonText}>Subscribe Now</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.background.primary} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
  // Empty
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.text.tertiary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: 10,
  },
  errorText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
  },
  // Banner
  banner: {
    margin: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  bannerSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  // Sections
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  // Cycle toggle
  cycleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  cycleButtonActive: {
    backgroundColor: Colors.gold,
  },
  cycleButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  cycleButtonTextActive: {
    color: Colors.text.inverse,
  },
  saveBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  // Plan cards
  plansList: {
    gap: Spacing.md,
  },
  planCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardActive: {
    borderColor: Colors.gold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  planName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  planDuration: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  planCashback: {
    backgroundColor: Colors.success + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  planCashbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  featuresList: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  moreFeatures: {
    ...Typography.bodySmall,
    color: Colors.gold,
    fontWeight: '500',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: Colors.gold + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gold,
  },
  planSelected: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  // Active subscription
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeInfo: {
    flex: 1,
  },
  activePlatform: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  activePlan: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  activeExpiry: {
    alignItems: 'flex-end',
  },
  activeExpiryLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  activeExpiryValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gold,
  },
  // Benefits
  benefitsSection: {
    margin: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: 120,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  benefitCard: {
    width: '50%',
    alignItems: 'center',
    padding: Spacing.base,
  },
  benefitTitle: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  // Bottom CTA
  bottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  summary: {},
  summaryPlatform: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summarySavings: {
    ...Typography.bodySmall,
    color: Colors.gold,
    fontWeight: '500',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buyButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
