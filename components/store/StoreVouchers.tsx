// StoreVouchers.tsx
// Horizontal scrollable voucher carousel for store vouchers

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import storeVouchersApi, { StoreVoucher } from '@/services/storeVouchersApi';
import { useRegion } from '@/contexts/RegionContext';

interface StoreVouchersProps {
  storeId: string;
  storeName: string;
  onVoucherClaim?: (voucher: StoreVoucher) => void;
}

const StoreVouchers: React.FC<StoreVouchersProps> = ({
  storeId,
  storeName,
  onVoucherClaim,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [vouchers, setVouchers] = useState<StoreVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadVouchers();
  }, [storeId]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await storeVouchersApi.getStoreVouchers(storeId, {
        page: 1,
        limit: 10,
      });

      if (response.success && response.data) {
        setVouchers(response.data.vouchers || []);
      }
    } catch (error) {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVoucher = async (voucher: StoreVoucher) => {
    if (voucher.isAssigned) {
      platformAlertSimple('Already Claimed', 'You have already claimed this voucher');
      return;
    }

    if (!voucher.canRedeem) {
      platformAlertSimple('Cannot Claim', voucher.redeemReason || 'This voucher cannot be claimed at the moment');
      return;
    }

    setClaimingId(voucher._id);
    try {
      const response = await storeVouchersApi.claimVoucher(voucher._id);

      if (response.success) {
        platformAlertSimple('Success', 'Voucher claimed successfully!');
        // Update local state
        setVouchers(prev =>
          prev.map(v =>
            v._id === voucher._id ? { ...v, isAssigned: true, canRedeem: false } : v
          )
        );
        onVoucherClaim?.(voucher);
      } else {
        platformAlertSimple('Error', response.message || 'Failed to claim voucher');
      }
    } catch (error: any) {
      platformAlertSimple('Error', error.message || 'Failed to claim voucher');
    } finally {
      setClaimingId(null);
    }
  };

  const formatDiscount = (voucher: StoreVoucher) => {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}% OFF`;
    }
    return `${currencySymbol}${voucher.discountValue} OFF`;
  };

  const formatExpiry = (date: string) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Available Vouchers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.voucherCard, styles.skeletonCard]}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '60%' }]} />
              <View style={[styles.skeletonLine, { width: '80%' }]} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (vouchers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Available Vouchers</Text>
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No vouchers available</Text>
          <Text style={styles.emptySubtext}>Check back later for new offers</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Available Vouchers</Text>
        <Text style={styles.voucherCount}>{vouchers.length} vouchers</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {vouchers.map((voucher) => {
          const isExpiringSoon = new Date(voucher.validUntil).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
          const isClaiming = claimingId === voucher._id;

          return (
            <View key={voucher._id} style={styles.voucherCard}>
              {/* Discount Badge */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{formatDiscount(voucher)}</Text>
              </View>

              {/* Voucher Content */}
              <View style={styles.voucherContent}>
                <Text style={styles.voucherName} numberOfLines={2}>
                  {voucher.name}
                </Text>

                {voucher.description && (
                  <Text style={styles.voucherDescription} numberOfLines={2}>
                    {voucher.description}
                  </Text>
                )}

                {/* Min Purchase */}
                {voucher.minBillAmount > 0 && (
                  <View style={styles.minPurchaseContainer}>
                    <Ionicons name="cart-outline" size={14} color="#6B7280" />
                    <Text style={styles.minPurchaseText}>
                      Min purchase: {currencySymbol}{voucher.minBillAmount}
                    </Text>
                  </View>
                )}

                {/* Expiry */}
                <View style={[styles.expiryContainer, isExpiringSoon && styles.expiryUrgent]}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isExpiringSoon ? '#EF4444' : '#6B7280'}
                  />
                  <Text style={[styles.expiryText, isExpiringSoon && styles.expiryTextUrgent]}>
                    {formatExpiry(voucher.validUntil)}
                  </Text>
                </View>

                {/* Terms */}
                {voucher.restrictions && (
                  <View style={styles.termsContainer}>
                    <Ionicons name="information-circle-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.termsText} numberOfLines={1}>
                      {voucher.restrictions.isOfflineOnly ? 'Offline only' : 'Online & offline'}
                      {voucher.restrictions.singleVoucherPerBill ? ' • One per bill' : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Claim Button */}
              <Pressable
                style={[
                  styles.claimButton,
                  (voucher.isAssigned || !voucher.canRedeem) && styles.claimButtonDisabled,
                ]}
                onPress={() => handleClaimVoucher(voucher)}
                disabled={isClaiming || voucher.isAssigned || !voucher.canRedeem}
               
              >
                {isClaiming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.claimButtonText}>
                    {voucher.isAssigned ? 'Claimed' : 'Claim Now'}
                  </Text>
                )}
              </Pressable>

              {/* Voucher Code (if claimed) */}
              {voucher.isAssigned && (
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Code:</Text>
                  <Text style={styles.codeText}>{voucher.code}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  voucherCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  voucherCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  discountBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voucherContent: {
    marginBottom: 12,
  },
  voucherName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  voucherDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  minPurchaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  minPurchaseText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  expiryUrgent: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiryTextUrgent: {
    color: '#EF4444',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  claimButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Skeleton
  skeletonCard: {
    backgroundColor: '#F3F4F6',
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
});

export default React.memo(StoreVouchers);
