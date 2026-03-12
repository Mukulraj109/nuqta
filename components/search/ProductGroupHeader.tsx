import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { GroupedProductResult } from '@/types/search.types';

interface ProductGroupHeaderProps {
  product: GroupedProductResult;
}

export default function ProductGroupHeader({ product }: ProductGroupHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {product.productImage && (
          <CachedImage
            source={product.productImage}
            style={styles.productImage}
            contentFit="cover"
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.productName}>{product.productName}</Text>
          <Text style={styles.sellerCount}>
            {product.sellerCount} {product.sellerCount === 1 ? 'seller' : 'sellers'} available
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Compare sellers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sellerCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

