/**
 * CompletePurchaseSection Component
 *
 * Three purchase options:
 * 1. Visit Store & Buy
 * 2. 60-Minute Delivery (Coming Soon)
 * 3. Buy Online
 *
 * Based on reference design from ProductPage redesign
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { triggerImpact } from '@/utils/haptics';
import { useRegion } from '@/contexts/RegionContext';
import { BRAND } from '@/constants/brand';

interface StoreInfo {
  name: string;
  address?: string;
  city?: string;
  openTime?: string;
  closeTime?: string;
  latitude?: number;
  longitude?: number;
}

interface CompletePurchaseSectionProps {
  /** Store information */
  storeInfo?: StoreInfo;
  /** Delivery fee */
  deliveryFee?: number;
  /** Product ID for buy action */
  productId: string;
  /** Currency symbol */
  currency?: string;
  /** Callback for Visit Store */
  onVisitStore?: () => void;
  /** Callback for Buy Online */
  onBuyOnline?: () => void;
  /** Custom style */
  style?: any;
}

export const CompletePurchaseSection: React.FC<CompletePurchaseSectionProps> = ({
  storeInfo,
  deliveryFee = 49,
  productId,
  currency,
  onVisitStore,
  onBuyOnline,
  style,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = currency || getCurrencySymbol();
  const router = useRouter();

  const handleVisitStore = () => {
    triggerImpact('Light');
    if (onVisitStore) {
      onVisitStore();
    } else if (storeInfo?.latitude && storeInfo?.longitude) {
      // Open maps with store location
      const scheme = Platform.select({
        ios: 'maps:0,0?q=',
        android: 'geo:0,0?q=',
      });
      const latLng = `${storeInfo.latitude},${storeInfo.longitude}`;
      const label = encodeURIComponent(storeInfo.name || 'Store');
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      if (url) { try { Linking.openURL(url); } catch (e) {} }
    }
  };

  const handleBuyOnline = () => {
    triggerImpact('Light');
    if (onBuyOnline) {
      onBuyOnline();
    } else {
      router.push('/cart');
    }
  };

  const storeHours = storeInfo?.openTime && storeInfo?.closeTime
    ? `${storeInfo.openTime} - ${storeInfo.closeTime}`
    : '10 AM - 9 PM';

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Complete Your Purchase</Text>

      {/* Option 1: Visit Store & Buy */}
      <View style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.iconContainer, styles.iconStore]}>
            <Ionicons name="storefront" size={22} color="#14B8A6" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Visit Store & Buy</Text>
            <Text style={styles.optionSubtitle}>Product reserved for you</Text>
          </View>
        </View>

        {/* Store Details */}
        <View style={styles.storeDetails}>
          <View style={styles.storeDetailRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.storeDetailText}>
              {storeInfo?.name || 'Store'}, {storeInfo?.city || 'Bangalore'}
            </Text>
          </View>
          <View style={styles.storeDetailRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.storeDetailText}>Open: {storeHours}</Text>
          </View>
        </View>

        {/* Visit Store Button */}
        <Pressable
          style={styles.visitStoreButton}
          onPress={handleVisitStore}
         
        >
          <Ionicons name="storefront-outline" size={18} color="#FFFFFF" />
          <Text style={styles.visitStoreButtonText}>Visit Store</Text>
        </Pressable>

        <Text style={styles.storeHint}>
          {`Scan ${BRAND.APP_NAME} QR at store for instant checkout`}
        </Text>
      </View>

      {/* Option 2: 60-Minute Delivery (Coming Soon) */}
      <View style={[styles.optionCard, styles.optionDisabled]}>
        <View style={styles.comingSoonBanner}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>

        <View style={styles.optionHeader}>
          <View style={[styles.iconContainer, styles.iconDelivery]}>
            <Ionicons name="flash" size={22} color="#A855F7" />
          </View>
          <View style={styles.optionInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.optionTitle}>60-Minute Delivery</Text>
              <View style={styles.fastBadge}>
                <Text style={styles.fastBadgeText}>Fast</Text>
              </View>
            </View>
            <Text style={styles.optionSubtitle}>Get it delivered to your doorstep</Text>
          </View>
        </View>

        {/* Delivery Fee */}
        <View style={styles.deliveryFeeRow}>
          <Text style={styles.deliveryFeeLabel}>Delivery Fee</Text>
          <Text style={styles.deliveryFeeValue}>{currencySymbol}{deliveryFee}</Text>
        </View>
        <Text style={styles.deliveryHint}>
          {`Returned as ${BRAND.COIN_NAME} after sharing`}
        </Text>

        {/* Disabled Button */}
        <View style={styles.disabledButton}>
          <Ionicons name="bicycle" size={18} color="#9CA3AF" />
          <Text style={styles.disabledButtonText}>Get Delivered in 60 Min</Text>
        </View>
      </View>

      {/* Option 3: Buy Online */}
      <View style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.iconContainer, styles.iconOnline]}>
            <Ionicons name="cart" size={22} color="#374151" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Buy Online</Text>
            <Text style={styles.optionSubtitle}>Standard delivery in 2-3 days</Text>
          </View>
        </View>

        {/* Buy Online Button */}
        <Pressable
          style={styles.buyOnlineButton}
          onPress={handleBuyOnline}
         
        >
          <Ionicons name="bag-check" size={18} color="#FFFFFF" />
          <Text style={styles.buyOnlineButtonText}>Buy Now & Earn Cashback</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },

  // Option Card
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  optionDisabled: {
    opacity: 0.7,
    position: 'relative',
    overflow: 'hidden',
  },

  comingSoonBanner: {
    position: 'absolute',
    top: 10,
    right: -30,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 30,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  iconStore: {
    backgroundColor: '#CCFBF1',
  },

  iconDelivery: {
    backgroundColor: '#F3E8FF',
  },

  iconOnline: {
    backgroundColor: '#F3F4F6',
  },

  optionInfo: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },

  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  fastBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  fastBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Store Details
  storeDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },

  storeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  storeDetailText: {
    fontSize: 13,
    color: '#4B5563',
  },

  // Visit Store Button
  visitStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 10,
  },

  visitStoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  storeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Delivery Fee
  deliveryFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },

  deliveryFeeLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  deliveryFeeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  deliveryHint: {
    fontSize: 12,
    color: '#ffcd57',
    marginBottom: 14,
  },

  // Disabled Button
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },

  disabledButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Buy Online Button
  buyOnlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },

  buyOnlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default React.memo(CompletePurchaseSection);
