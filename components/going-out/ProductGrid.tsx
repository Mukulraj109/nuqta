import React, { useCallback, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { GoingOutProductCard } from './GoingOutProductCard';
import { ProductGridProps } from '@/types/going-out.types';

const { width: screenWidth } = Dimensions.get('window');
const PADDING = 16;
const GAP = 16;

export const ProductGrid = memo(function ProductGrid({
  products,
  loading,
  onProductPress,
  onToggleWishlist,
  onLoadMore,
  hasMore = false,
  numColumns = 2,
  wishlist = [],
  showHeader = true,
}: ProductGridProps) {
  const cardWidth = (screenWidth - (PADDING * 2) - (GAP * (numColumns - 1))) / numColumns;

  const renderProduct = useCallback(({ item, index }: ListRenderItemInfo<any>) => (
    <View
      style={[
        styles.productContainer,
        {
          width: cardWidth,
          marginRight: (index + 1) % numColumns === 0 ? 0 : GAP,
        },
      ]}
    >
      <GoingOutProductCard
        product={item}
        onPress={onProductPress}
        onToggleWishlist={onToggleWishlist}
        width={cardWidth}
        isInWishlist={wishlist.includes(item.id)}
      />
    </View>
  ), [cardWidth, onProductPress, onToggleWishlist, wishlist, numColumns]);

  const renderLoadingFooter = () => {
    if (!loading || !hasMore) return null;

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
      <View
        style={styles.headerContainer}
        accessibilityRole="header"
        accessibilityLabel={`${products.length} product${products.length !== 1 ? 's' : ''} found`}
      >
        <ThemedText style={styles.resultCount}>
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </ThemedText>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View
      style={styles.emptyContainer}
      accessibilityRole="text"
      accessibilityLabel="No products found. Try adjusting your search or category filters"
    >
      <ThemedText style={styles.emptyTitle}>No products found</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Try adjusting your search or category filters
      </ThemedText>
    </View>
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 380 + GAP, // Card height + gap
    offset: (380 + GAP) * Math.floor(index / numColumns),
    index,
  }), [numColumns]);

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={numColumns} // Force re-render if columns change
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderLoadingFooter}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        initialNumToRender={6}
        windowSize={3}
        scrollEventThrottle={16}
        bounces={true}
        bouncesZoom={false}
      />

      {/* Initial Loading State */}
      {loading && products.length === 0 && (
        <View
          style={styles.initialLoadingContainer}
          accessibilityRole="progressbar"
          accessibilityLabel="Loading products"
          accessibilityValue={{ text: "Loading" }}
        >
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.initialLoadingText}>
            Loading products...
          </ThemedText>
        </View>
      )}
    </View>
);
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  productContainer: {
    marginBottom: GAP,
    marginHorizontal: 2,
  },
  loadingFooter: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  initialLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  initialLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  headerContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});