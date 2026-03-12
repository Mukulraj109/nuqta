/**
 * MallTopRatedItem Component
 *
 * Premium list item component for displaying top rated brands
 * with ranking badges, enhanced visuals, and modern styling
 */

import React, { memo, useState } from 'react';
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
import { MallBrand } from '../../../types/mall.types';

interface MallTopRatedItemProps {
  brand: MallBrand;
  onPress: (brand: MallBrand) => void;
  rank?: number;
}

// Rank badge colors for top 3 (blue-family palette)
const getRankColors = (rank: number): [string, string] => {
  switch (rank) {
    case 1:
      return ['#0284C7', '#0369A1']; // #1 - Sky Blue
    case 2:
      return ['#1a3a52', '#234b68']; // #2 - Nile Blue
    case 3:
      return ['#234b68', '#0284C7']; // #3 - Steel Blue
    default:
      return ['#E5E7EB', '#D1D5DB']; // Gray
  }
};

const MallTopRatedItem: React.FC<MallTopRatedItemProps> = ({
  brand,
  onPress,
  rank = 0,
}) => {
  const [imageError, setImageError] = useState(false);
  const isTopThree = rank >= 1 && rank <= 3;
  const rankColors = getRankColors(rank);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(brand)}
     
    >
      <View style={[styles.card, isTopThree && styles.topThreeCard]}>
        {/* Rank Badge */}
        {rank > 0 && (
          <View style={styles.rankBadgeContainer}>
            <LinearGradient
              colors={rankColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.rankBadge,
                isTopThree && styles.topThreeRankBadge,
              ]}
            >
              {isTopThree ? (
                <Ionicons
                  name={rank === 1 ? 'trophy' : 'medal'}
                  size={12}
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.rankText}>{rank}</Text>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Logo */}
        <View style={[styles.logoContainer, isTopThree && styles.topThreeLogoContainer]}>
          {!imageError && brand.logo ? (
            <CachedImage
              source={brand.logo}
              style={styles.logo}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <LinearGradient
              colors={['#1a3a52', '#234b68']}
              style={styles.logoFallback}
            >
              <Text style={styles.logoFallbackText}>{getInitials(brand.name || 'Brand')}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Brand Info */}
        <View style={styles.infoContainer}>
          {/* Name Row */}
          <View style={styles.nameRow}>
            <Text style={styles.brandName} numberOfLines={1}>
              {brand.name}
            </Text>
            {brand.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
              </View>
            )}
          </View>

          {/* Category */}
          {brand.mallCategory && (
            <View style={styles.categoryRow}>
              <Ionicons name="pricetag-outline" size={11} color="#9CA3AF" />
              <Text style={styles.categoryText} numberOfLines={1}>
                {brand.mallCategory.name}
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Cashback Badge */}
            <View style={styles.cashbackBadge}>
              <Ionicons name="wallet-outline" size={12} color="#1a3a52" />
              <Text style={styles.cashbackText}>
                {brand.cashback?.percentage || 0}%
              </Text>
            </View>

            {/* Success Rate Badge */}
            <View style={styles.successBadge}>
              <Ionicons name="trending-up" size={12} color="#6B7280" />
              <Text style={styles.successText}>
                {brand.ratings?.successRate || 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Badge */}
        <View style={styles.ratingSection}>
          <LinearGradient
            colors={['#0284C7', '#0369A1']}
            style={styles.ratingBadge}
          >
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.ratingText}>
              {(brand.ratings?.average || 0).toFixed(1)}
            </Text>
          </LinearGradient>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    paddingLeft: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topThreeCard: {
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  rankBadgeContainer: {
    marginRight: 10,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topThreeRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  topThreeLogoContainer: {
    borderColor: 'rgba(2, 132, 199, 0.3)',
    borderWidth: 2,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3a52',
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dfebf7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cashbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a3a52',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  ratingSection: {
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default memo(MallTopRatedItem);
