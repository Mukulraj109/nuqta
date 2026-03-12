/**
 * BestDealsSection Component
 * Grid display of best deal products with high discounts
 * Adapted from Rez_v-2-main best deals pattern
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductsForCategory, DummyProduct } from '@/data/categoryDummyData';
import CoinIcon from '@/components/ui/CoinIcon';
import { useRegion } from '@/contexts/RegionContext';

interface BestDealsSectionProps {
  categorySlug: string;
  products?: DummyProduct[];
  onProductPress?: (product: DummyProduct) => void;
  minDiscount?: number;
}

const DealCard = memo(({
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
      style={styles.dealCard}
      onPress={onPress}
     
      accessibilityLabel={`${product.name} deal`}
      accessibilityRole="button"
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Text style={styles.imageEmoji}>{product.image}</Text>

        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPercent}%</Text>
          <Text style={styles.discountLabel}>OFF</Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{product.brand}</Text>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{currencySymbol}{product.price.toLocaleString()}</Text>
          <Text style={styles.originalPrice}>{currencySymbol}{product.originalPrice.toLocaleString()}</Text>
        </View>

        {/* Coins Earned */}
        <View style={styles.coinsRow}>
          <CoinIcon size={14} />
          <Text style={styles.coinsText}>+{product.coinsEarned}</Text>
        </View>
      </View>
    </Pressable>
  );
});

DealCard.displayName = 'DealCard';

const BestDealsSection: React.FC<BestDealsSectionProps> = ({
  categorySlug,
  products,
  onProductPress,
  minDiscount = 25,
}) => {
  const router = useRouter();
  const allProducts = products || getProductsForCategory(categorySlug);

  // Filter products with high discounts
  const dealProducts = allProducts
    .filter(p => {
      const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      return discount >= minDiscount;
    })
    .slice(0, 4);

  const handlePress = useCallback((product: DummyProduct) => {
    if (onProductPress) {
      onProductPress(product);
    } else {
      router.push(`/product-page?cardId=${product.id}&cardType=product` as any);
    }
  }, [router, onProductPress]);

  if (dealProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.dealIcon}>
            <Ionicons name="pricetag" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Best Deals</Text>
            <Text style={styles.subtitle}>Min {minDiscount}% off on everything</Text>
          </View>
        </View>
        <Pressable
          style={styles.seeAllButton}
          onPress={() => router.push(`/deals?category=${categorySlug}` as any)}
          accessibilityLabel="See all deals"
        >
          <Text style={styles.seeAllText}>All Deals</Text>
        </Pressable>
      </View>

      {/* Deals Grid - 2 columns */}
      <View style={styles.grid}>
        {dealProducts.map((product) => (
          <DealCard
            key={product.id}
            product={product}
            onPress={() => handlePress(product)}
          />
        ))}
      </View>
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
    paddingHorizontal: 16,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dealIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dealCard: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageEmoji: {
    fontSize: 40,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  discountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  discountLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: -2,
  },
  productInfo: {
    padding: 10,
  },
  brandName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  coinEmoji: {
    fontSize: 10,
  },
  coinsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffcd57',
  },
});

export default memo(BestDealsSection);
