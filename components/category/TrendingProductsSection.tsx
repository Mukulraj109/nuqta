/**
 * TrendingProductsSection Component
 * Horizontal scrollable trending product cards
 * Adapted from Rez_v-2-main FashionProductCard
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductsForCategory, DummyProduct } from '@/data/categoryDummyData';
import CoinIcon from '@/components/ui/CoinIcon';
import { useRegion } from '@/contexts/RegionContext';

interface TrendingProductsSectionProps {
  categorySlug: string;
  products?: DummyProduct[];
  onProductPress?: (product: DummyProduct) => void;
  title?: string;
}

const CARD_WIDTH = 160;

const ProductCard = memo(({
  product,
  onPress,
}: {
  product: DummyProduct;
  onPress: () => void;
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <Pressable
      style={styles.productCard}
      onPress={onPress}
     
      accessibilityLabel={`${product.name} by ${product.brand}`}
      accessibilityRole="button"
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageEmoji}>{product.image}</Text>
        </View>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Tag Badge */}
        {product.tag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.tag}</Text>
          </View>
        )}

        {/* 60 Min Badge */}
        {product.is60Min && (
          <View style={styles.deliveryBadge}>
            <Ionicons name="flash" size={10} color="#F59E0B" />
            <Text style={styles.deliveryText}>60min</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{product.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingValue}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({product.reviews})</Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{currencySymbol}{product.price.toLocaleString()}</Text>
          <Text style={styles.originalPrice}>{currencySymbol}{product.originalPrice.toLocaleString()}</Text>
        </View>

        {/* Cashback */}
        <View style={styles.cashbackRow}>
          <CoinIcon size={14} />
          <Text style={styles.cashbackText}>Earn {product.coinsEarned} coins</Text>
        </View>
      </View>
    </Pressable>
  );
});

ProductCard.displayName = 'ProductCard';

const TrendingProductsSection: React.FC<TrendingProductsSectionProps> = ({
  categorySlug,
  products,
  onProductPress,
  title = 'Trending Now',
}) => {
  const router = useRouter();
  const displayProducts = products || getProductsForCategory(categorySlug);

  const handlePress = useCallback((product: DummyProduct) => {
    if (onProductPress) {
      onProductPress(product);
    } else {
      router.push(`/product-page?cardId=${product.id}&cardType=product` as any);
    }
  }, [router, onProductPress]);

  if (!displayProducts || displayProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingIcon}>🔥</Text>
          </View>
        </View>
        <Pressable
          style={styles.seeAllButton}
          onPress={() => router.push(`/products?category=${categorySlug}&sort=trending` as any)}
          accessibilityLabel="See all trending products"
        >
          <Text style={styles.seeAllText}>View All</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => handlePress(product)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(11, 34, 64, 0.04), 0 8px 24px rgba(11, 34, 64, 0.06)',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  trendingBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingIcon: {
    fontSize: 16,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEmoji: {
    fontSize: 48,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffcd57',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deliveryBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deliveryText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#D97706',
  },
  productInfo: {
    padding: 12,
  },
  brandName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  ratingStar: {
    fontSize: 12,
    color: '#FFB800',
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  reviewCount: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  cashbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 10,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffcd57',
  },
});

export default memo(TrendingProductsSection);
