// Product Card Component
// Individual product card for product selector with selection support

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCardProps } from '@/types/product-selector.types';
import CachedImage from '@/components/ui/CachedImage';
import { useRegion } from '@/contexts/RegionContext';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150?text=No+Image';

function ProductCard({
  product,
  isSelected,
  onToggleSelect,
  disabled = false,
  showStore = true,
  showPrice = true,
  showRating = true,
  compactMode = false,
}: ProductCardProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const imageUrl = product.images?.[0] || PLACEHOLDER_IMAGE;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const displayPrice = product.salePrice || product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  // Stock status
  const isOutOfStock = product.availability === 'out_of_stock' ||
                       (product.inStock === false);
  const isLowStock = product.availability === 'low_stock';

  const handlePress = () => {
    if (!disabled && !isOutOfStock) {
      onToggleSelect(product);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        compactMode && styles.containerCompact,
        isSelected && styles.containerSelected,
        (disabled || isOutOfStock) && styles.containerDisabled,
      ]}
      onPress={handlePress}
     
      disabled={disabled || isOutOfStock}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: disabled || isOutOfStock }}
      accessibilityLabel={`${product.name}, ${displayPrice} rupees, ${
        isSelected ? 'selected' : 'not selected'
      }`}
    >
      {/* Selection Indicator */}
      <View style={styles.selectionIndicator}>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
            (disabled || isOutOfStock) && styles.checkboxDisabled,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Product Image */}
      <View style={styles.imageContainer}>
        <CachedImage
          source={imageUrl}
          style={[
            styles.image,
            (disabled || isOutOfStock) && styles.imageDisabled,
          ]}
          contentFit="cover"
          showShimmer={true}
          accessibilityLabel={`${product.name} image`}
        />

        {/* Discount Badge */}
        {hasDiscount && !isOutOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Low Stock Badge */}
        {isLowStock && !isOutOfStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="alert-circle" size={12} color="#F59E0B" />
            <Text style={styles.lowStockText}>Low Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        {/* Product Name */}
        <Text
          style={[
            styles.productName,
            compactMode && styles.productNameCompact,
            (disabled || isOutOfStock) && styles.textDisabled,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.name}
        </Text>

        {/* Store Name */}
        {showStore && product.store && (
          <View style={styles.storeContainer}>
            <Ionicons name="storefront-outline" size={12} color="#6B7280" />
            <Text
              style={[
                styles.storeName,
                (disabled || isOutOfStock) && styles.textDisabled,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.store.name}
            </Text>
          </View>
        )}

        {/* Rating */}
        {showRating && product.rating && product.rating.average > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {typeof product.rating.average === 'number'
                ? product.rating.average.toFixed(1)
                : product.rating.average}
            </Text>
            <Text style={styles.ratingCount}>({product.rating.count})</Text>
          </View>
        )}

        {/* Price */}
        {showPrice && (
          <View style={styles.priceContainer}>
            <Text
              style={[
                styles.price,
                (disabled || isOutOfStock) && styles.textDisabled,
              ]}
            >
              {currencySymbol}{displayPrice.toLocaleString('en-IN')}
            </Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {currencySymbol}{product.basePrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {/* Category Tag */}
        {product.category && !compactMode && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {product.category}
            </Text>
          </View>
        )}
      </View>

      {/* Selected Badge */}
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  containerCompact: {
    marginBottom: 8,
  },
  containerSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F7FF',
  },
  containerDisabled: {
    opacity: 0.6,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDisabled: {
    opacity: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  productNameCompact: {
    fontSize: 13,
    marginBottom: 4,
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  storeName: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  ratingCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textDisabled: {
    color: '#9CA3AF',
  },
});

export default React.memo(ProductCard);
