// Product Chip Component
// Displays a tagged product with remove option in the upload flow

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { ProductReference } from '@/types/ugc-upload.types';
import { useRegion } from '@/contexts/RegionContext';

interface ProductChipProps {
  product: ProductReference;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * ProductChip component for displaying selected products
 * Shows product image, name, price, and remove button
 */
export default function ProductChip({
  product,
  onRemove,
  disabled = false,
}: ProductChipProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const displayPrice = product.salePrice || product.basePrice;
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Product: ${product.name}, Price: ${currencySymbol}${displayPrice.toFixed(2)}${product.store ? `, from ${product.store.name}` : ''}`}
    >
      {/* Product Image */}
      {imageUrl ? (
        <CachedImage
          source={imageUrl}
          style={styles.image}
          contentFit="cover"
          accessibilityIgnoresInvertColors={true}
          accessible={false}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} accessible={false}>
          <Ionicons name="image-outline" size={24} color="#9CA3AF" />
        </View>
      )}

      {/* Product Info */}
      <View style={styles.info} accessible={false}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{currencySymbol}{displayPrice.toFixed(2)}</Text>
          {product.salePrice && product.basePrice > product.salePrice && (
            <Text style={styles.originalPrice}>{currencySymbol}{product.basePrice.toFixed(2)}</Text>
          )}
        </View>
        {product.store && (
          <Text style={styles.store} numberOfLines={1}>
            {product.store.name}
          </Text>
        )}
      </View>

      {/* Remove Button */}
      <Pressable
        style={styles.removeButton}
        onPress={onRemove}
        disabled={disabled}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${product.name} from tagged products`}
        accessibilityHint="Double tap to remove this product"
        accessibilityState={{ disabled }}
      >
        <Ionicons
          name="close-circle"
          size={24}
          color={disabled ? '#9CA3AF' : '#EF4444'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  originalPrice: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  store: {
    fontSize: 11,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
});
