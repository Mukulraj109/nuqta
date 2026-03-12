/**
 * OfferCardCompact Component (160px width)
 *
 * Smaller card for grid views and compact sections
 * ReZ brand styling
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { useOffersTheme } from '@/contexts/OffersThemeContext';
import { Spacing, BorderRadius, Shadows, Colors } from '@/constants/DesignSystem';

interface OfferCardCompactProps {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  storeName: string;
  storeLogo?: string;
  cashbackPercentage?: number;
  discountPercentage?: number;
  isNew?: boolean;
  isTrending?: boolean;
  onPress: () => void;
}

export const OfferCardCompact: React.FC<OfferCardCompactProps> = ({
  id,
  title,
  subtitle,
  image,
  storeName,
  storeLogo,
  cashbackPercentage,
  discountPercentage,
  isNew,
  isTrending,
  onPress,
}) => {
  const { theme, isDark } = useOffersTheme();

  const styles = StyleSheet.create({
    container: {
      width: 160,
      backgroundColor: isDark ? theme.colors.background.card : '#FFFFFF',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.border.light : '#E5E7EB',
      overflow: 'hidden',
      ...(isDark ? {} : Shadows.medium),
    },
    imageContainer: {
      height: 100,
      position: 'relative',
      backgroundColor: '#F7FAFC',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    badgeContainer: {
      position: 'absolute',
      top: 8,
      left: 8,
      flexDirection: 'row',
      gap: 4,
    },
    newBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary[600],
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 5,
    },
    newBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#FFFFFF',
      marginLeft: 2,
    },
    trendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EF4444',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 5,
    },
    trendingBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#FFFFFF',
      marginLeft: 2,
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#FEE2E2',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 5,
    },
    discountText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#DC2626',
    },
    storeLogoContainer: {
      position: 'absolute',
      bottom: -14,
      left: 10,
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      overflow: 'hidden',
      ...Shadows.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storeLogo: {
      width: 26,
      height: 26,
    },
    storeLogoPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: Colors.primary[600],
      alignItems: 'center',
      justifyContent: 'center',
    },
    storeLogoText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    content: {
      padding: Spacing.sm,
      paddingTop: Spacing.md + 4,
    },
    storeName: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.text.tertiary,
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 2,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
    },
    cashbackBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(0, 192, 106, 0.1)' : '#E6F9F0',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    cashbackText: {
      fontSize: 10,
      fontWeight: '700',
      color: Colors.primary[600],
      marginLeft: 3,
    },
  });

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
     
    >
      <View style={styles.imageContainer}>
        <CachedImage
          source={image}
          style={styles.image}
          contentFit="cover"
        />

        {/* Top Left Badges */}
        <View style={styles.badgeContainer}>
          {isNew && (
            <View style={styles.newBadge}>
              <Ionicons name="sparkles" size={8} color="#FFFFFF" />
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {isTrending && !isNew && (
            <View style={styles.trendingBadge}>
              <Ionicons name="trending-up" size={8} color="#FFFFFF" />
              <Text style={styles.trendingBadgeText}>HOT</Text>
            </View>
          )}
        </View>

        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}%</Text>
          </View>
        )}

        {/* Store Logo */}
        <View style={styles.storeLogoContainer}>
          {storeLogo ? (
            <CachedImage
              source={storeLogo}
              style={styles.storeLogo}
              contentFit="contain"
            />
          ) : (
            <View style={styles.storeLogoPlaceholder}>
              <Text style={styles.storeLogoText}>
                {storeName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.storeName} numberOfLines={1}>
          {storeName}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        <View style={styles.footer}>
          {cashbackPercentage && cashbackPercentage > 0 && (
            <View style={styles.cashbackBadge}>
              <Ionicons name="wallet-outline" size={10} color={Colors.primary[600]} />
              <Text style={styles.cashbackText}>{cashbackPercentage}% Back</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default OfferCardCompact;
