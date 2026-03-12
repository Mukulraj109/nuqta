/**
 * Redemption History Component
 * Shows past redemptions and vouchers
 */

import React from 'react';
import { View, FlatList, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { RedemptionRecord } from '@/types/loyaltyRedemption.types';

interface RedemptionHistoryProps {
  redemptions: RedemptionRecord[];
  onViewDetails?: (redemption: RedemptionRecord) => void;
}

export default function RedemptionHistory({ redemptions, onViewDetails }: RedemptionHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'used':
        return '#6B7280';
      case 'expired':
        return '#EF4444';
      case 'cancelled':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'used':
        return 'checkmark-done-circle';
      case 'expired':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'ellipse';
    }
  };

  const renderRedemption = ({ item }: { item: RedemptionRecord }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <Pressable
        style={styles.redemptionCard}
        onPress={() => onViewDetails?.(item)}
       
      >
        <View style={styles.redemptionIcon}>
          <Ionicons name="gift" size={24} color="#8B5CF6" />
        </View>

        <View style={styles.redemptionContent}>
          <ThemedText style={styles.redemptionTitle}>{item.reward.title}</ThemedText>
          <ThemedText style={styles.redemptionDate}>
            {new Date(item.redeemedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </ThemedText>

          {item.code && (
            <View style={styles.codeContainer}>
              <ThemedText style={styles.codeLabel}>Code:</ThemedText>
              <ThemedText style={styles.codeValue}>{item.code}</ThemedText>
            </View>
          )}

          {item.expiresAt && item.status === 'active' && (
            <View style={styles.expiryInfo}>
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
              <ThemedText style={styles.expiryText}>
                Expires {new Date(item.expiresAt).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.redemptionRight}>
          <View style={styles.pointsBadge}>
            <Ionicons name="diamond" size={14} color="#F59E0B" />
            <ThemedText style={styles.pointsText}>{item.pointsSpent}</ThemedText>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name={getStatusIcon(item.status)} size={14} color={statusColor} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  if (redemptions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
        <ThemedText style={styles.emptyTitle}>No redemptions yet</ThemedText>
        <ThemedText style={styles.emptyText}>
          Your redeemed rewards will appear here
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={redemptions}
      renderItem={renderRedemption}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={Platform.OS !== 'web'}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={8}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  redemptionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  redemptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  redemptionContent: {
    flex: 1,
  },
  redemptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  redemptionDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  codeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#92400E',
  },
  redemptionRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
