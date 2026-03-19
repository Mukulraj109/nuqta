import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import CachedImage from '@/components/ui/CachedImage';
import { router, Stack } from 'expo-router';
import ordersService, { Order } from '@/services/ordersApi';
import { mapBackendOrderToFrontend } from '@/utils/dataMappers';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

type OrderStatus = 'all' | 'placed' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled' | 'returned' | 'refunded';

interface FilterState {
  status: OrderStatus;
  dateRange: 'all' | 'week' | 'month' | '3months' | 'custom';
  storeId?: string;
}

function OrdersListScreen() {
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const isMounted = useIsMounted();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  // Apply filters and search
  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, filters]);

  const loadOrders = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await ordersService.getOrders({
        page: pageNum,
        limit: 20,
        sort: 'newest',
        status: filters.status !== 'all' ? filters.status : undefined,
      });

      if (response.success && response.data) {
        const mappedOrders = response.data.orders.map(mapBackendOrderToFrontend);

        if (refresh || pageNum === 1) {
          if (!isMounted()) return;
          setOrders(mappedOrders);
        } else {
          if (!isMounted()) return;
          setOrders(prev => [...prev, ...mappedOrders]);
        }

        if (!isMounted()) return;
        setHasMore(response.data.pagination.current < response.data.pagination.pages);
        if (!isMounted()) return;
        setPage(pageNum);
        setError(null);
      }
    } catch (err) {
      if (!isMounted()) return;
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      if (!isMounted()) return;
      setLoading(false);
      if (!isMounted()) return;
      setRefreshing(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(order => new Date(order.createdAt) >= startDate);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Search in order number
        if (order.orderNumber.toLowerCase().includes(query)) return true;

        // Search in product names (use direct item.name or fallback to product.name)
        const hasMatchingProduct = order.items.some(item =>
          ((item as any).name || item.product?.name)?.toLowerCase().includes(query)
        );
        if (hasMatchingProduct) return true;

        return false;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, filters, searchQuery]);

  const handleRefresh = () => {
    loadOrders(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadOrders(page + 1);
    }
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/orders/${orderId}/tracking`);
  };

  const handleStatusFilterChange = (status: OrderStatus) => {
    setFilters(prev => ({ ...prev, status }));
    setShowFilters(false);
    // Reload orders with new filter
    loadOrders(1, true);
  };

  const handleDateRangeChange = (dateRange: FilterState['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all',
    });
    setSearchQuery('');
    loadOrders(1, true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return Colors.success;
      case 'dispatched':
      case 'out_for_delivery':
        return Colors.info;
      case 'preparing':
      case 'ready':
        return Colors.warning;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.text.tertiary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderOrderItem = useCallback(({ item }: { item: Order }) => (
    <Pressable
      style={styles.orderCard}
      onPress={() => handleOrderPress(item.id)}
     
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 3).map((orderItem, index) => {
          // Use direct item properties (stored at order time) with fallback to populated product
          const itemName = (orderItem as any).name || orderItem.product?.name || 'Product';
          const itemImage = (orderItem as any).image || orderItem.product?.images?.[0]?.url || orderItem.product?.image;
          const itemTotal = (orderItem as any).subtotal || (orderItem.price * orderItem.quantity) || 0;

          return (
            <View key={index} style={styles.itemRow}>
              {itemImage && (
                <CachedImage
                  source={itemImage}
                  style={styles.itemImage}
                />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {itemName}
                </Text>
                <Text style={styles.itemQuantity}>Qty: {orderItem.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{currencySymbol}{itemTotal}</Text>
            </View>
          );
        })}
        {item.items.length > 3 && (
          <Text style={styles.moreItems}>
            +{item.items.length - 3} more item{item.items.length - 3 > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{currencySymbol}{item.summary?.total}</Text>
        </View>
        <Pressable
          style={styles.trackButton}
          onPress={() => handleOrderPress(item.id)}
        >
          <Text style={styles.trackButtonText}>Track Order</Text>
        </Pressable>
      </View>
    </Pressable>
  ), [currencySymbol, handleOrderPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {searchQuery || filters.status !== 'all' || filters.dateRange !== 'all'
          ? 'No orders match your filters'
          : 'No orders yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery || filters.status !== 'all' || filters.dateRange !== 'all'
          ? 'Try adjusting your filters'
          : 'Start shopping to see your orders here'}
      </Text>
      {(searchQuery || filters.status !== 'all' || filters.dateRange !== 'all') ? (
        <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.shopButton} onPress={() => router.push('/')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </Pressable>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  };

  const activeFiltersCount =
    (filters.status !== 'all' ? 1 : 0) + (filters.dateRange !== 'all' ? 1 : 0);

  if (loading && page === 1) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'My Orders' }} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'My Orders' }} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadOrders()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Orders' }} />

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterBar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order number or product..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral[400]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Orders List */}
      <FlashList
        contentContainerStyle={{ paddingBottom: 120 }}
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredOrders.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.brand.purple]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        estimatedItemSize={120}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Order Status</Text>
                {(['all', 'placed', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'] as OrderStatus[]).map(
                  status => (
                    <Pressable
                      key={status}
                      style={[
                        styles.filterOption,
                        filters.status === status && styles.filterOptionActive,
                      ]}
                      onPress={() => handleStatusFilterChange(status)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.status === status && styles.filterOptionTextActive,
                        ]}
                      >
                        {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                      {filters.status === status && (
                        <Text style={styles.filterOptionCheck}>✓</Text>
                      )}
                    </Pressable>
                  )
                )}
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                {(['all', 'week', 'month', '3months'] as FilterState['dateRange'][]).map(range => (
                  <Pressable
                    key={range}
                    style={[
                      styles.filterOption,
                      filters.dateRange === range && styles.filterOptionActive,
                    ]}
                    onPress={() => handleDateRangeChange(range)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.dateRange === range && styles.filterOptionTextActive,
                      ]}
                    >
                      {range === 'all'
                        ? 'All Time'
                        : range === 'week'
                        ? 'Last Week'
                        : range === 'month'
                        ? 'Last Month'
                        : 'Last 3 Months'}
                    </Text>
                    {filters.dateRange === range && (
                      <Text style={styles.filterOptionCheck}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.clearFiltersButtonModal}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonTextModal}>Clear All</Text>
              </Pressable>
              <Pressable
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersButtonText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  searchFilterBar: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.text.inverse,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...Typography.body,
    color: Colors.text.primary,
  },
  clearIcon: {
    fontSize: 18,
    color: Colors.text.tertiary,
    padding: Spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 18,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.base,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: Colors.text.inverse,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  orderDate: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  orderItems: {
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  itemQuantity: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  itemPrice: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  moreItems: {
    ...Typography.caption,
    color: Colors.brand.purple,
    marginTop: Spacing.xs,
    marginLeft: 62,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    ...Typography.h4,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  trackButton: {
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  trackButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.h3,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  clearFiltersButton: {
    backgroundColor: Colors.text.inverse,
    borderWidth: 1,
    borderColor: Colors.brand.purple,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  clearFiltersButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.brand.purple,
  },
  shopButton: {
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  shopButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  errorText: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  retryButton: {
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.text.inverse,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.text.tertiary,
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  filterOptionActive: {
    backgroundColor: Colors.infoScale[50],
    borderWidth: 1,
    borderColor: Colors.brand.purple,
  },
  filterOptionText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  filterOptionTextActive: {
    color: Colors.brand.purple,
    fontWeight: '600',
  },
  filterOptionCheck: {
    fontSize: 16,
    color: Colors.brand.purple,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  clearFiltersButtonModal: {
    flex: 1,
    backgroundColor: Colors.text.inverse,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  clearFiltersButtonTextModal: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: Colors.brand.purple,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});

export default withErrorBoundary(OrdersListScreen, 'OrdersIndex.enhanced');
