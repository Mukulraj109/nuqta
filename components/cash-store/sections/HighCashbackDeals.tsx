/**
 * HighCashbackDeals Component
 *
 * Premium section showing high cashback deals (10%+) with animated percentage display
 * Features: Large animated numbers, gradient borders, Shop Now with arrow animation
 */

import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HighCashbackDeal, getBadgeColor } from '../../../types/cash-store.types';

interface HighCashbackDealsProps {
  deals: HighCashbackDeal[];
  isLoading?: boolean;
  onDealPress: (deal: HighCashbackDeal) => void;
  onViewAllPress: () => void;
}

const DealCard: React.FC<{
  deal: HighCashbackDeal;
  index: number;
  onPress: () => void;
}> = memo(({ deal, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const percentAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Staggered entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(percentAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay: index * 80 + 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Arrow animation
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    arrowLoop.start();
    return () => arrowLoop.stop();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const isLimitedStock = deal.badge === 'hot' || deal.badge === 'best-deal';

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
      >
        {/* Badge */}
        {deal.badge && (
          <LinearGradient
            colors={[getBadgeColor(deal.badge), getBadgeColor(deal.badge)]}
            style={styles.badge}
          >
            <Ionicons
              name={deal.badge === 'hot' ? 'flame' : 'star'}
              size={10}
              color="#FFFFFF"
            />
            <Text style={styles.badgeText}>{deal.badge.toUpperCase()}</Text>
          </LinearGradient>
        )}

        {/* Limited Stock Indicator */}
        {isLimitedStock && (
          <View style={styles.limitedStock}>
            <Ionicons name="warning" size={10} color="#D4A07A" />
            <Text style={styles.limitedStockText}>Limited</Text>
          </View>
        )}

        {/* Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            {deal.brand.logo?.startsWith('http') ? (
              <CachedImage
                source={deal.brand.logo}
                style={styles.brandLogo}
                contentFit="contain"
              />
            ) : deal.brand.logo ? (
              <Text style={{ fontSize: 28 }}>{deal.brand.logo}</Text>
            ) : (
              <LinearGradient
                colors={['#ffd7b5', '#E8B896']}
                style={styles.logoPlaceholder}
              >
                <Text style={styles.logoInitial}>{deal.brand.name.charAt(0)}</Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.brandInfo}>
            <Text style={styles.brandName} numberOfLines={1}>
              {deal.brand.name}
            </Text>
            <Text style={styles.dealTitle} numberOfLines={1}>
              {deal.title || 'Special Offer'}
            </Text>
          </View>
        </View>

        {/* Cashback Highlight - Animated */}
        <Animated.View
          style={[
            styles.cashbackHighlight,
            {
              transform: [{ scale: percentAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#E8B896', '#D4A07A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cashbackGradient}
          >
            <Text style={styles.cashbackRate}>{deal.cashbackRate}%</Text>
            <Text style={styles.cashbackLabel}>Cashback</Text>
          </LinearGradient>
        </Animated.View>

        {/* Bonus Coins */}
        {deal.bonusCoins && (
          <View style={styles.bonusRow}>
            <Ionicons name="flash" size={14} color="#ffcd57" />
            <Text style={styles.bonusText}>+{deal.bonusCoins} bonus coins</Text>
          </View>
        )}

        {/* Shop Now Button */}
        <Pressable style={styles.shopButton} onPress={onPress}>
          <LinearGradient
            colors={['#E8B896', '#D4A07A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shopButtonGradient}
          >
            <Text style={styles.shopButtonText}>Shop Now</Text>
            <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
});

const SkeletonCard: React.FC<{ index: number }> = memo(({ index }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.brandSection}>
          <View style={[styles.logoContainer, styles.skeleton]} />
          <View style={styles.brandInfo}>
            <View style={[styles.skeletonText, { width: 80 }]} />
            <View style={[styles.skeletonText, { width: 100 }]} />
          </View>
        </View>
        <View style={[styles.skeletonCashback]} />
        <View style={[styles.skeletonButton]} />
      </View>
    </Animated.View>
  );
});

const HighCashbackDeals: React.FC<HighCashbackDealsProps> = ({
  deals,
  isLoading = false,
  onDealPress,
  onViewAllPress,
}) => {
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const rocketAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Rocket bounce animation
    const rocketLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rocketAnim, {
          toValue: -4,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rocketAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    rocketLoop.start();
    return () => rocketLoop.stop();
  }, []);

  if (deals.length === 0 && !isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={['#E8B896', '#D4A07A']}
              style={styles.headerIconContainer}
            >
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.headerTitle}>High Cashback Deals</Text>
            <Animated.View style={{ transform: [{ translateY: rocketAnim }] }}>
              <Ionicons name="rocket" size={20} color="#E8B896" />
            </Animated.View>
          </View>
          <Text style={styles.subtitle}>10%+ cashback on these brands</Text>
        </View>
        <Pressable
          onPress={onViewAllPress}
          style={styles.viewAllButton}
         
        >
          <Text style={styles.viewAllText}>View All</Text>
          <View style={styles.viewAllArrow}>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>

      {/* Horizontal List */}
      <FlatList
        data={isLoading ? Array.from({ length: 3 }) : deals}
        renderItem={({ item, index }) =>
          isLoading ? (
            <SkeletonCard key={`skeleton-${index}`} index={index} />
          ) : (
            <DealCard
              deal={item as HighCashbackDeal}
              index={index}
              onPress={() => onDealPress(item as HighCashbackDeal)}
            />
          )
        }
        keyExtractor={(item, index) =>
          isLoading ? `skeleton-${index}` : (item as HighCashbackDeal).id
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3a52',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8B896',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewAllArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    marginRight: 12,
  },
  card: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 181, 0.3)',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#ffd7b5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  limitedStock: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf1e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    zIndex: 1,
  },
  limitedStockText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4A07A',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 24,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  brandLogo: {
    width: 34,
    height: 34,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 2,
  },
  dealTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cashbackHighlight: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cashbackGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  cashbackRate: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cashbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
    backgroundColor: '#faf1e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4A07A',
  },
  shopButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Skeleton
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  skeletonText: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonCashback: {
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 12,
  },
  skeletonButton: {
    height: 44,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
  },
});

export default memo(HighCashbackDeals);
