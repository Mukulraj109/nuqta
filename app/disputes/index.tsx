import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import disputeApi, { Dispute } from '@/services/disputeApi';
import { CachedImage } from '@/components/ui/CachedImage';

const STATUS_COLORS: Record<string, string> = {
  open: '#EF4444',
  under_review: '#F59E0B',
  escalated: '#8B5CF6',
  resolved_refund: '#10B981',
  resolved_reject: '#3B82F6',
  auto_resolved: '#6366F1',
  closed: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  escalated: 'Escalated',
  resolved_refund: 'Refunded',
  resolved_reject: 'Rejected',
  auto_resolved: 'Auto-Resolved',
  closed: 'Closed',
};

export default function DisputeListScreen() {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchDisputes = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (authLoading || !isAuthenticated) return;
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await disputeApi.getMyDisputes(pageNum, 20);
      if (response.success && response.data) {
        const data = response.data as any;
        const items = data.disputes || [];
        const pagination = data.pagination;

        if (append) {
          setDisputes(prev => [...prev, ...items]);
        } else {
          setDisputes(items);
        }
        setPage(pageNum);
        setHasMore(pagination?.hasNext ?? false);
      }
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    fetchDisputes(1);
  }, [isAuthenticated, authLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDisputes(1);
    setRefreshing(false);
  }, [fetchDisputes]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchDisputes(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchDisputes]);

  const renderDispute = useCallback(({ item }: { item: Dispute }) => {
    const statusColor = STATUS_COLORS[item.status] || '#6B7280';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/disputes/${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.disputeNumber}>{item.disputeNumber}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Ionicons name="receipt-outline" size={14} color="#6B7280" />
            <Text style={styles.cardRowText}>Order: {item.targetRef}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#6B7280" />
            <Text style={styles.cardRowText}>{item.reason.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.amountText}>{item.amount} coins</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={disputes}
        keyExtractor={(item) => item._id}
          estimatedItemSize={70}
        renderItem={renderDispute}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Disputes</Text>
            <Text style={styles.emptySubtitle}>You haven't raised any disputes yet</Text>
          </View>
        }
        contentContainerStyle={[
          disputes.length === 0 && { flex: 1, justifyContent: 'center' },
          { paddingBottom: 120 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  disputeNumber: { fontSize: 14, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBody: { gap: 5, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardRowText: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  dateText: { fontSize: 11, color: '#9CA3AF' },

  emptyState: { alignItems: 'center', gap: 6 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  emptySubtitle: { fontSize: 13, color: '#6B7280' },
});
