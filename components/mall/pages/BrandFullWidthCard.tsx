/**
 * BrandFullWidthCard Component
 *
 * Premium full-width list card for brand/store listings
 * with modern gradients, enhanced visuals, and premium styling
 */

import React, { memo, useState } from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MallBrand, BrandBadge, BrandTier } from '../../../types/mall.types';
import { useRegion } from '@/contexts/RegionContext';

interface BrandFullWidthCardProps {
  brand: MallBrand;
  onPress: (brand: MallBrand) => void;
  showRank?: boolean;
  rank?: number;
}

const BADGE_CONFIG: Record<BrandBadge, { colors: [string, string]; icon: string }> = {
  exclusive: { colors: ['#F59E0B', '#1a3a52'], icon: 'diamond' },
  premium: { colors: ['#1a3a52', '#234b68'], icon: 'star' },
  new: { colors: ['#F59E0B', '#F97316'], icon: 'sparkles' },
  trending: { colors: ['#F97316', '#F59E0B'], icon: 'trending-up' },
  'top-rated': { colors: ['#dfebf7', '#1a3a52'], icon: 'trophy' },
  verified: { colors: ['#F59E0B', '#1a3a52'], icon: 'checkmark-circle' },
};

const TIER_CONFIG: Record<BrandTier, { colors: [string, string]; icon: string }> = {
  standard: { colors: ['#9CA3AF', '#6B7280'], icon: 'storefront-outline' },
  premium: { colors: ['#1a3a52', '#234b68'], icon: 'diamond-outline' },
  exclusive: { colors: ['#F59E0B', '#1a3a52'], icon: 'ribbon-outline' },
  luxury: { colors: ['#F59E0B', '#D97706'], icon: 'crown-outline' },
};

const BrandFullWidthCard: React.FC<BrandFullWidthCardProps> = ({
  brand,
  onPress,
  showRank = false,
  rank = 0,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [imageError, setImageError] = useState(false);

  // For in-app stores (no externalUrl), show Nuqta Coins. For external brands, show cashback.
  const isInAppStore = !brand.externalUrl;
  const rewardPercentage = brand.cashback.percentage || 0;

  const tierConfig = TIER_CONFIG[brand.tier] || TIER_CONFIG.standard;

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Remove duplicate badges and filter out tier (already shown separately)
  const uniqueBadges = [...new Set(brand.badges)]
    .filter(badge => badge !== brand.tier)
    .slice(0, 2);

  // Determine if this is a top 3 rank
  const isTopThree = showRank && rank >= 1 && rank <= 3;

  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(brand)}
     
    >
      <View style={[styles.card, isTopThree && styles.topThreeCard]}>
        {/* Rank Badge (if showing rank) */}
        {showRank && rank > 0 && (
          <View style={styles.rankContainer}>
            <LinearGradient
              colors={
                rank === 1 ? ['#F59E0B', '#F97316'] :
                rank === 2 ? ['#dfebf7', '#E5E7EB'] :
                rank === 3 ? ['#ffd7b5', '#faf1e0'] :
                ['#E5E7EB', '#D1D5DB']
              }
              style={styles.rankBadge}
            >
              {rank <= 3 ? (
                <Ionicons
                  name={rank === 1 ? 'trophy' : 'medal'}
                  size={14}
                  color="#1a3a52"
                />
              ) : (
                <Text style={styles.rankText}>{rank}</Text>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Left: Logo with Gradient Border */}
        <View style={styles.logoWrapper}>
          <LinearGradient
            colors={['#F59E0B', '#1a3a52']}
            style={styles.logoBorder}
          >
            <View style={styles.logoContainer}>
              {!imageError && brand.logo ? (
                <CachedImage
                  source={brand.logo}
                  style={styles.logo}
                  contentFit="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <LinearGradient
                  colors={['#F59E0B', '#1a3a52']}
                  style={styles.logoFallback}
                >
                  <Text style={styles.logoFallbackText}>{getInitials(brand.name)}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>
          {/* Coin Reward Badge on Logo */}
          {rewardPercentage > 0 && (
            <View style={styles.coinBadgeOnLogo}>
              <LinearGradient
                colors={['#F59E0B', '#1a3a52']}
                style={styles.coinBadgeGradient}
              >
                <Text style={styles.coinBadgeText}>{rewardPercentage}%</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Middle: Info */}
        <View style={styles.infoContainer}>
          {/* Name Row with NEW Badge */}
          <View style={styles.nameRow}>
            <Text style={styles.brandName} numberOfLines={1}>
              {brand.name}
            </Text>
            {brand.isNewArrival && (
              <LinearGradient
                colors={['#F59E0B', '#1a3a52']}
                style={styles.newBadge}
              >
                <Ionicons name="sparkles" size={8} color="#FFFFFF" />
                <Text style={styles.newBadgeText}>NEW</Text>
              </LinearGradient>
            )}
          </View>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            {(brand.ratings?.average || 0) > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.ratingValue}>
                  {(brand.ratings?.average || 0).toFixed(1)}
                </Text>
              </View>
            )}
            {(brand.ratings?.count || 0) > 0 && (
              <Text style={styles.ratingCount}>
                ({brand.ratings?.count || 0})
              </Text>
            )}
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#1a3a52" />
              <Text style={styles.successText}>
                {brand.ratings?.successRate || 0}%
              </Text>
            </View>
          </View>

          {/* Reward Display */}
          <View style={styles.rewardRow}>
            <View style={styles.rewardBadge}>
              <Ionicons name="gift" size={14} color="#D97706" />
              <Text style={styles.rewardText}>
                {isInAppStore
                  ? `Earn ${rewardPercentage}% ${BRAND.COIN_NAME}`
                  : brand.cashback.maxAmount
                    ? `Up to ${currencySymbol}${brand.cashback.maxAmount}`
                    : `${rewardPercentage}% cashback`
                }
              </Text>
            </View>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {/* Tier Badge */}
            <LinearGradient
              colors={tierConfig.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tierBadge}
            >
              <Text style={styles.tierBadgeText}>
                {brand.tier.charAt(0).toUpperCase() + brand.tier.slice(1)}
              </Text>
            </LinearGradient>

            {/* Other Badges */}
            {uniqueBadges.map((badge) => {
              const config = BADGE_CONFIG[badge];
              return (
                <LinearGradient
                  key={badge}
                  colors={config?.colors || ['#6B7280', '#4B5563']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>
                    {badge.charAt(0).toUpperCase() + badge.slice(1).replace('-', ' ')}
                  </Text>
                </LinearGradient>
              );
            })}

            {/* Category as Badge */}
            {brand.mallCategory && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{brand.mallCategory.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Arrow Button */}
        <View style={styles.arrowContainer}>
          <LinearGradient
            colors={['#F3F4F6', '#E5E7EB']}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  topThreeCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  rankContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 10,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  logoWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  logoBorder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    padding: 2,
  },
  logoContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coinBadgeOnLogo: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  coinBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  coinBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#faf1e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a3a52',
  },
  rewardRow: {
    marginBottom: 10,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dfebf7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#dfebf7',
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a3a52',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  arrowContainer: {
    marginLeft: 10,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(BrandFullWidthCard);
