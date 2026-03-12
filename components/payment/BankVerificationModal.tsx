// Bank Verification Modal
// Handles micro-deposit bank account verification

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import paymentVerificationService from '@/services/paymentVerificationService';
import type { BankVerificationResponse, MicroDepositVerification } from '@/types/paymentVerification.types';

interface BankVerificationModalProps {
  visible: boolean;
  paymentMethodId: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function BankVerificationModal({
  visible,
  paymentMethodId,
  accountNumber,
  ifscCode,
  accountHolderName,
  onClose,
  onSuccess,
  onError,
}: BankVerificationModalProps) {
  const [step, setStep] = useState<'initiating' | 'waiting' | 'verifying'>('initiating');
  const [isLoading, setIsLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<BankVerificationResponse | null>(null);
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      initiateVerification();
    }
  }, [visible]);

  const initiateVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStep('initiating');

      const response = await paymentVerificationService.initiateBankVerification({
        paymentMethodId,
        accountNumber,
        ifscCode,
        accountHolderName,
      });

      if (response.success && response.data) {
        setVerificationData(response.data);
        setStep('waiting');
      } else {
        throw new Error(response.error || 'Failed to initiate bank verification');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify bank account');
      onError(err.message || 'Failed to verify bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDeposits = async () => {
    if (!amount1 || !amount2) {
      const errorMsg = 'Please enter both deposit amounts';
      setError(errorMsg);
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        platformAlertSimple('Missing Information', errorMsg);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('verifying');

      const deposits: MicroDepositVerification = {
        amount1: parseFloat(amount1),
        amount2: parseFloat(amount2),
      };

      const response = await paymentVerificationService.verifyMicroDeposits(
        verificationData!.verificationId,
        deposits
      );
      if (response.success && response.data) {
        if (response.data.status === 'VERIFIED') {
          onSuccess();
          setTimeout(onClose, 1500);
        } else {
          throw new Error('Amounts do not match. Please check your bank statement.');
        }
      } else {
        throw new Error(response.error || 'Failed to verify deposits');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify deposits');
      setStep('waiting');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (step === 'initiating' && isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Initiating bank verification...</ThemedText>
        </View>
      );
    }

    if (step === 'waiting' && verificationData) {
      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={32} color="#3B82F6" />
            <ThemedText style={styles.infoTitle}>Micro-Deposit Verification</ThemedText>
            <ThemedText style={styles.infoText}>{verificationData.instructionsText}</ThemedText>
          </View>

          {/* Timeline */}
          <View style={styles.timelineCard}>
            <ThemedText style={styles.sectionTitle}>What happens next?</ThemedText>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineTitle}>Step 1: Wait for deposits</ThemedText>
                <ThemedText style={styles.timelineText}>
                  Two small amounts will be deposited to your account
                </ThemedText>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineTitle}>Step 2: Check your bank</ThemedText>
                <ThemedText style={styles.timelineText}>
                  Look for deposits from "REZ Verification"
                </ThemedText>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineTitle}>Step 3: Enter amounts</ThemedText>
                <ThemedText style={styles.timelineText}>
                  Come back and enter the exact amounts below
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Expected Date */}
          {verificationData.depositsExpectedBy && (
            <View style={styles.dateCard}>
              <Ionicons name="calendar" size={20} color="#8B5CF6" />
              <View style={styles.dateContent}>
                <ThemedText style={styles.dateLabel}>Expected by:</ThemedText>
                <ThemedText style={styles.dateText}>
                  {new Date(verificationData.depositsExpectedBy).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Deposit Amount Inputs */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.sectionTitle}>Enter Deposit Amounts</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Enter the exact amounts you received (in rupees)
            </ThemedText>

            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First deposit amount (e.g., 2.45)"
                placeholderTextColor="#9CA3AF"
                value={amount1}
                onChangeText={setAmount1}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Second deposit amount (e.g., 5.78)"
                placeholderTextColor="#9CA3AF"
                value={amount2}
                onChangeText={setAmount2}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            )}
          </View>

          {/* Verify Button */}
          <Pressable
            style={[styles.verifyButton, (!amount1 || !amount2 || isLoading) && styles.verifyButtonDisabled]}
            onPress={handleVerifyDeposits}
            disabled={!amount1 || !amount2 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.verifyButtonText}>Verify Deposits</ThemedText>
            )}
          </Pressable>

          {/* Help Text */}
          <View style={styles.helpCard}>
            <Ionicons name="help-circle" size={20} color="#6B7280" />
            <ThemedText style={styles.helpText}>
              Can't find the deposits? They may take up to {verificationData.estimatedTime}. Check your bank statement or contact support.
            </ThemedText>
          </View>
        </ScrollView>
      );
    }

    if (step === 'verifying' && isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Verifying amounts...</ThemedText>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Bank Verification</ThemedText>
          <View style={styles.closeButton} />
        </View>

        {renderContent()}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color="#6B7280" />
          <ThemedText style={styles.securityText}>
            Your bank details are encrypted and secure
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dateContent: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  inputSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 8,
  },

  verifyButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 18,
  },

  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
});
