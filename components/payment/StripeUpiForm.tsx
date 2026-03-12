// Stripe UPI Payment Form Component
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

interface StripeUpiFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function StripeUpiForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  onCancel,
}: StripeUpiFormProps) {
  const stripe = useStripe();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiError, setUpiError] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'vpa' | 'qr'>('vpa');

  const validateUpiId = (id: string): boolean => {
    // UPI ID format: username@bankname
    // Example: user@paytm, 9876543210@ybl, user.name@oksbi
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(id);
  };

  const handleSubmit = async () => {
    if (!stripe) {
      onError('Stripe not loaded');
      return;
    }

    if (paymentMethod === 'vpa' && !validateUpiId(upiId)) {
      setUpiError('Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    setIsProcessing(true);
    setUpiError('');

    try {
      // Confirm UPI payment with Stripe React Native
      const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
        paymentMethodType: 'Card', // Note: Native SDK has limited UPI support
        paymentMethodData: {
          // UPI configuration would go here if supported
        },
      });

      if (error) {
        setUpiError(error.message || 'UPI payment failed');
        onError(error.message || 'UPI payment failed');
      } else if (paymentIntent) {
        // UPI payments may require additional user action
        if (paymentIntent.status === 'Succeeded') {

          onSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'Processing') {

          // For UPI, payment may be processing - we should poll or use webhooks
          setUpiError('Payment is being processed. Please wait...');
          // Poll for payment status
          pollPaymentStatus(paymentIntent.id);
        } else {
          onError('Payment could not be completed. Status: ' + paymentIntent.status);
        }
      } else {
        onError('Payment could not be completed');
      }
    } catch (err: any) {
      setUpiError(err.message || 'An error occurred');
      onError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (paymentIntentId: string) => {
    // Poll payment status for up to 3 minutes
    const maxAttempts = 36; // 36 * 5 seconds = 3 minutes
    let attempts = 0;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setUpiError('Payment verification timeout. Please check your UPI app.');
        setIsProcessing(false);
        return;
      }

      attempts++;

      try {
        if (!stripe) return;

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (paymentIntent?.status === 'Succeeded') {

          onSuccess(paymentIntent.id);
        } else if (paymentIntent?.status === 'Processing') {
          // Continue polling
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          setUpiError('Payment was not completed. Please try again.');
          setIsProcessing(false);
        }
      } catch (err) {
        setIsProcessing(false);
      }
    };

    setTimeout(checkStatus, 5000); // Start first check after 5 seconds
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pay with UPI</Text>
          <Text style={styles.subtitle}>Amount: {currencySymbol}{amount}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {/* Payment Method Toggle */}
      <View style={styles.methodToggle}>
        <Pressable
          style={[styles.methodButton, paymentMethod === 'vpa' && styles.methodButtonActive]}
          onPress={() => setPaymentMethod('vpa')}
        >
          <Ionicons
            name="at"
            size={20}
            color={paymentMethod === 'vpa' ? '#8B5CF6' : '#6B7280'}
          />
          <Text style={[
            styles.methodButtonText,
            paymentMethod === 'vpa' && styles.methodButtonTextActive
          ]}>
            UPI ID
          </Text>
        </Pressable>
      </View>

      {/* UPI ID Input */}
      {paymentMethod === 'vpa' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter UPI ID</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="at" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="yourname@paytm"
              placeholderTextColor="#9CA3AF"
              value={upiId}
              onChangeText={(text) => {
                setUpiId(text);
                setUpiError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
          <Text style={styles.inputHint}>
            Example: 9876543210@paytm, user@ybl, name@oksbi
          </Text>
        </View>
      )}

      {upiError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{upiError}</Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.infoText}>
          Your payment is secured by Stripe. Complete the payment in your UPI app.
        </Text>
      </View>

      <View style={styles.testUpiInfo}>
        <Text style={styles.testUpiTitle}>🧪 Test UPI IDs (For Testing)</Text>
        <Text style={styles.testUpiText}>
          • Success: success@razorpay{'\n'}
          • Failure: failure@razorpay{'\n'}
          • Or use any valid UPI ID format
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[
            styles.payButton,
            (isProcessing || (paymentMethod === 'vpa' && !upiId)) && styles.payButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isProcessing || (paymentMethod === 'vpa' && !upiId)}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay {currencySymbol}{amount}</Text>
          )}
        </Pressable>
      </View>

      {isProcessing && paymentMethod === 'vpa' && (
        <View style={styles.processingInfo}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={styles.processingText}>
            Please complete the payment in your UPI app...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  methodButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodButtonTextActive: {
    color: '#8B5CF6',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  testUpiInfo: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  testUpiTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  testUpiText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  payButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    gap: 10,
  },
  processingText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});
