// BundleDeals Component
// Displays special bundle deals with discounts

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BundleItem } from '@/services/recommendationApi';
import { useRegion } from '@/contexts/RegionContext';
import { BRAND } from '@/constants/brand';

interface BundleDealsProps {
  bundles: BundleItem[];
  loading?: boolean;
  onAddToCart?: (products: any[]) => void;
  onProductPress?: (productId: string) => void;
}

export default function BundleDeals({
  bundles,
  loading = false,
  onAddToCart,
  onProductPress
}: BundleDealsProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Special Bundle Deals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffcd57" />
        </View>
      </View>
    );
  }

  if (!bundles || bundles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Special Bundle Deals</Text>
          <Text style={styles.subtitle}>Save more when you buy together</Text>
        </View>
        <View style={styles.dealBadge}>
          <Ionicons name="flash" size={16} color="#F59E0B" />
          <Text style={styles.dealBadgeText}>Limited Time</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bundles.map((bundle, index) => (
          <BundleDealCard
            key={index}
            bundle={bundle}
            onAddToCart={() => onAddToCart?.(bundle.products)}
            onProductPress={onProductPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface BundleDealCardProps {
  bundle: BundleItem;
  onAddToCart?: () => void;
  onProductPress?: (productId: string) => void;
}

// Helper function to extract image URL from product
const getProductImage = (product: any): string | null => {
  if (product.image) return product.image;
  if (product.images && product.images.length > 0) {
    const firstImg = product.images[0];
    return typeof firstImg === 'string' ? firstImg : firstImg?.url;
  }
  return null;
};

// Helper function to extract price from product
const getProductPrice = (product: any): number => {
  if (product.price?.original) return product.price.original;
  if (product.price?.current) return product.price.current;
  if (product.pricing?.compare) return product.pricing.compare;
  if (product.pricing?.selling) return product.pricing.selling;
  if (typeof product.price === 'number') return product.price;
  return 0;
};

// Helper function to get product ID
const getProductId = (product: any): string => {
  return product.id || product._id || '';
};

// Helper function to get cashback percentage from product
const getCashbackPercentage = (product: any): number => {
  return product.cashback?.percentage || product.cashbackPercentage || 5;
};

// Helper function to calculate Nuqta coins for a product (10% of price)
const getProductNuqtaCoins = (product: any): number => {
  const price = getProductPrice(product);
  return Math.floor(price * 0.1);
};

// Helper function to calculate cashback amount for a product
const getProductCashback = (product: any): number => {
  const price = getProductPrice(product);
  const percentage = getCashbackPercentage(product);
  return Math.floor(price * percentage / 100);
};

function BundleDealCard({ bundle, onAddToCart, onProductPress }: BundleDealCardProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const originalPrice = bundle.products.reduce(
    (sum, p) => sum + getProductPrice(p),
    0
  );

  const savingsPercentage = originalPrice > 0
    ? Math.round((bundle.savings / originalPrice) * 100)
    : 0;

  // Calculate total Nuqta coins and cashback for the entire bundle
  const totalNuqtaCoins = bundle.products.reduce(
    (sum, p) => sum + getProductNuqtaCoins(p),
    0
  );

  const totalCashback = bundle.products.reduce(
    (sum, p) => sum + getProductCashback(p),
    0
  );

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#faf1e0', '#FFFFFF']}
        style={styles.cardGradient}
      >
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsBadgeText}>SAVE {savingsPercentage}%</Text>
        </View>

        <View style={styles.productsPreview}>
          {bundle.products.slice(0, 2).map((product, index) => {
            const imageUrl = getProductImage(product);
            const productId = getProductId(product);

            return (
              <React.Fragment key={productId || index}>
                <Pressable
                  style={styles.productThumb}
                  onPress={() => productId && onProductPress?.(productId)}
                 
                >
                  {imageUrl ? (
                    <CachedImage
                      source={imageUrl}
                      style={styles.thumbImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Ionicons name="image-outline" size={24} color="#D1D5DB" />
                    </View>
                  )}
                </Pressable>
                {index === 0 && bundle.products.length > 1 && (
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusText}>+</Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
          {bundle.products.length > 2 && (
            <View style={styles.moreBadge}>
              <Text style={styles.moreText}>+{bundle.products.length - 2}</Text>
            </View>
          )}
        </View>

        <View style={styles.bundleInfo}>
          <Text style={styles.bundleTitle} numberOfLines={2}>
            {bundle.products.map(p => p.name || p.title || 'Product').join(' + ')}
          </Text>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.label}>Bundle Price:</Text>
              <Text style={styles.bundlePrice}>{currencySymbol}{bundle.combinedPrice}</Text>
            </View>
            {/* Always show Regular Price row for consistent height */}
            <View style={styles.priceRow}>
              <Text style={styles.label}>Regular Price:</Text>
              <Text style={styles.regularPrice}>
                {originalPrice > bundle.combinedPrice ? `${currencySymbol}${originalPrice}` : `${currencySymbol}${bundle.combinedPrice}`}
              </Text>
            </View>
            {/* Always show savings row for consistent height */}
            <View style={styles.savingsHighlight}>
              <Ionicons name="checkmark-circle" size={16} color="#ffcd57" />
              <Text style={styles.savingsAmount}>
                {bundle.savings > 0 ? `You save ${currencySymbol}${bundle.savings}!` : 'Best Price!'}
              </Text>
            </View>

            {/* Bundle Rewards - Total Nuqta Coins & Cashback */}
            <View style={styles.bundleRewardsRow}>
              <View style={styles.bundleRewardItem}>
                <Ionicons name="wallet-outline" size={14} color="#ffcd57" />
                <Text style={styles.bundleRewardText}>{totalNuqtaCoins} {BRAND.COIN_NAME}</Text>
              </View>
              <View style={styles.rewardsDivider} />
              <View style={styles.bundleRewardItem}>
                <Ionicons name="card-outline" size={14} color="#F59E0B" />
                <Text style={styles.bundleCashbackText}>{currencySymbol}{totalCashback} cashback</Text>
              </View>
            </View>
          </View>

          {onAddToCart && (
            <Pressable
              style={styles.addButton}
              onPress={onAddToCart}
             
            >
              <LinearGradient
                colors={['#ffcd57', '#e6b84e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="cart" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add Bundle</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280'
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  dealBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B'
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16
  },
  card: {
    width: 300,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ffcd57',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  cardGradient: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#faf1e0',
    borderRadius: 16
  },
  savingsBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5
  },
  productsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8
  },
  productThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#faf1e0'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  plusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffcd57',
    justifyContent: 'center',
    alignItems: 'center'
  },
  plusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  moreBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A65A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12
  },
  moreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  bundleInfo: {
    gap: 12
  },
  bundleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    minHeight: 40
  },
  priceContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 13,
    color: '#6B7280'
  },
  bundlePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffcd57'
  },
  regularPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  savingsHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#faf1e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffcd57'
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  bundleRewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf1e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8
  },
  bundleRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rewardsDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#faf1e0'
  },
  bundleRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffcd57'
  },
  bundleCashbackText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B'
  }
});
