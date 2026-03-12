import React, { useCallback, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { HomeDeliveryProductCard } from './HomeDeliveryProductCard';
import { ProductGridProps, HomeDeliveryProduct } from '@/types/home-delivery.types';

const { width } = Dimensions.get('window');

// Estimated card height for getItemLayout optimization
const ESTIMATED_CARD_HEIGHT = 280;

export const ProductGrid = memo(function ProductGrid({
  products,
  loading,
  onProductPress,
  onLoadMore,
  hasMore,
  numColumns = 2,
  showHeader = true,
}: ProductGridProps) {
  const cardWidth = (width - 64) / numColumns; // Account for padding and gaps

  const renderProductCard = useCallback(({ item }: ListRenderItemInfo<HomeDeliveryProduct>) => (
    <View style={[styles.cardContainer, { width: cardWidth }]}>
      <HomeDeliveryProductCard
        product={item}
        onPress={() => onProductPress(item)}
        showCashback={true}
        showDeliveryTime={true}
      />
    </View>
  ), [cardWidth, onProductPress]);

  const renderEmptyState = () => (
    <View
      style={styles.emptyContainer}
      accessibilityRole="alert"
      accessibilityLabel="No products found. Try adjusting your search or filters"
    >
      <ThemedText style={styles.emptyTitle}>No products found</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </ThemedText>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!hasMore || !loading) return null;

    return (
      <View
        style={styles.loadingFooter}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading more products"
        accessibilityValue={{ text: "Loading" }}
      >
        <ActivityIndicator size="small" color="#8B5CF6" />
        <ThemedText style={styles.loadingText}>Loading more products...</ThemedText>
      </View>
    );
  };

  const renderHeader = () => {
    if (!showHeader || products.length === 0) return null;
    
    return (
      <View style={styles.headerContainer}>
        <ThemedText style={styles.resultCount}>
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </ThemedText>
      </View>
    );
  };

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const keyExtractor = useCallback((item: HomeDeliveryProduct) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ESTIMATED_CARD_HEIGHT,
    offset: ESTIMATED_CARD_HEIGHT * Math.floor(index / numColumns),
    index,
  }), [numColumns]);

  if (loading && products.length === 0) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading products"
        accessibilityValue={{ text: "Loading" }}
      >
        <ActivityIndicator size="large" color="#8B5CF6" />
        <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={numColumns} // Force re-render if columns change
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          products.length === 0 && styles.emptyContentContainer,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={3}
        initialNumToRender={6}
        getItemLayout={getItemLayout}
        accessibilityLabel={`Product grid. ${products.length} products available`}
        accessibilityRole="list"
      />
    </View>
);
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 4,
  },
  row: {
    justifyContent: 'space-between',
    gap: 16,
  },
  separator: {
    height: 12,
  },
  headerContainer: {
    paddingVertical: 12,
    paddingBottom: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});