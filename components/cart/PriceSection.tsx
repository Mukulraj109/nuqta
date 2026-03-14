/**
 * Price Section
 *
 * Bottom price bar with Buy Now button
 * Premium Nuqta design palette
 */

import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { PriceSectionProps } from '@/types/cart';
import { useRegion } from '@/contexts/RegionContext';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/DesignTokens';

function PriceSection({
  totalPrice,
  onBuyNow,
  itemCount = 0,
  loading = false
}: PriceSectionProps) {
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 360;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { getCurrencySymbol, formatPrice, getLocale } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const locale = getLocale();

  const handleBuyNowPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onBuyNow();
  };

  const formattedPrice = new Intl.NumberFormat(locale).format(totalPrice);

  return (
    <View style={styles.container}>
      {/* Top Border Gradient */}
      <LinearGradient
        colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach, COLORS.nuqta.linen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorderGradient}
      />

      <View style={styles.content}>
        {/* Price Information */}
        <View style={styles.priceContainer}>
          <ThemedText style={[
            styles.priceLabel,
            { fontSize: isSmallScreen ? 12 : 13 }
          ]}>
            Price
          </ThemedText>
          <ThemedText style={[
            styles.totalPrice,
            { fontSize: isSmallScreen ? 22 : 24 }
          ]}>
            {currencySymbol}{formattedPrice}
          </ThemedText>
          {itemCount > 0 && (
            <View style={styles.itemCountBadge}>
              <ThemedText style={styles.itemCount}>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Buy Now Button */}
        <Animated.View style={[
          styles.buttonContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <Pressable
            onPress={handleBuyNowPress}
            disabled={loading || totalPrice === 0}
           
            style={styles.buyNowButton}
            accessibilityLabel={loading ? "Processing order" : `Proceed to checkout with ${itemCount} item${itemCount !== 1 ? 's' : ''} for ${currencySymbol}${formattedPrice}`}
            accessibilityRole="button"
            accessibilityHint="Double tap to proceed to checkout and complete your purchase"
            accessibilityState={{ disabled: loading || totalPrice === 0, busy: loading }}
          >
            <LinearGradient
              colors={loading || totalPrice === 0 ? [COLORS.neutral[400], COLORS.neutral[500]] : [COLORS.nuqta.mustard, COLORS.nuqta.peach]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconWrapper}>
                  <Ionicons
                    name="bag"
                    size={isSmallScreen ? 16 : 18}
                    color={loading || totalPrice === 0 ? '#FFFFFF' : COLORS.nuqta.nileBlue}
                  />
                </View>
                <ThemedText style={[
                  styles.buttonText,
                  { fontSize: isSmallScreen ? 15 : 16 },
                  !(loading || totalPrice === 0) && { color: COLORS.nuqta.nileBlue }
                ]}>
                  {loading ? 'Processing...' : 'Buy Now'}
                </ThemedText>
                {!loading && totalPrice > 0 && (
                  <View style={styles.arrowWrapper}>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.nuqta.nileBlue} />
                  </View>
                )}
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.nileBlue,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    paddingBottom: Platform.OS === 'ios' ? 34 : 70,
  },
  topBorderGradient: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    minHeight: 80,
  },
  priceContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  priceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalPrice: {
    color: COLORS.nuqta.nileBlue,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  itemCountBadge: {
    marginTop: 4,
    backgroundColor: COLORS.nuqta.linen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  itemCount: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '600',
  },
  buttonContainer: {
    flex: 1,
    maxWidth: 180,
  },
  buyNowButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.mustard,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  gradientButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.xl,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  arrowWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 58, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(PriceSection);
