// LockPriceModal.tsx - Lock product with selectable duration & wallet payment
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWalletContext } from '@/contexts/WalletContext';
import cartService, { LockWithPaymentRequest } from '@/services/cartApi';
import { triggerImpact, triggerNotification } from '@/utils/haptics';
import { useRegion } from '@/contexts/RegionContext';
import { DurationChips, LockDuration, LOCK_FEE_PERCENTAGES, calculateLockFee } from './DurationChips';

interface LockPriceModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  variant?: { type: string; value: string };
  onLockSuccess: (lockDetails: {
    lockFee: number;
    duration: number;
    expiresAt: string;
    message: string;
  }) => void;
}

const DEFAULT_DURATION: LockDuration = 4;

const STEPS = [
  'Product is reserved under your name',
  'Price is locked — no changes',
  'Store is notified instantly',
  'You choose how to complete purchase',
];

function LockPriceModal({
  visible,
  onClose,
  productId,
  productName,
  productPrice,
  quantity,
  variant,
  onLockSuccess,
}: LockPriceModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const { availableBalance, refreshWallet } = useWalletContext();

  const [selectedDuration, setSelectedDuration] = useState<LockDuration>(DEFAULT_DURATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = productPrice * quantity;
  const lockFee = calculateLockFee(totalPrice, selectedDuration);
  const lockPercentage = LOCK_FEE_PERCENTAGES[selectedDuration];

  const walletBalance = availableBalance || 0;
  const hasEnoughBalance = walletBalance >= lockFee;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDuration(DEFAULT_DURATION);
      setError(null);
      refreshWallet();
    }
  }, [visible]);

  // Execute the lock operation
  const executeLock = useCallback(async () => {
    if (!hasEnoughBalance) {
      setError(`Insufficient wallet balance. You need ${currencySymbol}${lockFee} but have ${currencySymbol}${walletBalance}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    triggerImpact('Medium');

    try {
      const request: LockWithPaymentRequest = {
        productId,
        quantity,
        variant,
        duration: selectedDuration,
        paymentMethod: 'wallet',
      };

      const response = await cartService.lockItemWithPayment(request);

      if (response.success && response.data) {
        triggerNotification('Success');
        onLockSuccess({
          lockFee: response.data.lockDetails.lockFee,
          duration: response.data.lockDetails.duration,
          expiresAt: response.data.lockDetails.expiresAt,
          message: response.data.lockDetails.message,
        });
        onClose();
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
  }, [productId, quantity, variant, selectedDuration, hasEnoughBalance, lockFee, walletBalance, onLockSuccess, onClose, currencySymbol]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Lock this product now</Text>
              <Text style={styles.headerSubtitle}>Unique Feature</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.description}>
              Pay just <Text style={styles.descriptionBold}>{lockPercentage}%</Text> to reserve this product for a few hours. Visit the store or choose delivery later — <Text style={styles.descriptionBoldGreen}>price stays locked.</Text>
            </Text>

            {/* Duration Chips */}
            <DurationChips
              selectedDuration={selectedDuration}
              onSelectDuration={setSelectedDuration}
              productPrice={totalPrice}
              style={styles.durationChips}
            />

            {/* Lock Action Button */}
            <Pressable
              style={[
                styles.lockButton,
                (isLoading || !hasEnoughBalance) && styles.lockButtonDisabled,
              ]}
              onPress={executeLock}
              disabled={isLoading || !hasEnoughBalance}
             
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
                      {hasEnoughBalance
                        ? `Lock Product for ${currencySymbol}${lockFee}`
                        : 'Insufficient Balance'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Insufficient Balance Warning */}
            {!hasEnoughBalance && !error && (
              <View style={styles.warningContainer}>
                <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Add {currencySymbol}{(lockFee - walletBalance).toFixed(0)} to your wallet to lock this price
                </Text>
              </View>
            )}

            {/* What happens after locking */}
            <View style={styles.stepsSection}>
              <Text style={styles.stepsTitle}>What happens after locking:</Text>
              {STEPS.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Wallet Info */}
            <View style={styles.walletCard}>
              <Ionicons name="wallet-outline" size={20} color="#ffcd57" />
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={[
                  styles.walletBalance,
                  hasEnoughBalance ? styles.balanceSufficient : styles.balanceInsufficient,
                ]}>
                  {currencySymbol}{walletBalance.toFixed(0)}
                </Text>
              </View>
              {hasEnoughBalance ? (
                <Ionicons name="checkmark-circle" size={20} color="#ffcd57" />
              ) : (
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(LockPriceModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
      web: { boxShadow: '0 -4px 12px rgba(0,0,0,0.15)' },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffcd57',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffcd57',
    marginTop: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: 20,
  },
  descriptionBold: {
    fontWeight: '700',
    color: '#111827',
  },
  descriptionBoldGreen: {
    fontWeight: '700',
    color: '#ffcd57',
  },
  durationChips: {
    marginBottom: 20,
  },
  lockButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 8px rgba(26,58,82,0.3)' },
    }),
  },
  lockButtonDisabled: {
    opacity: 0.7,
  },
  lockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  lockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
  },
  stepsSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#faf1e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a3a52',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  walletInfo: {
    flex: 1,
    marginLeft: 10,
  },
  walletLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '700',
  },
  balanceSufficient: {
    color: '#ffcd57',
  },
  balanceInsufficient: {
    color: '#F59E0B',
  },
});
