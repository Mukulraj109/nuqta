// Razorpay Payment Form Component
// Handles Razorpay checkout for subscription payments

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import razorpayService from '@/services/razorpayService';
import type { RazorpayPaymentData } from '@/types/payment.types';
import { useRegion } from '@/contexts/RegionContext';

interface RazorpayPaymentFormProps {
  visible: boolean;
  paymentUrl: string;
  orderId: string;
  amount: number;
  currency?: string;
  tier: 'premium' | 'vip';
  billingCycle: 'monthly' | 'yearly';
  userDetails?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentData: RazorpayPaymentData) => void;
  onFailure: (error: Error) => void;
  onClose: () => void;
}

export default function RazorpayPaymentForm({
  visible,
  paymentUrl,
  orderId,
  amount,
  currency = 'INR',
  tier,
  billingCycle,
  userDetails,
  onSuccess,
  onFailure,
  onClose,
}: RazorpayPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  // Check if Razorpay is configured
  const isConfigured = razorpayService.isConfigured();

  useEffect(() => {
    if (visible && isConfigured) {
      // Auto-initiate payment when modal opens
      handlePayment();
    }
  }, [visible]);

  const handlePayment = async () => {
    if (!isConfigured) {
      setError('Razorpay is not properly configured. Please check your environment settings.');
      setPaymentStatus('failed');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      setError(null);

      // Create Razorpay order
      const order = await razorpayService.createOrder(
        orderId,
        amount,
        currency,
        {
          tier,
          billingCycle,
          type: 'subscription',
        }
      );

      // Open Razorpay checkout
      const paymentData = await razorpayService.openCheckout(
        order,
        userDetails,
        {
          tier,
          billingCycle,
          orderId,
        }
      );

      // Payment successful
      setPaymentStatus('success');
      setIsProcessing(false);

      // Call success callback
      onSuccess(paymentData);
    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.');
      setPaymentStatus('failed');
      setIsProcessing(false);

      // Call failure callback
      onFailure(error);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPaymentStatus('idle');
    handlePayment();
  };

  const handleClose = () => {
    setError(null);
    setPaymentStatus('idle');
    setIsProcessing(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#EC4899']}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ThemedText style={styles.modalTitle}>Subscription Payment</ThemedText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          <View style={styles.modalBody}>
            {/* Payment Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Plan:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {tier === 'vip' ? 'VIP' : 'Premium'}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Billing:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </ThemedText>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total Amount:</ThemedText>
                <ThemedText style={styles.totalValue}>{currencySymbol}{amount}</ThemedText>
              </View>
            </View>

            {/* Status Display */}
            {paymentStatus === 'processing' && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <ThemedText style={styles.statusText}>Processing Payment...</ThemedText>
                <ThemedText style={styles.statusSubtext}>
                  Please complete the payment in the Razorpay window
                </ThemedText>
              </View>
            )}

            {paymentStatus === 'failed' && error && (
              <View style={styles.errorContainer}>
                <Ionicons name="close-circle" size={48} color="#EF4444" />
                <ThemedText style={styles.errorTitle}>Payment Failed</ThemedText>
                <ThemedText style={styles.errorText}>{error}</ThemedText>

                <Pressable style={styles.retryButton} onPress={handleRetry}>
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.retryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.retryButtonText}>Retry Payment</ThemedText>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {!isConfigured && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#F59E0B" />
                <ThemedText style={styles.errorTitle}>Configuration Error</ThemedText>
                <ThemedText style={styles.errorText}>
                  Razorpay is not configured. Please contact support.
                </ThemedText>
              </View>
            )}

            {/* Cancel Button */}
            {paymentStatus !== 'processing' && (
              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
            )}
          </View>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#ffcd57" />
            <ThemedText style={styles.securityText}>
              Secured by Razorpay
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#faf1e0',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#ffcd57',
    fontWeight: '600',
  },
});
