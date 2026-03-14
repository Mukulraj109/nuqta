// components/voucher/PurchaseModal.tsx - Voucher purchase modal

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useVoucherPurchase } from '@/hooks/useVoucherPurchase';
import { useWalletContext } from '@/contexts/WalletContext';
import logger from '@/utils/logger';
import { useRegion } from '@/contexts/RegionContext';

const { width } = Dimensions.get('window');

interface Brand {
  id: string;
  name: string;
  logo: string;
  backgroundColor?: string;
  logoColor?: string;
  cashbackRate: number;
  description?: string;
}

interface PurchaseModalProps {
  visible: boolean;
  brand: Brand | null;
  denominations: number[];
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * PurchaseModal Component
 *
 * Modal for purchasing vouchers with denomination selection
 * Shows wallet balance and handles purchase flow
 *
 * @example
 * <PurchaseModal
 *   visible={showModal}
 *   brand={selectedBrand}
 *   denominations={[100, 500, 1000, 2000]}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => logger.log('Purchased!')}
 * />
 */
export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  visible,
  brand,
  denominations,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { purchaseVoucher, purchasing } = useVoucherPurchase();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const { rezBalance: walletBalance, isLoading: loadingBalance, refreshWallet } = useWalletContext();

  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedAmount, setPurchasedAmount] = useState<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animate and refresh wallet when modal opens
  useEffect(() => {
    if (visible && brand) {
      refreshWallet();
      animateIn();
    } else {
      animateOut();
    }
  }, [visible, brand]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePurchase = async () => {
    logger.log('🎯 [Purchase Modal] handlePurchase called', {
      selectedDenomination,
      brand: brand?.name,
      walletBalance,
      canPurchase
    });

    if (!selectedDenomination || !brand) {
      logger.log('❌ [Purchase Modal] Missing denomination or brand');
      return;
    }

    // Check if sufficient balance
    if (walletBalance < selectedDenomination) {
      const message = `Insufficient Balance\n\nYou need ${currencySymbol}${selectedDenomination - walletBalance} more to purchase this voucher.\n\nCurrent balance: ${currencySymbol}${walletBalance}`;

      // Use window.alert for web compatibility
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
      return;
    }

    // Show confirmation modal
    logger.log('✅ [Purchase Modal] Showing confirmation modal');
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedDenomination || !brand) return;

    setShowConfirmModal(false);
    logger.log('🛒 [Purchase Modal] Confirmed, calling purchaseVoucher API');

    const result = await purchaseVoucher(brand.id, selectedDenomination);

    if (result.success) {
      logger.log('✅ [Purchase Modal] Purchase successful!');

      // Store purchased amount for success modal
      setPurchasedAmount(selectedDenomination);

      // Refresh wallet balance
      await refreshWallet();

      // Show success modal
      setShowSuccessModal(true);

      // Reset denomination
      setSelectedDenomination(null);

      // Call onSuccess callback
      onSuccess?.();
    }
  };

  const handleViewMyVouchers = () => {
    setShowSuccessModal(false);
    onClose();
    router.push('/my-vouchers');
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const handleClose = () => {
    if (!purchasing) {
      setSelectedDenomination(null);
      onClose();
    }
  };

  const canPurchase = selectedDenomination && walletBalance >= selectedDenomination && !purchasing && !loadingBalance;

  if (!brand) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.backdrop}
         
          onPress={handleClose}
          disabled={purchasing}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Purchase Voucher</ThemedText>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              disabled={purchasing}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Brand Info */}
            <View style={styles.brandSection}>
              <LinearGradient
                colors={[
                  brand.backgroundColor || '#F3F4F6',
                  (brand.backgroundColor || '#F3F4F6') + 'DD',
                ]}
                style={[styles.brandLogo, { backgroundColor: brand.backgroundColor || '#F3F4F6' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ThemedText style={[styles.brandLogoText, { color: brand.logoColor || '#000' }]}>
                  {brand.logo}
                </ThemedText>
              </LinearGradient>

              <View style={styles.brandInfo}>
                <ThemedText style={styles.brandName}>{brand.name}</ThemedText>
                {brand.description && (
                  <ThemedText style={styles.brandDescription} numberOfLines={2}>
                    {brand.description}
                  </ThemedText>
                )}
                <View style={styles.cashbackBadge}>
                  <Ionicons name="cash" size={14} color="#ffcd57" />
                  <ThemedText style={styles.cashbackText}>
                    Up to {brand.cashbackRate}% cashback
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Wallet Balance */}
            <View style={styles.walletSection}>
              <View style={styles.walletRow}>
                <View style={styles.walletLabelRow}>
                  <Ionicons name="wallet" size={20} color="#9333EA" />
                  <ThemedText style={styles.walletLabel}>Your Wallet Balance</ThemedText>
                </View>
                {loadingBalance ? (
                  <ActivityIndicator size="small" color="#9333EA" />
                ) : (
                  <ThemedText style={styles.walletBalance}>
                    {currencySymbol}{walletBalance.toLocaleString()}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Denomination Selection */}
            <View style={styles.denominationSection}>
              <ThemedText style={styles.sectionTitle}>Select Denomination</ThemedText>
              <View style={styles.denominationGrid}>
                {denominations.map((amount) => {
                  const isSelected = selectedDenomination === amount;
                  const canAfford = walletBalance >= amount;

                  return (
                    <Pressable
                      key={amount}
                      style={[
                        styles.denominationCard,
                        isSelected && styles.denominationCardSelected,
                        (!canAfford || loadingBalance) && styles.denominationCardDisabled,
                      ]}
                      onPress={() => setSelectedDenomination(amount)}
                      disabled={!canAfford || purchasing || loadingBalance}
                     
                    >
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={20} color="#ffcd57" />
                        </View>
                      )}

                      <ThemedText
                        style={[
                          styles.denominationAmount,
                          isSelected && styles.denominationAmountSelected,
                          !canAfford && styles.denominationAmountDisabled,
                        ]}
                      >
                        {currencySymbol}{amount}
                      </ThemedText>

                      {!canAfford && (
                        <ThemedText style={styles.insufficientLabel}>
                          Insufficient balance
                        </ThemedText>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Purchase Summary */}
            {selectedDenomination && (
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Selected Amount</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {currencySymbol}{selectedDenomination.toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>You'll Pay</ThemedText>
                  <ThemedText style={styles.summaryValueHighlight}>
                    {selectedDenomination} coins
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Balance After</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {currencySymbol}{(walletBalance - selectedDenomination).toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelButton, purchasing && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={purchasing}
             
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.purchaseButton,
                !canPurchase && styles.buttonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={!canPurchase}
             
            >
              <LinearGradient
                colors={canPurchase ? ['#9333EA', '#7C3AED'] : ['#D1D5DB', '#9CA3AF']}
                style={styles.purchaseButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : loadingBalance ? (
                  <ThemedText style={styles.purchaseButtonText}>
                    Loading Balance...
                  </ThemedText>
                ) : !selectedDenomination ? (
                  <ThemedText style={styles.purchaseButtonText}>
                    Select Denomination
                  </ThemedText>
                ) : (
                  <>
                    <Ionicons name="cart" size={20} color="white" />
                    <ThemedText style={styles.purchaseButtonText}>
                      Purchase Now
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#9333EA" />
            <ThemedText style={styles.confirmTitle}>Confirm Purchase</ThemedText>
            <ThemedText style={styles.confirmMessage}>
              Purchase {currencySymbol}{selectedDenomination} {brand?.name} voucher for {selectedDenomination} coins?
            </ThemedText>
            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <ThemedText style={styles.confirmCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.confirmPurchaseButton]}
                onPress={handleConfirmPurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText style={styles.confirmPurchaseText}>Purchase</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.confirmOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#ffcd57" />
            </View>
            <ThemedText style={styles.successTitle}>Purchase Successful!</ThemedText>
            <ThemedText style={styles.successMessage}>
              You've successfully purchased a {currencySymbol}{purchasedAmount} {brand?.name} voucher!
            </ThemedText>
            <ThemedText style={styles.successSubMessage}>
              Your wallet balance has been updated. You can now view and use your voucher.
            </ThemedText>

            <View style={styles.successButtons}>
              <Pressable
                style={[styles.successButton, styles.successViewButton]}
                onPress={handleViewMyVouchers}
              >
                <LinearGradient
                  colors={['#ffcd57', '#1a3a52']}
                  style={styles.successButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="ticket" size={20} color="white" />
                  <ThemedText style={styles.successButtonText}>View My Vouchers</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={[styles.successButton, styles.successCloseButton]}
                onPress={handleSuccessClose}
              >
                <ThemedText style={styles.successCloseText}>Close</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: width - 40,
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 500,
  },
  brandSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    fontSize: 32,
  },
  brandInfo: {
    flex: 1,
    gap: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  brandDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#faf1e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cashbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a3a52',
  },
  walletSection: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9333EA',
  },
  denominationSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  denominationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  denominationCard: {
    width: (width - 64) / 2,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  denominationCardSelected: {
    borderColor: '#1a3a52',
    backgroundColor: '#faf1e0',
  },
  denominationCardDisabled: {
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  denominationAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  denominationAmountSelected: {
    color: '#1a3a52',
  },
  denominationAmountDisabled: {
    color: '#9CA3AF',
  },
  insufficientLabel: {
    fontSize: 11,
    color: '#EF4444',
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: '#F9FAFB',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9333EA',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  purchaseButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Confirmation modal styles
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width - 80,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmPurchaseButton: {
    backgroundColor: '#9333EA',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmPurchaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Success modal styles
  successModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width - 60,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  successSubMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  successButtons: {
    width: '100%',
    gap: 12,
  },
  successButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  successViewButton: {
    elevation: 3,
  },
  successButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  successCloseButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default React.memo(PurchaseModal);
