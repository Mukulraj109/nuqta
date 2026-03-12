/**
 * Pay In Store - Offers Screen
 *
 * Displays available offers including:
 * - Store-specific offers
 * - Bank offers
 * - ReZ rewards/offers
 * - Best value recommendation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import {
  OffersScreenParams,
  StorePaymentOffer,
  OffersResponse,
  OfferSource,
} from '@/types/storePayment.types';
import apiClient from '@/services/apiClient';
import { useRegion } from '@/contexts/RegionContext';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/constants/brand';

type TabKey = 'all' | 'store' | 'bank' | 'rez';

export default function OffersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<OffersScreenParams>();
  const { storeId, storeName, storeLogo, amount } = params;
  const numericAmount = parseFloat(amount || '0');
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const { state: { isAuthenticated, isLoading: authLoading } } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [offers, setOffers] = useState<OffersResponse | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<StorePaymentOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadOffers();
  }, [storeId, amount, authLoading, isAuthenticated]);

  const loadOffers = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const response = await apiClient.get<OffersResponse>(`/store-payment/offers/${storeId}`, { amount: numericAmount });

      if (response.success && response.data) {
        setOffers(response.data);

        // Auto-select best offer
        if (response.data.bestOffer) {
          setSelectedOffers([response.data.bestOffer]);
        }
      } else {
        setError(response.error || 'Failed to load offers');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getFilteredOffers = (): StorePaymentOffer[] => {
    if (!offers) return [];

    switch (activeTab) {
      case 'store':
        return offers.storeOffers;
      case 'bank':
        return offers.bankOffers;
      case 'rez':
        return offers.rezOffers;
      case 'all':
      default:
        return [
          ...offers.storeOffers,
          ...offers.bankOffers,
          ...offers.rezOffers,
        ];
    }
  };

  const toggleOfferSelection = (offer: StorePaymentOffer) => {
    const isSelected = selectedOffers.some((o) => o.id === offer.id);
    if (isSelected) {
      setSelectedOffers(selectedOffers.filter((o) => o.id !== offer.id));
    } else {
      // For now, only allow one offer at a time
      // In future, can allow stacking different offer types
      setSelectedOffers([offer]);
    }
  };

  const calculateTotalDiscount = (): number => {
    return selectedOffers.reduce((total, offer) => {
      if (offer.valueType === 'PERCENTAGE') {
        const discount = (numericAmount * offer.value) / 100;
        return total + (offer.maxDiscount ? Math.min(discount, offer.maxDiscount) : discount);
      }
      return total + offer.value;
    }, 0);
  };

  const handleContinue = () => {
    router.push({
      pathname: '/pay-in-store/payment',
      params: {
        storeId,
        storeName,
        storeLogo,
        amount,
        selectedOffers: JSON.stringify(selectedOffers.map((o) => o.id)),
      },
    });
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    {
      key: 'all',
      label: 'All Offers',
      count: offers
        ? offers.storeOffers.length + offers.bankOffers.length + offers.rezOffers.length
        : 0,
    },
    { key: 'store', label: 'Store', count: offers?.storeOffers.length || 0 },
    { key: 'bank', label: 'Bank', count: offers?.bankOffers.length || 0 },
    { key: 'rez', label: BRAND.APP_NAME, count: offers?.rezOffers.length || 0 },
  ];

  const filteredOffers = getFilteredOffers();
  const totalDiscount = calculateTotalDiscount();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Available Offers</Text>
          <Text style={styles.headerSubtitle}>
            {storeName} • {currencySymbol}{numericAmount.toFixed(0)}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={[styles.tabBadge, activeTab === tab.key && styles.activeTabBadge]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      activeTab === tab.key && styles.activeTabBadgeText,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Finding best offers...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error[500]} />
          <Text style={styles.errorTitle}>Couldn't load offers</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadOffers()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadOffers(true)}
              colors={[COLORS.primary[500]]}
            />
          }
        >
          {/* Best Offer Banner */}
          {offers?.bestOffer && activeTab === 'all' && (
            <Pressable
              style={styles.bestOfferBanner}
              onPress={() => toggleOfferSelection(offers.bestOffer!)}
            >
              <LinearGradient
                colors={[COLORS.secondary[500], COLORS.secondary[600]]}
                style={styles.bestOfferGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.bestOfferContent}>
                  <View style={styles.bestOfferBadge}>
                    <Ionicons name="trophy" size={14} color="#FFFFFF" />
                    <Text style={styles.bestOfferBadgeText}>BEST VALUE</Text>
                  </View>
                  <Text style={styles.bestOfferTitle}>{offers.bestOffer.title}</Text>
                  <Text style={styles.bestOfferValue}>
                    {offers.bestOffer.valueType === 'PERCENTAGE'
                      ? `${offers.bestOffer.value}% OFF`
                      : `${currencySymbol}${offers.bestOffer.value} OFF`}
                  </Text>
                </View>
                <View style={styles.bestOfferCheck}>
                  {selectedOffers.some((o) => o.id === offers.bestOffer!.id) ? (
                    <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          )}

          {/* Offers List */}
          {filteredOffers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={48} color={COLORS.neutral[300]} />
              <Text style={styles.emptyStateTitle}>No offers available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for exclusive offers
              </Text>
            </View>
          ) : (
            <View style={styles.offersList}>
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  billAmount={numericAmount}
                  isSelected={selectedOffers.some((o) => o.id === offer.id)}
                  onPress={() => toggleOfferSelection(offer)}
                  currencySymbol={currencySymbol}
                />
              ))}
            </View>
          )}

          <View style={{ height: 140 }} />
        </ScrollView>
      )}

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {selectedOffers.length > 0 && (
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsLabel}>You'll save</Text>
            <Text style={styles.savingsValue}>{currencySymbol}{Math.floor(totalDiscount)}</Text>
          </View>
        )}
        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>
            {selectedOffers.length > 0 ? 'Apply & Continue' : 'Skip & Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Offer Card Component
interface OfferCardProps {
  offer: StorePaymentOffer;
  billAmount: number;
  isSelected: boolean;
  onPress: () => void;
  currencySymbol: string;
}

function OfferCard({ offer, billAmount, isSelected, onPress, currencySymbol }: OfferCardProps) {
  const isEligible = !offer.minAmount || billAmount >= offer.minAmount;

  const getSourceIcon = (source: OfferSource): string => {
    switch (source) {
      case 'STORE':
        return 'storefront';
      case 'BANK':
        return 'card';
      case 'REZ':
        return 'diamond';
      default:
        return 'pricetag';
    }
  };

  const getSourceColor = (source: OfferSource): string => {
    switch (source) {
      case 'STORE':
        return COLORS.primary[500];
      case 'BANK':
        return COLORS.info[500];
      case 'REZ':
        return COLORS.secondary[500];
      default:
        return COLORS.neutral[500];
    }
  };

  const calculateDiscount = (): number => {
    if (offer.valueType === 'PERCENTAGE') {
      const discount = (billAmount * offer.value) / 100;
      return offer.maxDiscount ? Math.min(discount, offer.maxDiscount) : discount;
    }
    return Math.min(offer.value, billAmount);
  };

  return (
    <Pressable
      style={[
        styles.offerCard,
        isSelected && styles.offerCardSelected,
        !isEligible && styles.offerCardDisabled,
      ]}
      onPress={onPress}
      disabled={!isEligible}
    >
      <View style={styles.offerCardContent}>
        {/* Source Badge */}
        <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(offer.source) + '20' }]}>
          <Ionicons
            name={getSourceIcon(offer.source) as any}
            size={14}
            color={getSourceColor(offer.source)}
          />
          <Text style={[styles.sourceBadgeText, { color: getSourceColor(offer.source) }]}>
            {offer.source}
          </Text>
        </View>

        {/* Offer Info */}
        <Text style={styles.offerTitle}>{offer.title}</Text>
        <Text style={styles.offerDescription} numberOfLines={2}>
          {offer.description}
        </Text>

        {/* Value & Savings */}
        <View style={styles.offerValueRow}>
          <Text style={styles.offerValue}>
            {offer.valueType === 'PERCENTAGE'
              ? `${offer.value}% OFF`
              : offer.valueType === 'FIXED_COINS'
              ? `${offer.value} Coins`
              : `${currencySymbol}${offer.value} OFF`}
          </Text>
          {isEligible && (
            <Text style={styles.offerSavings}>Save {currencySymbol}{Math.floor(calculateDiscount())}</Text>
          )}
        </View>

        {/* Conditions */}
        {offer.minAmount && (
          <Text style={[styles.offerCondition, !isEligible && styles.offerConditionUnmet]}>
            {isEligible
              ? `✓ Min. order ${currencySymbol}${offer.minAmount}`
              : `Add ${currencySymbol}${offer.minAmount - billAmount} more to unlock`}
          </Text>
        )}

        {offer.maxDiscount && (
          <Text style={styles.offerCondition}>Max discount: {currencySymbol}{offer.maxDiscount}</Text>
        )}

        {offer.bankName && (
          <Text style={styles.offerCondition}>Only on {offer.bankName} cards</Text>
        )}
      </View>

      {/* Selection Indicator */}
      <View style={styles.offerSelection}>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary[500]} />
        ) : isEligible ? (
          <Ionicons name="ellipse-outline" size={24} color={COLORS.neutral[300]} />
        ) : (
          <Ionicons name="lock-closed" size={20} color={COLORS.neutral[400]} />
        )}
      </View>

      {/* Best Offer Badge */}
      {offer.isBestOffer && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>BEST</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: COLORS.background.primary,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.neutral[100],
  },
  activeTab: {
    backgroundColor: COLORS.primary[500],
  },
  tabText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.neutral[200],
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.text.secondary,
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary[500],
    borderRadius: BORDER_RADIUS.lg,
  },
  retryButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  bestOfferBanner: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  bestOfferGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  bestOfferContent: {
    flex: 1,
  },
  bestOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bestOfferBadgeText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 4,
  },
  bestOfferTitle: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
  bestOfferValue: {
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
    marginTop: SPACING.xs,
  },
  bestOfferCheck: {
    marginLeft: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  offersList: {
    gap: SPACING.md,
  },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  offerCardSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  offerCardDisabled: {
    opacity: 0.6,
  },
  offerCardContent: {
    flex: 1,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  sourceBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  offerTitle: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  offerDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  offerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  offerValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary[600],
  },
  offerSavings: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success[600],
    fontWeight: '600',
  },
  offerCondition: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  offerConditionUnmet: {
    color: COLORS.warning[600],
  },
  offerSelection: {
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  bestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.secondary[500],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  bestBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.md,
  },
  savingsInfo: {
    alignItems: 'center',
  },
  savingsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  savingsValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.success[600],
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary[500],
    gap: SPACING.sm,
  },
  continueButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
});
