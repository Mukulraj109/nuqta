/**
 * PaymentFailureModal
 *
 * Bottom-sheet style modal shown when a payment attempt fails.
 * Suggests alternate payment methods and allows retry.
 */

import React from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

export interface PaymentFailureModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSwitchMethod: (method: 'cod' | 'wallet' | 'razorpay') => void;
  failedMethod?: string | null;
  errorMessage?: string | null;
}

const METHODS: {
  key: 'wallet' | 'razorpay' | 'cod';
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    key: 'wallet',
    label: 'Pay with Wallet',
    subtitle: `Use your ${BRAND.COIN_NAME} balance`,
    icon: 'wallet-outline',
    iconColor: '#FFFFFF',
    iconBg: '#8B5CF6',
  },
  {
    key: 'razorpay',
    label: 'Pay with UPI/Card',
    subtitle: 'UPI, Credit/Debit Card, Net Banking',
    icon: 'card-outline',
    iconColor: '#FFFFFF',
    iconBg: '#3B82F6',
  },
  {
    key: 'cod',
    label: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    icon: 'cash-outline',
    iconColor: '#FFFFFF',
    iconBg: '#F59E0B',
  },
];

const PaymentFailureModal: React.FC<PaymentFailureModalProps> = ({
  visible,
  onClose,
  onRetry,
  onSwitchMethod,
  failedMethod,
  errorMessage,
}) => {
  const alternates = METHODS.filter((m) => m.key !== failedMethod);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </Pressable>

          {/* Error icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={36} color="#EF4444" />
          </View>

          {/* Title + message */}
          <ThemedText style={styles.title}>Payment Failed</ThemedText>
          <ThemedText style={styles.message}>
            {errorMessage || 'Your payment could not be processed.'}
          </ThemedText>
          <ThemedText style={styles.hint}>
            Your cart is saved — try another payment method
          </ThemedText>

          {/* Alternate methods */}
          <View style={styles.methodsWrap}>
            {alternates.map((m) => (
              <Pressable
                key={m.key}
                style={styles.methodRow}
                onPress={() => onSwitchMethod(m.key)}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.iconBg }]}>
                  <Ionicons name={m.icon} size={20} color={m.iconColor} />
                </View>
                <View style={styles.methodTextWrap}>
                  <ThemedText style={styles.methodLabel}>{m.label}</ThemedText>
                  <ThemedText style={styles.methodSub}>{m.subtitle}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>

          {/* Retry button */}
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <ThemedText style={styles.retryText}>Try Again</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(PaymentFailureModal);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
  },

  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 16,
  },

  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  message: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
  },

  hint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },

  methodsWrap: {
    width: '100%',
    marginBottom: 16,
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      },
    }),
  },

  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  methodTextWrap: {
    flex: 1,
  },

  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  methodSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
  },

  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
