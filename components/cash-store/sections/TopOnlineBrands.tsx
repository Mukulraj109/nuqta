/**
 * TopOnlineBrands Component
 *
 * Horizontal scrolling brand cards with glassmorphism design
 * Warm peach palette with frosted glass cards
 */

import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  FlatList,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CashStoreBrand } from '../../../types/cash-store.types';

interface TopOnlineBrandsProps {
  brands: CashStoreBrand[];
  isLoading?: boolean;
  onBrandPress: (brand: CashStoreBrand) => void;
  onViewAllPress: () => void;
  totalBrandsCount?: number;
  activeFilter?: string;
  onResetFilter?: () => void;
}

// ─── Brand Card (Glassmorphism) ─────────────────────────────
const BrandCard: React.FC<{
  brand: CashStoreBrand;
  index: number;
  onPress: () => void;
}> = memo(({ brand, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.94,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const isHot = brand.cashbackRate && brand.cashbackRate >= 10;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
        style={styles.cardTouchable}
      >
        {/* Glassmorphism card background */}
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,245,238,0.7)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Hot indicator */}
          {isHot && (
            <View style={styles.hotDot}>
              <Ionicons name="flame" size={7} color="#FFFFFF" />
            </View>
          )}

          {/* Logo */}
          <View style={styles.logoArea}>
            {brand.logo?.startsWith('http') ? (
              <CachedImage
                source={brand.logo}
                style={styles.logo}
                contentFit="contain"
              />
            ) : brand.logo ? (
              <Text style={{ fontSize: 28 }}>{brand.logo}</Text>
            ) : (
              <LinearGradient
                colors={['#ffd7b5', '#E8B896']}
                style={styles.logoPlaceholder}
              >
                <Text style={styles.logoInitial}>{brand.name.charAt(0)}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Brand Name */}
          <Text style={styles.brandName} numberOfLines={1}>
            {brand.name}
          </Text>

          {/* Cashback - prominent */}
          <View style={styles.cashbackPill}>
            <Text style={styles.cashbackPercent}>
              {brand.cashbackRate || 0}%
            </Text>
          </View>

          {/* Rating */}
          {brand.rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={9} color="#D4A07A" />
              <Text style={styles.ratingText}>{brand.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

// ─── Skeleton Card ──────────────────────────────────────────
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
    <View style={styles.cardWrapper}>
      <Animated.View
        style={[
          styles.card,
          styles.skeletonCard,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          },
        ]}
      >
        <View style={[styles.logoArea, styles.skeletonBg]} />
        <View style={[styles.skeletonLine, { width: 56 }]} />
        <View style={[styles.skeletonLine, { width: 40, marginTop: 6 }]} />
      </Animated.View>
    </View>
  );
});

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC<{ onViewAllPress: () => void }> = memo(({ onViewAllPress }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name="storefront-outline" size={28} color="#D4A07A" />
    </View>
    <Text style={styles.emptyTitle}>Discover Top Brands</Text>
    <Text style={styles.emptySubtitle}>Shop online and earn cashback</Text>
    <Pressable onPress={onViewAllPress}>
      <LinearGradient colors={['#1a3a52', '#234b68']} style={styles.emptyCTA}>
        <Text style={styles.emptyCTAText}>Explore Brands</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  </View>
));

// ─── Filter Names + Empty State ─────────────────────────────
const FILTER_DISPLAY_NAMES: Record<string, string> = {
  'all': 'All', 'most-popular': 'Popular', 'high-cashback': 'High Cashback',
  'fashion': 'Fashion', 'electronics': 'Electronics', 'food': 'Food',
  'travel': 'Travel', 'beauty': 'Beauty', 'shopping': 'Shopping',
  'groceries': 'Groceries', 'entertainment': 'Entertainment', 'finance': 'Finance',
};

const FilteredEmptyState: React.FC<{
  filterName: string;
  onResetFilter?: () => void;
}> = memo(({ filterName, onResetFilter }) => {
  const displayName = FILTER_DISPLAY_NAMES[filterName] || filterName;
  return (
    <View style={styles.filteredEmptyContainer}>
      <Ionicons name="search-outline" size={28} color="#D1D5DB" />
      <Text style={styles.filteredEmptyTitle}>No brands found</Text>
      <Text style={styles.filteredEmptySubtitle}>
        No brands match "{displayName}". Try another category.
      </Text>
      {onResetFilter && (
        <Pressable onPress={onResetFilter} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={14} color="#1a3a52" />
          <Text style={styles.resetBtnText}>Show All</Text>
        </Pressable>
      )}
    </View>
  );
});

// ─── Main Component ─────────────────────────────────────────
const TopOnlineBrands: React.FC<TopOnlineBrandsProps> = ({
  brands,
  isLoading = false,
  onBrandPress,
  onViewAllPress,
  totalBrandsCount,
  activeFilter,
  onResetFilter,
}) => {
  const displayBrands = brands.slice(0, 12);
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  const displayCount = totalBrandsCount
    ? (totalBrandsCount >= 1000 ? '1000+' : `${totalBrandsCount}+`)
    : (brands.length > 0 ? `${brands.length}+` : null);

  useEffect(() => {
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const hasActiveFilter = activeFilter && activeFilter !== 'all';
  const hasNoBrands = !isLoading && brands.length === 0;
  const isFilteredEmpty = hasNoBrands && hasActiveFilter;

  const renderBrandCard = ({ item, index }: { item: CashStoreBrand; index: number }) => (
    <BrandCard brand={item} index={index} onPress={() => onBrandPress(item)} />
  );

  return (
    <View style={styles.outerContainer}>
      {/* Frosted glass container */}
      <LinearGradient
        colors={['rgba(255,255,255,0.75)', 'rgba(255,240,230,0.5)', 'rgba(255,255,255,0.65)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Subtle decorative circles */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Top Online Brands</Text>
              {displayCount && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{displayCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>Earn cashback on every purchase</Text>
          </View>
          <Pressable
            onPress={onViewAllPress}
            style={styles.viewAllBtn}
           
          >
            <Text style={styles.viewAllText}>See All</Text>
            <View style={styles.viewAllArrow}>
              <Ionicons name="chevron-forward" size={12} color="#1a3a52" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Content */}
        {isFilteredEmpty ? (
          <FilteredEmptyState filterName={activeFilter} onResetFilter={onResetFilter} />
        ) : hasNoBrands ? (
          <EmptyState onViewAllPress={onViewAllPress} />
        ) : isLoading ? (
          <FlatList
            data={Array.from({ length: 6 })}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyExtractor={(_, i) => `skeleton-${i}`}
            renderItem={({ index }) => <SkeletonCard index={index} />}
          />
        ) : (
          <FlatList
            data={displayBrands}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyExtractor={(item) => item.id}
            renderItem={renderBrandCard}
          />
        )}
      </LinearGradient>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A07A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  container: {
    paddingTop: 18,
    paddingBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,181,0.35)',
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Decorative ──
  decoCircle1: {
    position: 'absolute',
    top: -20,
    right: -15,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,181,0.15)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(232,184,150,0.1)',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3a52',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: 'rgba(212,160,122,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A07A',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,122,0.2)',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a3a52',
  },
  viewAllArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(212,160,122,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 2,
  },

  // ── Card ──
  cardWrapper: {
    width: 115,
  },
  cardTouchable: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A07A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  card: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,181,0.3)',
  },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(0,0,0,0.04)',
  },

  // ── Logo ──
  logoArea: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  logo: {
    width: 38,
    height: 38,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hotDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  // ── Text ──
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a3a52',
    textAlign: 'center',
    marginBottom: 5,
  },
  cashbackPill: {
    backgroundColor: 'rgba(212,160,122,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cashbackPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4A07A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B0B0B0',
  },

  // ── Skeleton ──
  skeletonBg: {
    backgroundColor: '#E5E7EB',
  },
  skeletonLine: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 4,
  },

  // ── Empty States ──
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(212,160,122,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
  },
  emptyCTAText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filteredEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  filteredEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3a52',
    marginTop: 8,
    marginBottom: 4,
  },
  filteredEmptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 14,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3a52',
  },
});

export default memo(TopOnlineBrands);
