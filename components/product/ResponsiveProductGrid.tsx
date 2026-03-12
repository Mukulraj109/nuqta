/**
 * ResponsiveProductGrid Component
 *
 * Auto-adjusting product grid that adapts to screen size.
 * Uses FlatList for performance with large datasets.
 */

import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsiveGrid } from '@/hooks/useResponsiveGrid';
import { SPACING } from '@/constants/DesignTokens';

interface Product {
  id: string;
  [key: string]: any;
}

interface ResponsiveProductGridProps {
  /**
   * Array of products to display
   */
  products: Product[];

  /**
   * Render function for each product
   * Receives product data and calculated card width
   */
  renderProduct: (product: Product, width: number) => React.ReactElement;

  /**
   * Callback when user scrolls near the end (for pagination)
   */
  onEndReached?: () => void;

  /**
   * How far from the end (0-1) to trigger onEndReached
   */
  onEndReachedThreshold?: number;

  /**
   * Minimum card width for responsive calculation (default: 150)
   */
  minCardWidth?: number;

  /**
   * Gap between cards (default: SPACING.md)
   */
  gap?: number;

  /**
   * Additional styles for the container
   */
  style?: ViewStyle;

  /**
   * Component to show when loading more items
   */
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;

  /**
   * Component to show when list is empty
   */
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;

  /**
   * Component to show at the top of the list
   */
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;

  /**
   * Whether the grid is currently loading more items
   */
  isLoadingMore?: boolean;
}

/**
 * ResponsiveProductGrid provides an optimized grid layout for products
 *
 * @example
 * <ResponsiveProductGrid
 *   products={products}
 *   renderProduct={(product, width) => (
 *     <ProductCard product={product} width={width} />
 *   )}
 *   onEndReached={loadMoreProducts}
 * />
 */
export default function ResponsiveProductGrid({
  products,
  renderProduct,
  onEndReached,
  onEndReachedThreshold = 0.5,
  minCardWidth = 150,
  gap = SPACING.md,
  style,
  ListFooterComponent,
  ListEmptyComponent,
  ListHeaderComponent,
  isLoadingMore = false,
}: ResponsiveProductGridProps) {
  const { numColumns, cardWidth } = useResponsiveGrid(minCardWidth, gap);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View
        style={[styles.itemWrapper, { padding: gap / 2 }]}
        accessible={false}
      >
        {renderProduct(item, cardWidth)}
      </View>
    ),
    [renderProduct, cardWidth, gap]
  );

  const keyExtractor = useCallback(
    (item: Product, index: number) => item.id || `product-${index}`,
    []
  );

  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const itemHeight = cardWidth * 1.5; // Approximate aspect ratio
      return {
        length: itemHeight,
        offset: itemHeight * Math.floor(index / numColumns),
        index,
      };
    },
    [cardWidth, numColumns]
  );

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={numColumns} // Force re-render when columns change
      contentContainerStyle={[styles.content, style]}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      showsVerticalScrollIndicator={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={8}
      // Uncomment if items have consistent heights for better performance
      // getItemLayout={getItemLayout}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Product grid"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.sm,
  },
  itemWrapper: {
    flex: 1,
  },
});
