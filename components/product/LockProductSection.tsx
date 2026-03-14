/**
 * LockProductSection Component
 *
 * Inline lock section that replaces the modal approach
 * Features:
 * - "Lock this product now" header with badge
 * - Description of lock feature
 * - Duration selection chips (2hr/4hr/8hr)
 * - Lock button
 * - "What happens after locking" info
 * - "Price Protected" badge
 *
 * Based on reference design from ProductPage redesign
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { triggerImpact, triggerNotification } from '@/utils/haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletContext';
import cartService from '@/services/cartApi';
import { useCart } from '@/contexts/CartContext';
import DurationChips, {
  LockDuration,
  LOCK_FEE_PERCENTAGES,
  calculateLockFee,
} from './DurationChips';
import { useRegion } from '@/contexts/RegionContext';

interface LockProductSectionProps {
  /** Product ID */
  productId: string;
  /** Product name */
  productName: string;
  /** Product price */
  productPrice: number;
  /** Quantity */
  quantity: number;
  /** Variant (optional) */
  variant?: { type: string; value: string };
  /** Currency symbol */
  currency?: string;
  /** Callback on successful lock */
  onLockSuccess?: (lockDetails: {
    lockFee: number;
    duration: number;
    expiresAt: string;
    message: string;
  }) => void;
  /** Callback to add to cart without lock */
  onAddToCart?: () => void;
  /** Custom style */
  style?: any;
}

// What happens after locking - info items
const LOCK_INFO_ITEMS = [
  { number: 1, text: 'Product is reserved under your name' },
  { number: 2, text: 'Price is locked — no changes' },
  { number: 3, text: 'Store is notified instantly' },
  { number: 4, text: 'You choose how to complete purchase' },
];

export const LockProductSection: React.FC<LockProductSectionProps> = ({
  productId,
  productName,
  productPrice,
  quantity,
  variant,
  currency,
  onLockSuccess,
  onAddToCart,
  style,
}) => {
  const { getCurrencySymbol, getLocale } = useRegion();
  const locale = getLocale();
  const currencySymbol = currency || getCurrencySymbol();
  const { state: authState } = useAuth();
  const { availableBalance, refreshWallet } = useWalletContext();
  const { actions: cartActions } = useCart();

  // Check if product is already in cart (this is the source of truth)
  const isInCart = cartActions.isItemInCart(productId);

  const [selectedDuration, setSelectedDuration] = useState<LockDuration>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const totalPrice = productPrice * quantity;
  const lockFee = calculateLockFee(totalPrice, selectedDuration);
  const walletBalance = availableBalance || 0;
  const hasEnoughBalance = walletBalance >= lockFee;

  // Refresh wallet on mount
  useEffect(() => {
    refreshWallet();
  }, []);

  const handleLock = useCallback(async () => {
    if (!hasEnoughBalance) {
      setError(`Insufficient wallet balance. You need ${currencySymbol}${lockFee} but have ${currencySymbol}${walletBalance}`);
      return;
    }

    if (!authState.isAuthenticated) {
      setError('Please login to lock this product');
      return;
    }

    setIsLoading(true);
    setError(null);
    triggerImpact('Medium');

    try {
      const response = await cartService.lockItemWithPayment({
        productId,
        quantity,
        variant,
        duration: selectedDuration as any, // Backend will be updated to accept 2|4|8
        paymentMethod: 'wallet',
      });

      if (response.success && response.data) {
        triggerNotification('Success');
        onLockSuccess?.({
          lockFee: response.data.lockDetails.lockFee,
          duration: response.data.lockDetails.duration,
          expiresAt: response.data.lockDetails.expiresAt,
          message: response.data.lockDetails.message,
        });
      } else {
        setError(response.error || 'Failed to lock item');
        triggerNotification('Error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to lock item. Please try again.');
      triggerNotification('Error');
    } finally {
      setIsLoading(false);
    }
  }, [
    productId,
    quantity,
    variant,
    selectedDuration,
    hasEnoughBalance,
    lockFee,
    walletBalance,
    authState.isAuthenticated,
    onLockSuccess,
    currency,
  ]);

  // Handler for adding to cart without lock
  const handleAddToCart = useCallback(async () => {
    if (!onAddToCart || isAddingToCart || isInCart) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart();
      setIsAddingToCart(false);
      triggerNotification('Success');
    } catch (err) {
      triggerNotification('Error');
      setIsAddingToCart(false);
    }
  }, [onAddToCart, isAddingToCart, isInCart]);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
       
      >
        <View style={styles.headerLeft}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={20} color="#ffcd57" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Lock this product now</Text>
            <View style={styles.badgeRow}>
              <View style={styles.uniqueBadge}>
                <Text style={styles.uniqueBadgeText}>Unique Feature</Text>
              </View>
            </View>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#6B7280"
        />
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>
              Pay just <Text style={styles.descriptionHighlight}>{LOCK_FEE_PERCENTAGES[selectedDuration]}%</Text> to reserve this product for a few hours. Visit the store or choose delivery later — <Text style={styles.descriptionHighlight}>price stays locked.</Text>
            </Text>
          </View>

          {/* Duration Chips */}
          <DurationChips
            selectedDuration={selectedDuration}
            onSelectDuration={setSelectedDuration}
            productPrice={totalPrice}
            currency={currencySymbol}
            style={styles.durationChips}
          />

          {/* Lock Button */}
          <Pressable
            style={[
              styles.lockButton,
              (!hasEnoughBalance || isLoading) && styles.lockButtonDisabled,
            ]}
            onPress={handleLock}
            disabled={!hasEnoughBalance || isLoading}
           
          >
            <LinearGradient
              colors={hasEnoughBalance && !isLoading ? ['#ffcd57', '#E6B84E'] : ['#9CA3AF', '#6B7280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.lockButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                  <Text style={styles.lockButtonText}>
                    Lock Product for {currencySymbol}{lockFee.toLocaleString(locale)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Insufficient Balance Warning */}
          {!hasEnoughBalance && (
            <View style={styles.insufficientBalanceSection}>
              <View style={styles.warningCard}>
                <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Add {currencySymbol}{(lockFee - walletBalance).toFixed(0)} to your wallet to lock this price
                </Text>
              </View>

              {/* Divider with OR */}
              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Add to Cart without Lock */}
              <Pressable
                style={[
                  styles.addToCartButton,
                  isInCart && styles.addToCartButtonSuccess,
                ]}
                onPress={handleAddToCart}
               
                disabled={isAddingToCart || isInCart}
              >
                {isAddingToCart ? (
                  <ActivityIndicator size="small" color="#1a3a52" />
                ) : isInCart ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    <Text style={styles.addToCartTextSuccess}>Added to Cart</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={20} color="#1a3a52" />
                    <Text style={styles.addToCartText}>Add to Cart without Lock</Text>
                  </>
                )}
              </Pressable>
              {!isInCart && (
                <Text style={styles.addToCartHint}>
                  Price may change • No reservation
                </Text>
              )}
              {isInCart && (
                <Text style={styles.addToCartSuccessHint}>
                  Product added! Go to cart to checkout.
                </Text>
              )}
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* What happens after locking */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What happens after locking:</Text>
            {LOCK_INFO_ITEMS.map((item) => (
              <View key={item.number} style={styles.infoItem}>
                <View style={styles.infoNumber}>
                  <Text style={styles.infoNumberText}>{item.number}</Text>
                </View>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Price Protected Badge */}
          <View style={styles.protectedBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#ffcd57" />
            <Ionicons name="lock-closed" size={14} color="#F59E0B" style={{ marginLeft: -4 }} />
            <Text style={styles.protectedText}>Price Protected</Text>
          </View>
        </View>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <View style={styles.collapsedPreview}>
          <Text style={styles.collapsedText}>
            Pay {LOCK_FEE_PERCENTAGES[4]}% to reserve • Price stays locked
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E8F5EE',
    overflow: 'hidden',
    shadowColor: '#ffcd57',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F0FDF4',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  lockIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },

  badgeRow: {
    flexDirection: 'row',
  },

  uniqueBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  uniqueBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Content
  content: {
    padding: 16,
    paddingTop: 0,
  },

  descriptionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },

  descriptionHighlight: {
    fontWeight: '700',
    color: '#ffcd57',
  },

  durationChips: {
    marginBottom: 16,
  },

  // Lock Button
  lockButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#ffcd57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  lockButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
  },

  lockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },

  lockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Insufficient Balance Section
  insufficientBalanceSection: {
    marginBottom: 12,
  },

  // Warning/Error Cards
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
    fontWeight: '500',
  },

  // OR Divider
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  orText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginHorizontal: 12,
  },

  // Add to Cart Button
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  addToCartText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a3a52',
  },

  addToCartHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },

  addToCartButtonSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },

  addToCartTextSuccess: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16A34A',
  },

  addToCartSuccessHint: {
    fontSize: 11,
    color: '#16A34A',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 12,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },

  // Info Section
  infoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffcd57',
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },

  // Protected Badge
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },

  protectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffcd57',
  },

  // Collapsed Preview
  collapsedPreview: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  collapsedText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default React.memo(LockProductSection);
