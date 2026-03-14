// ReorderSuggestions Component
// Displays smart reorder suggestions based on user's order history

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { useReorderSuggestions } from '@/hooks/useReorder';
import { router } from 'expo-router';
import { useRegion } from '@/contexts/RegionContext';
import { useCart } from '@/contexts/CartContext';
import { platformAlert } from '@/utils/platformAlert';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface ReorderSuggestionsProps {
  onAddToCart?: (productId: string, quantity: number) => void;
}

function ReorderSuggestions({ onAddToCart }: ReorderSuggestionsProps) {
  const { suggestions, loading, error, refresh } = useReorderSuggestions();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const { actions } = useCart();
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    refresh();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consumable':
        return '🔄';
      case 'frequent':
        return '⭐';
      case 'subscription':
        return '📦';
      default:
        return '💡';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consumable':
        return '#f59e0b';
      case 'frequent':
        return '#8b5cf6';
      case 'subscription':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const handleProductPress = (productId: string, storeId: string) => {
    router.push({
      pathname: '/product-page',
      params: { id: storeId, highlightProduct: productId }
    });
  };

  const handleQuickAdd = async (item: any) => {
    if (onAddToCart) {
      onAddToCart(item.productId, item.suggestedQuantity);
      return;
    }
    try {
      await actions.addItem({
        id: item.productId,
        name: item.productName,
        price: item.currentPrice,
        image: item.productImage || 'https://via.placeholder.com/150',
        cashback: '0',
        category: 'products',
        quantity: item.suggestedQuantity || 1,
      });
      const key = `${item.productId}-${item.type}`;
      setAddedItems(prev => new Set(prev).add(key));
      setTimeout(() => {
        setAddedItems(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
    } catch (err) {
      platformAlert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const renderSuggestion = ({ item }: { item: any }) => (
    <Pressable
      style={styles.suggestionCard}
      onPress={() => handleProductPress(item.productId, item.storeId)}
     
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: getTypeColor(item.type) + '20' }
        ]}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={[
            styles.typeText,
            { color: getTypeColor(item.type) }
          ]}>
            {item.type === 'consumable' ? 'Time to Restock' :
             item.type === 'frequent' ? 'Your Favorite' :
             'Subscribe & Save'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <CachedImage
          source={item.productImage}
          style={styles.productImage}
          contentFit="cover"
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.storeName} numberOfLines={1}>
            {item.storeName}
          </Text>

          <Text style={styles.reason} numberOfLines={2}>
            {item.reason}
          </Text>

          <View style={styles.bottomRow}>
            <Text style={styles.price}>{currencySymbol}{item.currentPrice.toFixed(2)}</Text>

            {item.isAvailable ? (
              addedItems.has(`${item.productId}-${item.type}`) ? (
                <View style={[styles.quickAddButton, { backgroundColor: '#2ECC71' }]}>
                  <Text style={styles.quickAddText}>Added ✓</Text>
                </View>
              ) : (
              <Pressable
                style={styles.quickAddButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleQuickAdd(item);
                }}
              >
                <Text style={styles.quickAddText}>
                  Add {item.suggestedQuantity}
                </Text>
              </Pressable>
              )
            ) : (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Out of Stock</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {item.orderFrequency && (
        <View style={styles.frequencyInfo}>
          <Text style={styles.frequencyText}>
            You order this every {item.orderFrequency} days
          </Text>
        </View>
      )}
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No Suggestions Yet</Text>
      <Text style={styles.emptyText}>
        Order more items to get personalized reorder suggestions
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonLoader width={180} height={20} borderRadius={6} />
          <SkeletonLoader width={140} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.suggestionCard, { padding: 12 }]}>
              <SkeletonLoader width="60%" height={16} borderRadius={10} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row' }}>
                <SkeletonLoader width={80} height={80} borderRadius={8} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width="70%" height={12} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return renderEmpty();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suggestions for You</Text>
        <Text style={styles.headerSubtitle}>
          Based on your order history
        </Text>
      </View>

      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={item => `${item.productId}-${item.type}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280'
  },
  listContent: {
    paddingHorizontal: 16
  },
  suggestionCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden'
  },
  cardHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 6
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6'
  },
  productInfo: {
    flex: 1,
    marginLeft: 12
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  storeName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8
  },
  reason: {
    fontSize: 12,
    color: '#6366f1',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  quickAddButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  quickAddText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  unavailableBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  unavailableText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600'
  },
  frequencyInfo: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  frequencyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center'
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280'
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center'
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 12
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyState: {
    padding: 40,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center'
  }
});

export default React.memo(ReorderSuggestions);
