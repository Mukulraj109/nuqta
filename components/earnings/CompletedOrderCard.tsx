import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRegion } from '@/contexts/RegionContext';

// Unified type for both Order and StorePayment records
export interface ShareableOrder {
  id: string;
  orderNumber: string;
  type: 'delivery' | 'pickup' | 'dine_in' | 'drive_thru' | 'store_payment';
  typeLabel: string; // "Pay in Store", "Delivery", "Dine In", etc.
  storeName: string;
  storeLogo?: string;
  storeId?: string;
  productName: string;
  productImage?: string;
  totalAmount: number;
  cashbackAmount: number;
  statusLabel: string;
  createdAt: string;
}

// Type tag colors by order type
const TYPE_TAG_CONFIG: Record<ShareableOrder['type'], { bg: string; color: string; icon: string }> = {
  store_payment: { bg: '#EDE9FE', color: '#6D28D9', icon: 'storefront-outline' },
  dine_in: { bg: '#FEF3C7', color: '#B45309', icon: 'restaurant-outline' },
  pickup: { bg: '#DBEAFE', color: '#1D4ED8', icon: 'bag-handle-outline' },
  drive_thru: { bg: '#D1FAE5', color: '#047857', icon: 'car-outline' },
  delivery: { bg: '#FCE7F3', color: '#BE185D', icon: 'bicycle-outline' },
};

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'credited' | null;

interface CompletedOrderCardProps {
  order: ShareableOrder;
  onEarnPress: (order: ShareableOrder) => void;
  alreadyEarned?: boolean;
  submissionStatus?: SubmissionStatus;
}

export default function CompletedOrderCard({
  order,
  onEarnPress,
  alreadyEarned = false,
  submissionStatus = null,
}: CompletedOrderCardProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const imageUri = order.productImage || order.storeLogo;
  const tagConfig = TYPE_TAG_CONFIG[order.type];
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.orderCard}>
        {/* Product/Store Image */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <CachedImage
              source={imageUri}
              style={styles.productImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name={order.type === 'store_payment' ? 'storefront-outline' : 'cube-outline'}
                size={32}
                color="#9CA3AF"
              />
            </View>
          )}
        </View>

        {/* Order Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.orderHeader}>
            <ThemedText style={styles.orderNumber} numberOfLines={1}>
              #{order.orderNumber}
            </ThemedText>
            <View style={styles.statusBadgeSmall}>
              <Ionicons name="checkmark-circle" size={12} color="#1a3a52" />
              <ThemedText style={styles.statusBadgeSmallText}>
                {order.statusLabel}
              </ThemedText>
            </View>
          </View>

          {/* Type Tag */}
          <View style={[styles.typeTag, { backgroundColor: tagConfig.bg }]}>
            <Ionicons name={tagConfig.icon as any} size={11} color={tagConfig.color} />
            <ThemedText style={[styles.typeTagText, { color: tagConfig.color }]}>
              {order.typeLabel}
            </ThemedText>
          </View>

          <ThemedText style={styles.productName} numberOfLines={2}>
            {order.productName}
          </ThemedText>

          <ThemedText style={styles.storeName}>
            {order.type === 'store_payment' ? 'at' : 'from'} {order.storeName}
          </ThemedText>

          <View style={styles.priceRow}>
            <ThemedText style={styles.orderAmount}>
              {currencySymbol}{order.totalAmount.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.orderDate}>
              {orderDate}
            </ThemedText>
          </View>

          {/* Cashback Info */}
          <View style={styles.cashbackInfo}>
            <Ionicons name="gift-outline" size={14} color="#1a3a52" />
            <ThemedText style={styles.cashbackText}>
              Earn {order.cashbackAmount.toFixed(0)} coins
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Earn Button or Status */}
      {submissionStatus === 'pending' ? (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Ionicons name="time-outline" size={16} color="#B45309" />
            <ThemedText style={styles.pendingText}>Pending Review</ThemedText>
          </View>
          <ThemedText style={styles.statusHint}>Will be verified within 24 hours</ThemedText>
        </View>
      ) : submissionStatus === 'approved' || submissionStatus === 'credited' || alreadyEarned ? (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles.earnedBadge]}>
            <Ionicons name="checkmark-circle" size={16} color="#1a3a52" />
            <ThemedText style={styles.earnedText}>
              {submissionStatus === 'credited' ? 'Coins Credited' : 'Approved'}
            </ThemedText>
          </View>
        </View>
      ) : submissionStatus === 'rejected' ? (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles.rejectedBadge]}>
            <Ionicons name="close-circle" size={16} color="#DC2626" />
            <ThemedText style={styles.rejectedText}>Rejected</ThemedText>
          </View>
          <Pressable
            style={styles.retryButton}
            onPress={() => onEarnPress(order)}
           
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.earnButton}
          onPress={() => onEarnPress(order)}
         
          accessibilityLabel={`Earn cashback for order ${order.orderNumber}`}
          accessibilityRole="button"
          accessibilityHint="Opens cashback info modal to submit social media post"
        >
          <LinearGradient
            colors={['#1a3a52', '#2a4a62']}
            style={styles.earnButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="share-social-outline" size={18} color="white" />
            <ThemedText style={styles.earnButtonText}>Earn</ThemedText>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCard: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf1e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a3a52',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 4,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  storeName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cashbackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dfebf7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cashbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a3a52',
  },
  earnButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  earnButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  earnButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf1e0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  earnedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3a52',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B45309',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  rejectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  statusHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
});
