/**
 * Beauty & Wellness Section - Production Ready
 * Connected to API for real data with fallback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import storesApi from '@/services/storesApi';
import categoriesApi from '@/services/categoriesApi';

const COLORS = {
  white: '#FFFFFF',
  navy: '#1a3a52',
  gray600: '#6B7280',
  nileBlue: '#1a3a52',
  lightPeach: '#ffd7b5',
  lightMustard: '#ffcd57',
};

// Card configurations with API tags - Nuqta palette
const cardConfigs = [
  {
    id: 'salon',
    title: 'Salon & Spa',
    subtitle: 'Hair, nails, skin treatments',
    icon: '💇‍♀️',
    route: '/beauty/salon',
    tags: ['salon', 'spa', 'beauty'],
    gradientColors: ['#ffd7b5', '#E8B896', '#D4A07A'] as const,
    iconBgColor: 'rgba(255, 215, 181, 0.3)',
    badgeColor: '#1a3a52',
    textColor: '#1a3a52',
    defaultDiscount: '30% OFF',
    defaultCount: '350+ Partners',
  },
  {
    id: 'products',
    title: 'Beauty Products',
    subtitle: 'Makeup, skincare, haircare',
    icon: '💄',
    route: '/beauty/products',
    tags: ['cosmetics', 'makeup', 'skincare'],
    gradientColors: ['#faf1e0', '#ffd7b5', '#E8B896'] as const,
    iconBgColor: 'rgba(255, 205, 87, 0.3)',
    badgeColor: '#ffcd57',
    textColor: '#1a3a52',
    defaultDiscount: '25% OFF',
    defaultCount: '500+ Brands',
  },
  {
    id: 'wellness',
    title: 'Wellness',
    subtitle: 'Massage, therapy, relaxation',
    icon: '🧘',
    route: '/beauty/wellness',
    tags: ['wellness', 'yoga', 'meditation'],
    gradientColors: ['#dfebf7', '#cce0f2', '#b8d4ed'] as const,
    iconBgColor: 'rgba(26, 58, 82, 0.2)',
    badgeColor: '#1a3a52',
    textColor: '#1a3a52',
    defaultDiscount: '20% OFF',
    defaultCount: '200+ Centers',
  },
];

interface CardData {
  id: string;
  discount: string;
  count: string;
  maxCashback: number;
}

const BeautyWellnessSection: React.FC = () => {
  const router = useRouter();
  const [cardData, setCardData] = useState<Record<string, CardData>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from API
  const fetchData = useCallback(async () => {
    try {
      const dataPromises = cardConfigs.map(async (config) => {
        try {
          const response = await storesApi.getStores({
            tags: config.tags,
            limit: 1,
          });

          if (response.success && response.data) {
            const total = response.data.pagination?.total || 0;
            // Calculate max cashback from stores
            const maxCashback = response.data.stores?.reduce((max: number, store: any) => {
              const cashback = store.offers?.cashback?.percentage || store.cashback?.maxPercentage || 0;
              return Math.max(max, cashback);
            }, 0) || 0;

            return {
              id: config.id,
              discount: maxCashback > 0 ? `${maxCashback}% OFF` : config.defaultDiscount,
              count: total > 0 ? `${total}+ ${config.id === 'products' ? 'Brands' : 'Partners'}` : config.defaultCount,
              maxCashback,
            };
          }
        } catch (err) {
          // silently handle
        }
        return {
          id: config.id,
          discount: config.defaultDiscount,
          count: config.defaultCount,
          maxCashback: 0,
        };
      });

      const results = await Promise.all(dataPromises);
      const dataMap: Record<string, CardData> = {};
      results.forEach((result) => {
        dataMap[result.id] = result;
      });
      setCardData(dataMap);
    } catch (err) {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewAll = () => {
    router.push('/beauty' as any);
  };

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const getCardData = (configId: string) => {
    return cardData[configId] || {
      discount: cardConfigs.find(c => c.id === configId)?.defaultDiscount || '20% OFF',
      count: cardConfigs.find(c => c.id === configId)?.defaultCount || '100+ Partners',
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💄 Beauty & Wellness</Text>
          <Text style={styles.headerSubtitle}>Pamper yourself, save more</Text>
        </View>
        <Pressable onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Pressable>
      </View>

      {/* Cards Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cardConfigs.map((config) => {
          const data = getCardData(config.id);
          return (
            <Pressable
              key={config.id}
              style={styles.mainCard}
              onPress={() => handlePress(config.route)}
             
            >
              <LinearGradient
                colors={config.gradientColors}
                style={styles.mainCardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: config.iconBgColor }]}>
                    <Text style={styles.icon}>{config.icon}</Text>
                  </View>
                  <View style={[styles.discountBadge, { backgroundColor: config.badgeColor }]}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.discountText}>{data.discount}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.cardTitle}>{config.title}</Text>
                <Text style={styles.cardSubtitle}>{config.subtitle}</Text>
                <Text style={[styles.partnersText, { color: config.textColor }]}>
                  {isLoading ? 'Loading...' : data.count}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.nileBlue,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mainCard: {
    width: 180,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mainCardGradient: {
    padding: 16,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 12,
  },
  partnersText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BeautyWellnessSection;
